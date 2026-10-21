import { describe, expect, it } from 'vitest'

import {
  MAX_INPUT_LENGTH,
  MAX_MATCHES,
  captureGroupNames,
  runRegex,
  sanitizeFlags,
  toggleFlag,
} from '../lib'

function matchesOf(pattern: string, flags: string, text: string) {
  const result = runRegex(pattern, flags, text)
  if (!result.ok) throw new Error(result.error)
  return result
}

describe('runRegex', () => {
  it('finds every match with positions', () => {
    const { matches } = matchesOf('\\d+', 'g', 'a1 bb22 c333')
    expect(matches.map((m) => [m.value, m.index, m.end])).toEqual([
      ['1', 1, 2],
      ['22', 5, 7],
      ['333', 9, 12],
    ])
  })

  it('returns only the first match without the global flag', () => {
    const { matches, truncated } = matchesOf('a', '', 'aaa')
    expect(matches.map((m) => m.index)).toEqual([0])
    expect(truncated).toBe(false)
  })

  it('returns every match with the global flag', () => {
    expect(matchesOf('a', 'g', 'aaa').matches).toHaveLength(3)
  })

  it('returns a single empty match without the global flag', () => {
    expect(matchesOf('x*', '', 'abc').matches).toHaveLength(1)
  })

  it('labels unicode named groups', () => {
    const { matches } = matchesOf('(?<ñ>a)(?<x>b)', 'g', 'ab')
    expect(matches[0]?.groups.map((g) => [g.name, g.value])).toEqual([
      ['ñ', 'a'],
      ['x', 'b'],
    ])
  })

  it('respects the case-insensitive flag', () => {
    expect(matchesOf('abc', 'gi', 'ABC abc').matches).toHaveLength(2)
    expect(matchesOf('abc', 'g', 'ABC abc').matches).toHaveLength(1)
  })

  it('reports numbered and named capture groups', () => {
    const { matches } = matchesOf('(?<year>\\d{4})-(\\d{2})(x)?', 'g', '2026-10')
    expect(matches[0]?.groups).toEqual([
      { index: 1, name: 'year', value: '2026' },
      { index: 2, name: null, value: '10' },
      { index: 3, name: null, value: null },
    ])
  })

  it('does not loop forever on empty matches', () => {
    const { matches } = matchesOf('x*', 'g', 'abc')
    expect(matches).toHaveLength(4)
  })

  it('advances by code point for empty matches with the unicode flag', () => {
    expect(matchesOf('x*', 'gu', '😀').matches).toHaveLength(2)
  })

  it('caps the number of matches', () => {
    const result = matchesOf('a', 'g', 'a'.repeat(MAX_MATCHES + 50))
    expect(result.matches).toHaveLength(MAX_MATCHES)
    expect(result.truncated).toBe(true)
  })

  it('is not truncated at exactly the cap', () => {
    const result = matchesOf('a', 'g', 'a'.repeat(MAX_MATCHES))
    expect(result.truncated).toBe(false)
  })

  it('returns an error for an invalid pattern', () => {
    const result = runRegex('(', 'g', 'abc')
    expect(result.ok).toBe(false)
  })

  it('returns an error for an input over the length cap', () => {
    const result = runRegex('a', 'g', 'a'.repeat(MAX_INPUT_LENGTH + 1))
    expect(result.ok).toBe(false)
  })

  it('returns no matches for an empty pattern', () => {
    const result = matchesOf('', 'g', 'abc')
    expect(result.matches).toEqual([])
    expect(result.segments).toEqual([{ text: 'abc', matchIndex: null }])
  })

  it('builds highlight segments that reassemble the text', () => {
    const text = 'foo 12 bar 345 baz'
    const { segments } = matchesOf('\\d+', 'g', text)
    expect(segments.map((s) => s.text).join('')).toBe(text)
    expect(segments.filter((s) => s.matchIndex !== null).map((s) => s.text)).toEqual(['12', '345'])
  })
})

describe('captureGroupNames', () => {
  it('ignores non-capturing groups, lookarounds, escapes and classes', () => {
    expect(captureGroupNames('(?:a)(?<=b)(?<!d)(?!c)\\(([(])(?<n>x)')).toEqual([null, 'n'])
  })

  it('reads non-ascii group names', () => {
    expect(captureGroupNames('(?<ñ>a)(?<日本>b)')).toEqual(['ñ', '日本'])
  })
})

describe('flags', () => {
  it('sanitizes unknown and duplicate flags', () => {
    expect(sanitizeFlags('zgig')).toBe('gi')
  })

  it('toggles a flag on and off', () => {
    expect(toggleFlag('g', 'i')).toBe('gi')
    expect(toggleFlag('gi', 'i')).toBe('g')
  })
})
