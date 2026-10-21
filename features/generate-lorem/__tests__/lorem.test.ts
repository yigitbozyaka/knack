import { describe, expect, it } from 'vitest'

import { LOREM_LIMITS, clampCount, generateLorem, randomInt } from '../lib'

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length

describe('generateLorem', () => {
  it('returns the requested number of words', () => {
    for (const count of [1, 5, 8, 9, 100]) {
      expect(countWords(generateLorem({ unit: 'words', count, startWithLorem: false }))).toBe(count)
    }
  })

  it('starts with the canonical opening when requested', () => {
    const text = generateLorem({ unit: 'words', count: 5, startWithLorem: true })
    expect(text).toBe('lorem ipsum dolor sit amet')
  })

  it('starts the first sentence and paragraph with Lorem ipsum', () => {
    const sentences = generateLorem({ unit: 'sentences', count: 3, startWithLorem: true })
    expect(sentences.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit')).toBe(
      true,
    )
    const paragraphs = generateLorem({ unit: 'paragraphs', count: 2, startWithLorem: true })
    expect(paragraphs.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit')).toBe(
      true,
    )
  })

  it('does not force the opening when the toggle is off', () => {
    const outputs = Array.from({ length: 20 }, () =>
      generateLorem({ unit: 'words', count: 8, startWithLorem: false }),
    )
    expect(
      outputs.some((text) => text !== 'lorem ipsum dolor sit amet consectetur adipiscing elit'),
    ).toBe(true)
  })

  it('returns the requested number of capitalised, period-terminated sentences', () => {
    const text = generateLorem({ unit: 'sentences', count: 7, startWithLorem: false })
    const sentences = text.split(/(?<=\.) /)
    expect(sentences).toHaveLength(7)
    for (const sentence of sentences) {
      expect(sentence).toMatch(/^[A-Z][^.]*\.$/)
    }
  })

  it('separates paragraphs with blank lines', () => {
    const text = generateLorem({ unit: 'paragraphs', count: 4, startWithLorem: false })
    expect(text.split('\n\n')).toHaveLength(4)
  })

  it('clamps out-of-range counts', () => {
    expect(clampCount('paragraphs', 0)).toBe(1)
    expect(clampCount('paragraphs', 9999)).toBe(LOREM_LIMITS.paragraphs)
    expect(clampCount('words', Number.NaN)).toBe(1)
    expect(countWords(generateLorem({ unit: 'words', count: 999999, startWithLorem: false }))).toBe(
      LOREM_LIMITS.words,
    )
  })
})

describe('randomInt', () => {
  it('stays within bounds and covers the range', () => {
    const seen = new Set<number>()
    for (let index = 0; index < 500; index++) {
      const value = randomInt(5)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(5)
      seen.add(value)
    }
    expect(seen.size).toBe(5)
  })

  it('rejects invalid bounds', () => {
    expect(() => randomInt(0)).toThrow(RangeError)
    expect(() => randomInt(1.5)).toThrow(RangeError)
  })
})
