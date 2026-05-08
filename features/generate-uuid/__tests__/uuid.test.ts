import { describe, expect, it } from 'vitest'

import { generateUuid } from '../lib'

const V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('generateUuid v4', () => {
  it('matches v4 format', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateUuid('v4')).toMatch(V4_RE)
    }
  })

  it('no duplicates in 10k samples', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 10_000; i++) {
      const id = generateUuid('v4')
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
  })
})

describe('generateUuid v7', () => {
  it('matches v7 format', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateUuid('v7')).toMatch(V7_RE)
    }
  })

  it('no duplicates in 10k samples', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 10_000; i++) {
      const id = generateUuid('v7')
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
  })

  it('timestamp prefix is current (within 1s)', () => {
    const before = Date.now()
    const id = generateUuid('v7')
    const after = Date.now()

    // First 12 hex chars encode the 48-bit ms timestamp.
    // parseInt handles 48-bit values safely (< Number.MAX_SAFE_INTEGER).
    const tsHex = id.replace(/-/g, '').slice(0, 12)
    const ts = parseInt(tsHex, 16)

    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after + 1)
  })
})
