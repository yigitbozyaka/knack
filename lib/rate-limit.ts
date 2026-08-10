import { sql } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { rateLimits } from '@/lib/db/schema'
import { env } from '@/lib/env'

export interface RateLimitConfig {
  requests: number
  windowMs: number
  prefix: string
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  reset: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE

export const defaultLimiter: RateLimitConfig = {
  requests: 60,
  windowMs: MINUTE,
  prefix: 'default',
}

export const strictLimiter: RateLimitConfig = {
  requests: 10,
  windowMs: MINUTE,
  prefix: 'strict',
}

export const accountCreateLimiter: RateLimitConfig = {
  requests: 5,
  windowMs: HOUR,
  prefix: 'auth:create',
}

export const signInLimiter: RateLimitConfig = {
  requests: 10,
  windowMs: HOUR,
  prefix: 'auth:signin',
}

export const RATE_LIMIT_RETENTION_MS = 24 * HOUR

const BACKEND_TIMEOUT_MS = 1_000

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

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`rate limit backend timed out after ${String(ms)}ms`))
    }, ms)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function consume(key: string, windowStart: Date): Promise<number> {
  const rows = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count })

  return rows[0]?.count ?? 1
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultLimiter,
): Promise<RateLimitResult> {
  const unlimited: RateLimitResult = {
    ok: true,
    limit: config.requests,
    remaining: config.requests,
    reset: 0,
  }

  if (!env.RATE_LIMIT_ENABLED) return unlimited

  try {
    const hashed = await hashIdentifier(identifier)
    const startMs = Math.floor(Date.now() / config.windowMs) * config.windowMs
    const used = await withTimeout(
      consume(`${config.prefix}:${hashed}`, new Date(startMs)),
      BACKEND_TIMEOUT_MS,
    )

    return {
      ok: used <= config.requests,
      limit: config.requests,
      remaining: Math.max(0, config.requests - used),
      reset: startMs + config.windowMs,
    }
  } catch (error) {
    console.error(
      `[rate-limit] backend unavailable for prefix "${config.prefix}", allowing request`,
      error,
    )
    return unlimited
  }
}
