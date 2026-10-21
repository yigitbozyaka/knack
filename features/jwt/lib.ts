import { z } from 'zod'

import { decodeBase64 } from '@/features/base64/lib'

const JsonObjectSchema = z.record(z.string(), z.unknown())
export type JsonObject = z.infer<typeof JsonObjectSchema>

export const TIME_CLAIMS = ['exp', 'iat', 'nbf'] as const
export type TimeClaim = (typeof TIME_CLAIMS)[number]

export interface TimeClaimInfo {
  claim: TimeClaim
  seconds: number
  iso: string
}

export interface DecodedJwt {
  header: JsonObject
  payload: JsonObject
  signature: string
  timeClaims: TimeClaimInfo[]
  expired: boolean
  notYetValid: boolean
}

export type JwtResult = { ok: true; token: DecodedJwt } | { ok: false; error: string }

export function decodeJwt(raw: string, now: Date = new Date()): JwtResult {
  const parts = raw.trim().split('.')
  if (parts.length !== 3) {
    return { ok: false, error: 'A JWT has three dot-separated parts: header.payload.signature.' }
  }
  const [headerPart = '', payloadPart = '', signature = ''] = parts

  const header = parseSegment(headerPart, 'header')
  if (!header.ok) return header
  const payload = parseSegment(payloadPart, 'payload')
  if (!payload.ok) return payload

  const timeClaims = extractTimeClaims(payload.value)
  const nowSeconds = Math.floor(now.getTime() / 1000)
  const exp = timeClaims.find((info) => info.claim === 'exp')
  const nbf = timeClaims.find((info) => info.claim === 'nbf')

  return {
    ok: true,
    token: {
      header: header.value,
      payload: payload.value,
      signature,
      timeClaims,
      expired: exp !== undefined && exp.seconds <= nowSeconds,
      notYetValid: nbf !== undefined && nbf.seconds > nowSeconds,
    },
  }
}

type SegmentResult = { ok: true; value: JsonObject } | { ok: false; error: string }

function parseSegment(segment: string, name: string): SegmentResult {
  const decoded = decodeBase64(segment)
  if (!decoded.ok) return { ok: false, error: `The ${name} is not valid base64url.` }
  let json: unknown
  try {
    json = JSON.parse(decoded.output)
  } catch {
    return { ok: false, error: `The ${name} is not valid JSON.` }
  }
  const parsed = JsonObjectSchema.safeParse(json)
  if (!parsed.success) return { ok: false, error: `The ${name} must be a JSON object.` }
  return { ok: true, value: parsed.data }
}

function extractTimeClaims(payload: JsonObject): TimeClaimInfo[] {
  const infos: TimeClaimInfo[] = []
  for (const claim of TIME_CLAIMS) {
    const value = payload[claim]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    const date = new Date(value * 1000)
    if (Number.isNaN(date.getTime())) continue
    infos.push({ claim, seconds: value, iso: date.toISOString() })
  }
  return infos
}
