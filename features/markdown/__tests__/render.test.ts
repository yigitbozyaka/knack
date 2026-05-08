import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '../lib/render'

describe('renderMarkdown — XSS defence', () => {
  it('strips <script> tags', () => {
    const out = renderMarkdown('<script>alert(1)</script>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert')
  })

  it('strips onerror attributes', () => {
    const out = renderMarkdown('<img src="x" onerror="alert(1)">')
    expect(out).not.toContain('onerror')
  })

  it('blocks javascript: links', () => {
    const out = renderMarkdown('[click me](javascript:alert(1))')
    expect(out).not.toContain('javascript:')
  })

  it('strips <iframe>', () => {
    const out = renderMarkdown('<iframe src="https://evil.com"></iframe>')
    expect(out).not.toContain('<iframe')
  })
})

describe('renderMarkdown — happy path', () => {
  it('renders headings', () => {
    expect(renderMarkdown('# Hello')).toContain('<h1')
    expect(renderMarkdown('## World')).toContain('<h2')
  })

  it('renders unordered lists', () => {
    const out = renderMarkdown('- item one\n- item two')
    expect(out).toContain('<ul')
    expect(out).toContain('<li')
  })

  it('renders inline code', () => {
    expect(renderMarkdown('Use `const x = 1`')).toContain('<code>')
  })

  it('renders links with rel and target', () => {
    const out = renderMarkdown('[Knack](https://knack.wtf)')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer nofollow"')
  })
})
