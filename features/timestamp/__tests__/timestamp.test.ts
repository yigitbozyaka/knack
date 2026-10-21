import { describe, expect, it } from 'vitest'

import { formatLocal, formatRelative, parseTimestamp } from '../lib'

const NOW = new Date('2026-10-21T08:00:00.000Z')

function value(input: string, unit: 'auto' | 's' | 'ms' = 'auto', timeZone = 'UTC') {
  const result = parseTimestamp(input, unit, NOW, timeZone)
  if (!result.ok) throw new Error(result.error)
  return result.value
}

describe('parseTimestamp numeric input', () => {
  it('treats small numbers as seconds', () => {
    const v = value('1700000000')
    expect(v.detectedUnit).toBe('s')
    expect(v.iso).toBe('2023-11-14T22:13:20.000Z')
    expect(v.unixSeconds).toBe(1700000000)
    expect(v.unixMilliseconds).toBe(1700000000000)
  })

  it('treats large numbers as milliseconds', () => {
    const v = value('1700000000123')
    expect(v.detectedUnit).toBe('ms')
    expect(v.iso).toBe('2023-11-14T22:13:20.123Z')
    expect(v.unixSeconds).toBe(1700000000)
  })

  it('honours an explicit unit', () => {
    expect(value('1700000000000', 's').detectedUnit).toBe('s')
    expect(value('1700000000', 'ms').iso).toBe('1970-01-20T16:13:20.000Z')
  })

  it('handles zero, negatives and fractional seconds', () => {
    expect(value('0').iso).toBe('1970-01-01T00:00:00.000Z')
    expect(value('-1').iso).toBe('1969-12-31T23:59:59.000Z')
    expect(value('1.5').iso).toBe('1970-01-01T00:00:01.500Z')
  })

  it('formats the UTC string', () => {
    expect(value('1700000000').utc).toBe('Tue, 14 Nov 2023 22:13:20 GMT')
  })

  it('rejects out-of-range numbers', () => {
    expect(parseTimestamp('99999999999999999999', 'ms', NOW).ok).toBe(false)
  })
})

describe('parseTimestamp date input', () => {
  it('parses ISO 8601 with an offset', () => {
    const v = value('2023-11-14T23:13:20+01:00')
    expect(v.unixSeconds).toBe(1700000000)
    expect(v.detectedUnit).toBeNull()
  })

  it('parses a UTC date-only string as midnight UTC', () => {
    expect(value('2026-10-21').unixSeconds).toBe(Date.UTC(2026, 9, 21) / 1000)
  })

  it('rejects empty input', () => {
    expect(parseTimestamp('   ', 'auto', NOW).ok).toBe(false)
  })

  it('rejects garbage', () => {
    expect(parseTimestamp('not a date', 'auto', NOW).ok).toBe(false)
  })
})

describe('formatLocal', () => {
  it('renders wall clock time and offset for a zone', () => {
    const date = new Date('2023-11-14T22:13:20.000Z')
    expect(formatLocal(date, 'Europe/Istanbul')).toBe('2023-11-15 01:13:20 GMT+03:00')
    expect(formatLocal(date, 'UTC')).toBe('2023-11-14 22:13:20 GMT+00:00')
  })
})

describe('formatRelative', () => {
  it('describes past and future', () => {
    expect(formatRelative(new Date('2026-10-21T07:00:00Z'), NOW)).toBe('1 hour ago')
    expect(formatRelative(new Date('2026-10-23T08:00:00Z'), NOW)).toBe('in 2 days')
    expect(formatRelative(NOW, NOW)).toBe('now')
  })
})
