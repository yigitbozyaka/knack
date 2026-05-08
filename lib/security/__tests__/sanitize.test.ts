import { describe, expect, it } from 'vitest'

import { escapeHtml, stripHtmlTags } from '@/lib/security/sanitize'

describe('escapeHtml', () => {
  it('escapes the five HTML special characters', () => {
    expect(escapeHtml(`<script>alert("hi")</script>`)).toBe(
      '&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;',
    )
  })

  it('escapes ampersands without double-encoding', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml(`it's`)).toBe('it&#39;s')
  })

  it('returns plain strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('handles empty input', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('stripHtmlTags', () => {
  it('removes simple tags but keeps content', () => {
    expect(stripHtmlTags('<b>hello</b>')).toBe('hello')
  })

  it('removes nested tags', () => {
    expect(stripHtmlTags('<div><span>x</span></div>')).toBe('x')
  })

  it('removes self-closing tags', () => {
    expect(stripHtmlTags('a<br/>b')).toBe('ab')
  })

  it('does not execute or evaluate tag contents', () => {
    expect(stripHtmlTags('<script>alert(1)</script>plain')).toBe('alert(1)plain')
  })

  it('passes plain text unchanged', () => {
    expect(stripHtmlTags('no tags here')).toBe('no tags here')
  })
})
