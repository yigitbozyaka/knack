import { describe, expect, it } from 'vitest'

import { encodeBase64 } from '@/features/base64/lib'

import { decodeJwt } from '../lib'

function makeToken(header: unknown, payload: unknown, signature = 'c2ln'): string {
  const part = (value: unknown) => encodeBase64(JSON.stringify(value), true)
  return `${part(header)}.${part(payload)}.${signature}`
}

const NOW = new Date('2026-01-01T00:00:00Z')
const NOW_SECONDS = NOW.getTime() / 1000

describe('decodeJwt', () => {
  it('decodes header, payload, and signature', () => {
    const token = makeToken({ alg: 'HS256', typ: 'JWT' }, { sub: '1234', name: 'Çağrı' })
    const result = decodeJwt(token, NOW)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.token.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(result.token.payload).toEqual({ sub: '1234', name: 'Çağrı' })
    expect(result.token.signature).toBe('c2ln')
    expect(result.token.expired).toBe(false)
    expect(result.token.timeClaims).toEqual([])
  })

  it('flags an expired token and renders time claims', () => {
    const token = makeToken(
      { alg: 'HS256' },
      { iat: NOW_SECONDS - 7200, exp: NOW_SECONDS - 3600, nbf: NOW_SECONDS - 7200 },
    )
    const result = decodeJwt(token, NOW)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.token.expired).toBe(true)
    expect(result.token.notYetValid).toBe(false)
    expect(result.token.timeClaims.map((info) => info.claim)).toEqual(['exp', 'iat', 'nbf'])
    expect(result.token.timeClaims[0]?.iso).toBe('2025-12-31T23:00:00.000Z')
  })

  it('does not flag a token that expires in the future', () => {
    const token = makeToken({ alg: 'none' }, { exp: NOW_SECONDS + 60 })
    const result = decodeJwt(token, NOW)
    expect(result.ok && result.token.expired).toBe(false)
  })

  it('flags a token that is not valid yet', () => {
    const token = makeToken({ alg: 'none' }, { nbf: NOW_SECONDS + 60 })
    const result = decodeJwt(token, NOW)
    expect(result.ok && result.token.notYetValid).toBe(true)
  })

  it('ignores non-numeric time claims', () => {
    const token = makeToken({ alg: 'none' }, { exp: 'soon', iat: null })
    const result = decodeJwt(token, NOW)
    expect(result.ok && result.token.timeClaims).toEqual([])
    expect(result.ok && result.token.expired).toBe(false)
  })

  it('accepts surrounding whitespace and an empty signature', () => {
    const token = makeToken({ alg: 'none' }, { a: 1 }, '')
    expect(decodeJwt(`  ${token}\n`, NOW).ok).toBe(true)
  })

  it('rejects tokens without three parts', () => {
    expect(decodeJwt('abc.def', NOW)).toMatchObject({ ok: false })
    expect(decodeJwt('', NOW)).toMatchObject({ ok: false })
  })

  it('rejects segments that are not base64url', () => {
    expect(decodeJwt('!!!.e30.sig', NOW)).toMatchObject({ ok: false })
  })

  it('rejects segments that are not JSON objects', () => {
    const notJson = `${encodeBase64('nope', true)}.e30.sig`
    const notObject = `${encodeBase64('[1,2]', true)}.e30.sig`
    expect(decodeJwt(notJson, NOW)).toMatchObject({ ok: false })
    expect(decodeJwt(notObject, NOW)).toMatchObject({ ok: false })
  })
})
