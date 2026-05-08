import { describe, expect, it } from 'vitest'

import { type SecretFormat, expectedLength, generateSecret } from '../lib'

const FORMATS: SecretFormat[] = ['hex', 'base64', 'base64url', 'alphanumeric']

describe('generateSecret', () => {
  it('hex: correct length and valid chars', () => {
    const s = generateSecret({ format: 'hex', byteLength: 32 })
    expect(s).toHaveLength(64)
    expect(s).toMatch(/^[0-9a-f]+$/)
  })

  it('base64: correct length and valid chars', () => {
    const s = generateSecret({ format: 'base64', byteLength: 32 })
    expect(s).toHaveLength(expectedLength({ format: 'base64', byteLength: 32 }))
    expect(s).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it('base64url: no padding and URL-safe chars only', () => {
    const s = generateSecret({ format: 'base64url', byteLength: 32 })
    expect(s).not.toContain('=')
    expect(s).not.toContain('+')
    expect(s).not.toContain('/')
    expect(s).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it('alphanumeric: correct length and valid chars', () => {
    const s = generateSecret({ format: 'alphanumeric', byteLength: 32 })
    expect(s).toHaveLength(32)
    expect(s).toMatch(/^[A-Za-z0-9]+$/)
  })

  it('all formats produce different values on each call', () => {
    for (const format of FORMATS) {
      const a = generateSecret({ format, byteLength: 32 })
      const b = generateSecret({ format, byteLength: 32 })
      expect(a).not.toBe(b)
    }
  })

  it('byte length slider changes output length proportionally', () => {
    const s16 = generateSecret({ format: 'hex', byteLength: 16 })
    const s32 = generateSecret({ format: 'hex', byteLength: 32 })
    expect(s16).toHaveLength(32)
    expect(s32).toHaveLength(64)
  })
})
