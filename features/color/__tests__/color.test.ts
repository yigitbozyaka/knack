import { describe, expect, it } from 'vitest'

import {
  contrastRatio,
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  parseColor,
  rgbToOklch,
  wcagLevels,
} from '../lib'

function rgbOf(input: string) {
  const result = parseColor(input)
  if (!result.ok) throw new Error(result.error)
  return result.rgb
}

describe('parseColor', () => {
  it('parses 6-digit and 3-digit hex, with or without the hash', () => {
    expect(rgbOf('#ff8000')).toEqual({ r: 255, g: 128, b: 0 })
    expect(rgbOf('F80')).toEqual({ r: 255, g: 136, b: 0 })
    expect(rgbOf('  #FFFFFF ')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('parses rgb in comma and space syntax, including percentages', () => {
    expect(rgbOf('rgb(255, 128, 0)')).toEqual({ r: 255, g: 128, b: 0 })
    expect(rgbOf('rgb(10 20 30)')).toEqual({ r: 10, g: 20, b: 30 })
    expect(rgbOf('rgb(100%, 0%, 0%)')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('parses hsl', () => {
    expect(formatHex(rgbOf('hsl(0, 100%, 50%)'))).toBe('#ff0000')
    expect(formatHex(rgbOf('hsl(120 100% 25%)'))).toBe('#008000')
    expect(formatHex(rgbOf('hsl(0.5turn, 100%, 50%)'))).toBe('#00ffff')
  })

  it('parses oklch', () => {
    expect(formatHex(rgbOf('oklch(1 0 0)'))).toBe('#ffffff')
    expect(formatHex(rgbOf('oklch(0 0 0)'))).toBe('#000000')
    expect(formatHex(rgbOf('oklch(62.8% 0.2577 29.23)'))).toBe('#ff0000')
  })

  it('accepts slash alpha for rgb, hsl and oklch and none for oklch components', () => {
    expect(formatHex(rgbOf('rgb(255 0 0 / 50%)'))).toBe('#ff0000')
    expect(formatHex(rgbOf('hsl(0 100% 50% / 0.5)'))).toBe('#ff0000')
    expect(formatHex(rgbOf('oklch(62.8% 0.2577 29.23 / 0.5)'))).toBe('#ff0000')
    expect(formatHex(rgbOf('oklch(1 0 none)'))).toBe('#ffffff')
  })

  it('maps out-of-gamut oklch by reducing chroma and preserves hue and lightness', () => {
    const result = parseColor('oklch(0.7 0.4 150)')
    if (!result.ok) throw new Error(result.error)
    expect(result.gamutMapped).toBe(true)
    const mapped = rgbToOklch(result.rgb)
    expect(mapped.l).toBeCloseTo(0.7, 1)
    expect(Math.abs(mapped.h - 150)).toBeLessThan(3)
    expect(mapped.c).toBeLessThan(0.4)
  })

  it('does not flag in-gamut colors as mapped', () => {
    const result = parseColor('oklch(0.5 0.05 200)')
    if (!result.ok) throw new Error(result.error)
    expect(result.gamutMapped).toBe(false)
  })

  it('round-trips its own oklch output without mapping', () => {
    const primaries = ['#0000ff', '#ffff00', '#ff0000', '#00ff00', '#00ffff', '#ff00ff']
    for (const hex of [...primaries, '#000000', '#ffffff']) {
      const result = parseColor(formatOklch(rgbOf(hex)))
      if (!result.ok) throw new Error(result.error)
      expect(formatHex(result.rgb)).toBe(hex)
      expect(result.gamutMapped).toBe(false)
    }

    let seed = 12345
    for (let i = 0; i < 200; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      const original = rgbOf(`#${(seed % 0x1000000).toString(16).padStart(6, '0')}`)
      const result = parseColor(formatOklch(original))
      if (!result.ok) throw new Error(result.error)
      expect(result.gamutMapped).toBe(false)
      expect(Math.abs(result.rgb.r - original.r)).toBeLessThan(1.5)
      expect(Math.abs(result.rgb.g - original.g)).toBeLessThan(1.5)
      expect(Math.abs(result.rgb.b - original.b)).toBeLessThan(1.5)
    }
  })

  it('validates alpha and argument syntax', () => {
    for (const good of [
      'rgb(1 2 3 / 0.5)',
      'rgb(1 2 3 / 50%)',
      'rgba(1, 2, 3, 0.5)',
      'hsla(10, 50%, 50%, 1)',
      'rgb(none 2 3)',
      'hsl(none 50% 50%)',
      'oklch(0.5 0.1 0 / 0.2)',
    ]) {
      expect(parseColor(good).ok).toBe(true)
    }
    for (const bad of [
      'oklch(0.5 0.1 0 / garbage)',
      'rgba(1,2,3,x)',
      'rgb(1 2 3 4)',
      'rgb(1, 2, 3 / 0.5)',
      'rgb(1 2 3 / 2)',
      'rgb(1 2 3 / -0.1)',
      'rgb(1, 2, 3, 150%)',
      'oklch(0.5, 0.1, 0)',
    ]) {
      expect(parseColor(bad).ok).toBe(false)
    }
  })

  it('gives specific messages for exponent and huge numbers', () => {
    expect(parseColor('oklch(0.5 1e-1 0)').ok).toBe(true)
    const huge = parseColor('oklch(0.9 1e3 0)')
    expect(huge.ok).toBe(false)
    if (!huge.ok) expect(huge.error).toMatch(/chroma must be at most/)
  })

  it('rejects malformed input with a message', () => {
    for (const bad of [
      '',
      '#12',
      '#gggggg',
      'rgb(300, 0, 0)',
      'rgb(1, 2)',
      'hsl(0, 120%, 50%)',
      'oklch(2 0 0)',
      'blue',
    ]) {
      const result = parseColor(bad)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0)
    }
  })
})

describe('formatting', () => {
  it('formats known colors in every notation', () => {
    const red = rgbOf('#ff0000')
    expect(formatHex(red)).toBe('#ff0000')
    expect(formatRgb(red)).toBe('rgb(255, 0, 0)')
    expect(formatHsl(red)).toBe('hsl(0, 100%, 50%)')
    expect(formatOklch(red)).toBe('oklch(0.628 0.2577 29.23)')
  })

  it('keeps one decimal in hsl so copied values round-trip', () => {
    for (const hex of ['#1a2b3c', '#ff8800', '#00ff99', '#c0ffee', '#123456', '#abcdef']) {
      expect(formatHex(rgbOf(formatHsl(rgbOf(hex))))).toBe(hex)
    }
  })

  it('formats white and black with zero chroma', () => {
    expect(formatOklch(rgbOf('#ffffff'))).toBe('oklch(1 0 0)')
    expect(formatHsl(rgbOf('#000000'))).toBe('hsl(0, 0%, 0%)')
  })

  it('round-trips hex through rgb and oklch', () => {
    for (const hex of ['#1a2b3c', '#ff8800', '#7f7f7f', '#00ff99', '#c0ffee']) {
      const rgb = rgbOf(hex)
      expect(formatHex(rgbOf(formatRgb(rgb)))).toBe(hex)
      expect(formatHex(rgbOf(formatOklch(rgb)))).toBe(hex)
    }
  })
})

describe('contrast', () => {
  it('gives 21:1 for black on white and 1:1 for identical colors', () => {
    expect(contrastRatio(rgbOf('#000'), rgbOf('#fff'))).toBeCloseTo(21, 5)
    expect(contrastRatio(rgbOf('#777'), rgbOf('#777'))).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    const a = rgbOf('#336699')
    const b = rgbOf('#ffeeaa')
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })

  it('matches the known value for #767676 on white', () => {
    expect(contrastRatio(rgbOf('#767676'), rgbOf('#fff'))).toBeCloseTo(4.54, 2)
  })

  it('maps ratios to WCAG levels at the thresholds', () => {
    expect(wcagLevels(21)).toEqual({
      aaNormal: true,
      aaLarge: true,
      aaaNormal: true,
      aaaLarge: true,
    })
    expect(wcagLevels(7)).toMatchObject({ aaaNormal: true })
    expect(wcagLevels(6.99)).toEqual({
      aaNormal: true,
      aaLarge: true,
      aaaNormal: false,
      aaaLarge: true,
    })
    expect(wcagLevels(4.49)).toEqual({
      aaNormal: false,
      aaLarge: true,
      aaaNormal: false,
      aaaLarge: false,
    })
    expect(wcagLevels(2.99)).toEqual({
      aaNormal: false,
      aaLarge: false,
      aaaNormal: false,
      aaaLarge: false,
    })
  })
})
