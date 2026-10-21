import { describe, expect, it } from 'vitest'

import { MAX_INPUT_LENGTH, computeDiff } from '../lib'

function ok(oldText: string, newText: string, mode: 'line' | 'word') {
  const result = computeDiff(oldText, newText, mode)
  if (!result.ok) throw new Error(result.error)
  return result
}

describe('line diff', () => {
  it('reports identical inputs as unchanged', () => {
    const result = ok('a\nb\n', 'a\nb\n', 'line')
    expect(result.stats).toEqual({ added: 0, removed: 0, unchanged: 2 })
    expect(result.unified.every((row) => row.kind === 'context')).toBe(true)
  })

  it('detects added and removed lines with line numbers', () => {
    const result = ok('a\nb\nc\n', 'a\nc\nd\n', 'line')
    expect(result.stats).toEqual({ added: 1, removed: 1, unchanged: 2 })
    expect(result.unified.map((row) => [row.kind, row.oldLine, row.newLine])).toEqual([
      ['context', 1, 1],
      ['remove', 2, null],
      ['context', 3, 2],
      ['add', null, 3],
    ])
  })

  it('pairs a replaced line in side-by-side with word-level highlights', () => {
    const result = ok('the quick fox\n', 'the slow fox\n', 'line')
    expect(result.split).toHaveLength(1)
    const row = result.split[0]
    expect(row?.left?.segments.filter((s) => s.kind === 'remove').map((s) => s.text)).toEqual([
      'quick',
    ])
    expect(row?.right?.segments.filter((s) => s.kind === 'add').map((s) => s.text)).toEqual([
      'slow',
    ])
  })

  it('leaves the opposite side empty for pure additions', () => {
    const result = ok('a\n', 'a\nb\n', 'line')
    expect(result.split[1]?.left).toBeNull()
    expect(result.split[1]?.right?.kind).toBe('add')
  })

  it('treats CRLF and LF as equal', () => {
    expect(ok('a\r\nb', 'a\nb', 'line').stats.added).toBe(0)
  })

  it('ignores a missing final newline on either side', () => {
    const result = ok('a\nb', 'a\nb\nc', 'line')
    expect(result.stats).toEqual({ added: 1, removed: 0, unchanged: 2 })
  })

  it('handles empty inputs', () => {
    const result = ok('', '', 'line')
    expect(result.unified).toEqual([])
    expect(ok('', 'x\ny', 'line').stats.added).toBe(2)
  })
})

describe('word diff', () => {
  it('marks changed words inline', () => {
    const result = ok('hello big world', 'hello small world', 'word')
    const segments = result.unified[0]?.segments ?? []
    expect(segments.filter((s) => s.kind === 'remove').map((s) => s.text)).toEqual(['big'])
    expect(segments.filter((s) => s.kind === 'add').map((s) => s.text)).toEqual(['small'])
    expect(result.stats).toEqual({ added: 1, removed: 1, unchanged: 2 })
  })

  it('split view keeps only the matching side', () => {
    const result = ok('a b', 'a c', 'word')
    const row = result.split[0]
    expect(row?.left?.segments.some((s) => s.kind === 'add')).toBe(false)
    expect(row?.right?.segments.some((s) => s.kind === 'remove')).toBe(false)
  })
})

describe('limits', () => {
  it('rejects oversized input', () => {
    const result = computeDiff('a'.repeat(MAX_INPUT_LENGTH + 1), '', 'line')
    expect(result.ok).toBe(false)
  })
})
