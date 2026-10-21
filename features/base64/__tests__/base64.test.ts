import { describe, expect, it } from 'vitest'

import { decodeBase64, encodeBase64 } from '../lib'

describe('encodeBase64', () => {
  it('encodes ASCII text', () => {
    expect(encodeBase64('hello', false)).toBe('aGVsbG8=')
  })

  it('encodes multi-byte UTF-8 text', () => {
    expect(encodeBase64('héllo wörld ✓', false)).toBe('aMOpbGxvIHfDtnJsZCDinJM=')
  })

  it('returns an empty string for empty input', () => {
    expect(encodeBase64('', false)).toBe('')
  })

  it('produces unpadded url-safe output', () => {
    expect(encodeBase64('subjects?_d', false)).toBe('c3ViamVjdHM/X2Q=')
    expect(encodeBase64('subjects?_d', true)).toBe('c3ViamVjdHM_X2Q')
    expect(encodeBase64('>>>', true)).toBe('Pj4-')
  })

  it('handles inputs larger than one chunk', () => {
    const text = 'a'.repeat(100_000)
    const encoded = encodeBase64(text, false)
    const decoded = decodeBase64(encoded)
    expect(decoded).toEqual({ ok: true, output: text })
  })
})

describe('decodeBase64', () => {
  it('decodes standard base64', () => {
    expect(decodeBase64('aGVsbG8=')).toEqual({ ok: true, output: 'hello' })
  })

  it('decodes url-safe base64 without padding', () => {
    expect(decodeBase64('c3ViamVjdHM_X2Q')).toEqual({ ok: true, output: 'subjects?_d' })
  })

  it('round-trips UTF-8', () => {
    const text = 'çğıöşü 日本語 🚀'
    expect(decodeBase64(encodeBase64(text, true))).toEqual({ ok: true, output: text })
    expect(decodeBase64(encodeBase64(text, false))).toEqual({ ok: true, output: text })
  })

  it('ignores whitespace and line breaks', () => {
    expect(decodeBase64('aGVs\nbG8=')).toEqual({ ok: true, output: 'hello' })
  })

  it('rejects invalid characters', () => {
    expect(decodeBase64('not base64!')).toMatchObject({ ok: false })
  })

  it('rejects impossible lengths', () => {
    expect(decodeBase64('abcde')).toMatchObject({ ok: false })
  })

  it('rejects bytes that are not valid UTF-8', () => {
    expect(decodeBase64('/w==')).toMatchObject({ ok: false })
  })
})
