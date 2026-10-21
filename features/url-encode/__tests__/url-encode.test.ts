import { describe, expect, it } from 'vitest'

import { decodeHtml, decodeUrl, encodeHtml, encodeUrl } from '../lib'

describe('URL encoding', () => {
  it('percent-encodes reserved characters', () => {
    expect(encodeUrl('a b&c=d/e?f')).toBe('a%20b%26c%3Dd%2Fe%3Ff')
  })

  it('encodes non-ASCII text as UTF-8', () => {
    expect(encodeUrl('çay ☕')).toBe('%C3%A7ay%20%E2%98%95')
  })

  it('decodes percent-encoded text', () => {
    expect(decodeUrl('%C3%A7ay%20%E2%98%95')).toEqual({ ok: true, output: 'çay ☕' })
  })

  it('returns an empty string for empty input', () => {
    expect(encodeUrl('')).toBe('')
    expect(decodeUrl('')).toEqual({ ok: true, output: '' })
  })

  it('reports malformed sequences', () => {
    expect(decodeUrl('%E0%A4%A')).toMatchObject({ ok: false })
    expect(decodeUrl('%')).toMatchObject({ ok: false })
  })
})

describe('HTML entities', () => {
  it('escapes the five special characters', () => {
    expect(encodeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;',
    )
  })

  it('leaves plain text untouched', () => {
    expect(encodeHtml('hello çay')).toBe('hello çay')
  })

  it('decodes named, decimal, and hex entities', () => {
    expect(decodeHtml('&lt;b&gt; &amp; &#65; &#x1F680; &copy; &quot;&apos;')).toBe(
      '<b> & A 🚀 © "\'',
    )
  })

  it('does not double-decode', () => {
    expect(decodeHtml('&amp;lt;')).toBe('&lt;')
  })

  it('leaves unknown or invalid entities as-is', () => {
    expect(decodeHtml('&unknown; &#0; &#xD800; &#99999999; &amp')).toBe(
      '&unknown; &#0; &#xD800; &#99999999; &amp',
    )
  })

  it('round-trips encoded text', () => {
    const text = `5 < 6 && "quotes" & 'apostrophes'`
    expect(decodeHtml(encodeHtml(text))).toBe(text)
  })
})
