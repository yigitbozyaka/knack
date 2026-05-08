import { describe, expect, it } from 'vitest'

import {
  formatToken,
  generateToken,
  hashToken,
  lookupHash,
  normalizeToken,
  TOKEN_LENGTH,
  verifyToken,
} from '@/lib/auth/token'

describe('generateToken', () => {
  it('produces a token with the expected formatted shape', () => {
    const token = generateToken()
    expect(token).toMatch(/^(\d{4}-){4}\d{4}$/)
    expect(normalizeToken(token)).toHaveLength(TOKEN_LENGTH)
  })

  it('produces unique tokens across many invocations (entropy sanity)', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      seen.add(generateToken())
    }
    expect(seen.size).toBe(1000)
  })

  it('contains only digits and dashes', () => {
    const token = generateToken()
    expect(token.replace(/[\d-]/g, '')).toBe('')
  })
})

describe('formatToken', () => {
  it('groups 20 digits into 5 groups of 4', () => {
    expect(formatToken('12345678901234567890')).toBe('1234-5678-9012-3456-7890')
  })

  it('strips non-digits before formatting', () => {
    expect(formatToken(' 1234 5678-9012-3456-7890 ')).toBe('1234-5678-9012-3456-7890')
  })
})

describe('normalizeToken', () => {
  it('roundtrips: format(normalize(formatted)) === formatted', () => {
    const original = '1234-5678-9012-3456-7890'
    const normalized = normalizeToken(original)
    expect(normalized).toBe('12345678901234567890')
    expect(formatToken(normalized)).toBe(original)
  })

  it('strips spaces and dashes', () => {
    expect(normalizeToken('  1234 - 5678 \t9012-3456-7890')).toBe('12345678901234567890')
  })
})

describe('hashToken / verifyToken', () => {
  it('verifies a token against its hash', async () => {
    const token = generateToken()
    const hash = await hashToken(token)
    expect(await verifyToken(token, hash)).toBe(true)
  })

  it('rejects a different token', async () => {
    const token = generateToken()
    const other = generateToken()
    const hash = await hashToken(token)
    expect(await verifyToken(other, hash)).toBe(false)
  })

  it('verifies regardless of formatting (dashes / whitespace)', async () => {
    const token = generateToken()
    const hash = await hashToken(token)
    const messy = `  ${normalizeToken(token).replace(/(.{4})/g, '$1 ')}`
    expect(await verifyToken(messy, hash)).toBe(true)
  })

  it('returns false rather than throwing on a malformed hash', async () => {
    expect(await verifyToken('1234-5678-9012-3456-7890', 'not-a-real-hash')).toBe(false)
  })
}, 30_000)

describe('lookupHash', () => {
  it('is deterministic for a given token', () => {
    const token = generateToken()
    expect(lookupHash(token)).toBe(lookupHash(token))
  })

  it('treats formatted and normalized tokens as equivalent', () => {
    const token = generateToken()
    expect(lookupHash(token)).toBe(lookupHash(normalizeToken(token)))
  })

  it('produces a 64-char hex string (sha256)', () => {
    expect(lookupHash(generateToken())).toMatch(/^[0-9a-f]{64}$/)
  })

  it('different tokens map to different lookups', () => {
    expect(lookupHash(generateToken())).not.toBe(lookupHash(generateToken()))
  })
})
