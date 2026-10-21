import { describe, expect, it } from 'vitest'

import { MAX_CONTENT_LENGTH, createPasteSchema, expiryToDate, generateSlug } from '../lib'

describe('expiryToDate', () => {
  it('returns null for "never"', () => {
    expect(expiryToDate('never', Date.now())).toBeNull()
  })

  it('returns 1h offset', () => {
    expect(expiryToDate('1h', 0)?.getTime()).toBe(3_600_000)
  })

  it('returns 7d offset', () => {
    expect(expiryToDate('7d', 0)?.getTime()).toBe(604_800_000)
  })

  it('uses the injected now value', () => {
    expect(expiryToDate('1d', 1000)?.getTime()).toBe(1000 + 86_400_000)
  })
})

describe('createPasteSchema', () => {
  it('rejects empty content', () => {
    const result = createPasteSchema.safeParse({ content: '', expiry: '7d' })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only content', () => {
    const result = createPasteSchema.safeParse({ content: '   ', expiry: '7d' })
    expect(result.success).toBe(false)
  })

  it('rejects content longer than MAX_CONTENT_LENGTH', () => {
    const result = createPasteSchema.safeParse({
      content: 'a'.repeat(MAX_CONTENT_LENGTH + 1),
      expiry: '7d',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid expiry', () => {
    const result = createPasteSchema.safeParse({ content: 'hello', expiry: 'bad' })
    expect(result.success).toBe(false)
  })

  it('accepts valid input and trims content', () => {
    const result = createPasteSchema.safeParse({ content: '  hello  ', expiry: '1d' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('hello')
    }
  })
})

describe('generateSlug', () => {
  it('returns a 10-character string', () => {
    expect(generateSlug()).toHaveLength(10)
  })

  it('uses only base62 characters', () => {
    expect(generateSlug()).toMatch(/^[A-Za-z0-9]+$/)
  })

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()))
    expect(slugs.size).toBe(100)
  })
})
