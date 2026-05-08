import { Ratelimit } from '@upstash/ratelimit'

import { env } from '@/lib/env'
import { redis } from '@/lib/redis/client'

// Knack's rate limiter, layered on Upstash's sliding-window primitive.
//
// Two design choices worth knowing:
//
// 1. Identifiers (typically IPs) are SHA-256 hashed with a daily-rotating
//    salt before becoming Redis keys. So Redis is never a tracking ledger
//    that maps a key back to an IP — keys age out as the salt rotates.
//
// 2. Limiters are memoized per `(prefix, requests, window)` so we don't
//    rebuild a `Ratelimit` instance per request.

type Duration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`

export interface RateLimitConfig {
  requests: number
  window: Duration
  prefix: string
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  /** Unix milliseconds when the limit resets. */
  reset: number
}

export const defaultLimiter: RateLimitConfig = {
  requests: 60,
  window: '60 s',
  prefix: 'default',
}

export const strictLimiter: RateLimitConfig = {
  requests: 10,
  window: '60 s',
  prefix: 'strict',
}

const limiterCache = new Map<string, Ratelimit>()

function buildLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.prefix}:${String(config.requests)}:${config.window}`
  const existing = limiterCache.get(cacheKey)
  if (existing) return existing

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: false,
    prefix: `knack:ratelimit:${config.prefix}`,
  })
  limiterCache.set(cacheKey, limiter)
  return limiter
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function dailySalt(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${env.RATE_LIMIT_SALT}:${today}`
}

async function hashIdentifier(identifier: string): Promise<string> {
  const data = new TextEncoder().encode(`${dailySalt()}:${identifier}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToBase64Url(new Uint8Array(digest)).slice(0, 24)
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultLimiter,
): Promise<RateLimitResult> {
  if (!env.RATE_LIMIT_ENABLED) {
    return { ok: true, limit: config.requests, remaining: config.requests, reset: 0 }
  }

  const hashed = await hashIdentifier(identifier)
  const limiter = buildLimiter(config)
  const result = await limiter.limit(hashed)

  return {
    ok: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
