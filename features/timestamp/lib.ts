export type NumericUnit = 's' | 'ms' | 'us' | 'ns'
export type TimestampUnit = 'auto' | NumericUnit

export interface TimestampBreakdown {
  unixSeconds: number
  unixMilliseconds: number
  iso: string
  utc: string
  local: string
  timeZone: string
  relative: string
  detectedUnit: NumericUnit | null
}

export type TimestampResult = { ok: true; value: TimestampBreakdown } | { ok: false; error: string }

const MS_THRESHOLD = 1e11
const US_THRESHOLD = 1e14
const NS_THRESHOLD = 1e17
const MILLISECONDS_PER_UNIT: Record<NumericUnit, number> = { s: 1000, ms: 1, us: 1e-3, ns: 1e-6 }
const NUMERIC_PATTERN = /^[+-]?\d+(\.\d+)?$/
const MAX_DATE_MS = 8.64e15

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

export function resolveTimeZone(timeZone?: string): string {
  return timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function formatLocal(date: Date, timeZone?: string): string {
  const zone = resolveTimeZone(timeZone)
  const wallClock = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  const offset =
    new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'
  return `${wallClock} ${offset}`
}

export function formatRelative(date: Date, now: Date): string {
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return formatter.format(0, 'second')
}

export function describeDate(
  date: Date,
  detectedUnit: NumericUnit | null,
  now: Date,
  timeZone?: string,
): TimestampBreakdown {
  const unixMilliseconds = date.getTime()
  return {
    unixSeconds: Math.floor(unixMilliseconds / 1000),
    unixMilliseconds,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: formatLocal(date, timeZone),
    timeZone: resolveTimeZone(timeZone),
    relative: formatRelative(date, now),
    detectedUnit,
  }
}

function detectUnit(magnitude: number): NumericUnit {
  if (magnitude >= NS_THRESHOLD) return 'ns'
  if (magnitude >= US_THRESHOLD) return 'us'
  if (magnitude >= MS_THRESHOLD) return 'ms'
  return 's'
}

export function parseTimestamp(
  input: string,
  unit: TimestampUnit,
  now: Date = new Date(),
  timeZone?: string,
): TimestampResult {
  const trimmed = input.trim()
  if (trimmed === '') return { ok: false, error: 'Enter a Unix timestamp or a date.' }

  if (NUMERIC_PATTERN.test(trimmed)) {
    const numeric = Number(trimmed)
    const detected: NumericUnit = unit === 'auto' ? detectUnit(Math.abs(numeric)) : unit
    const milliseconds = Math.round(numeric * MILLISECONDS_PER_UNIT[detected])
    if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > MAX_DATE_MS) {
      return { ok: false, error: 'Timestamp is outside the representable date range.' }
    }
    return {
      ok: true,
      value: describeDate(new Date(milliseconds), detected, now, timeZone),
    }
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return {
      ok: false,
      error:
        'Could not parse that as a Unix timestamp or a date (ISO 8601, RFC 2822 or a similar date string).',
    }
  }
  return { ok: true, value: describeDate(parsed, null, now, timeZone) }
}
