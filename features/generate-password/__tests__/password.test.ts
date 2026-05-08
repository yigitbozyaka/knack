import { describe, expect, it } from 'vitest'

import { charsetSize, estimateEntropy, generatePassword, strengthLabel } from '../lib'

const BASE_OPTS = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: false,
  avoidAmbiguous: false,
}

describe('generatePassword', () => {
  it('respects requested length', () => {
    for (const length of [8, 20, 64, 128]) {
      expect(generatePassword({ ...BASE_OPTS, length })).toHaveLength(length)
    }
  })

  it('only contains chars from enabled classes', () => {
    const pw = generatePassword({
      ...BASE_OPTS,
      lowercase: false,
      uppercase: false,
      digits: true,
      symbols: false,
    })
    expect(pw).toMatch(/^[0-9]+$/)
  })

  it('all enabled classes appear in a long password', () => {
    const pw = generatePassword({ ...BASE_OPTS, length: 100, symbols: true })
    expect(pw).toMatch(/[a-z]/)
    expect(pw).toMatch(/[A-Z]/)
    expect(pw).toMatch(/[0-9]/)
    expect(pw).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/)
  })

  it('excludes ambiguous chars when avoidAmbiguous is set', () => {
    const pw = generatePassword({ ...BASE_OPTS, length: 500, avoidAmbiguous: true })
    expect(pw).not.toMatch(/[0OlI1]/)
  })

  it('throws when no character class is enabled', () => {
    expect(() =>
      generatePassword({ ...BASE_OPTS, lowercase: false, uppercase: false, digits: false }),
    ).toThrow()
  })
})

describe('estimateEntropy', () => {
  it('is monotonically increasing with length', () => {
    const size = charsetSize(BASE_OPTS)
    const e8 = estimateEntropy(8, size)
    const e20 = estimateEntropy(20, size)
    const e64 = estimateEntropy(64, size)
    expect(e20).toBeGreaterThan(e8)
    expect(e64).toBeGreaterThan(e20)
  })

  it('is monotonically increasing with charset size', () => {
    const e26 = estimateEntropy(20, 26)
    const e62 = estimateEntropy(20, 62)
    const e94 = estimateEntropy(20, 94)
    expect(e62).toBeGreaterThan(e26)
    expect(e94).toBeGreaterThan(e62)
  })
})

describe('strengthLabel', () => {
  it('returns correct labels', () => {
    expect(strengthLabel(30)).toBe('weak')
    expect(strengthLabel(50)).toBe('fair')
    expect(strengthLabel(70)).toBe('strong')
    expect(strengthLabel(100)).toBe('very strong')
  })
})
