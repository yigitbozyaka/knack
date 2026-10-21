import cronstrue from 'cronstrue'
import { z } from 'zod'

export const MAX_EXPRESSION_LENGTH = 200
export const DEFAULT_RUN_COUNT = 5
const MAX_ITERATIONS = 200_000
const HORIZON_YEARS = 40

export type CronZone = 'local' | 'utc'

export interface CronSchedule {
  minutes: Set<number>
  hours: Set<number>
  daysOfMonth: Set<number>
  months: Set<number>
  daysOfWeek: Set<number>
  dayOfMonthRestricted: boolean
  dayOfWeekRestricted: boolean
  fixedTime: boolean
}

export type CronParseResult = { ok: true; schedule: CronSchedule } | { ok: false; error: string }

export type CronResult =
  | { ok: true; expression: string; description: string; nextRuns: Date[]; neverRuns: boolean }
  | { ok: false; error: string }

interface FieldSpec {
  name: string
  min: number
  max: number
  names?: string[]
}

const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const FIELDS: FieldSpec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTH_NAMES },
  { name: 'day of week', min: 0, max: 7, names: DAY_NAMES },
]

const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

const expressionSchema = z
  .string()
  .trim()
  .min(1, 'Enter a cron expression.')
  .max(
    MAX_EXPRESSION_LENGTH,
    `Expression must be at most ${String(MAX_EXPRESSION_LENGTH)} characters.`,
  )

export function expandMacro(expression: string): string {
  return MACROS[expression.toLowerCase()] ?? expression
}

function parseValue(token: string, spec: FieldSpec): number {
  if (spec.names) {
    const nameIndex = spec.names.indexOf(token.toUpperCase())
    if (nameIndex !== -1) return nameIndex + spec.min
  }
  if (!/^\d+$/.test(token)) {
    throw new Error(`Invalid ${spec.name} value "${token}".`)
  }
  const value = Number(token)
  if (value < spec.min || value > spec.max) {
    throw new Error(
      `${spec.name} value ${token} is out of range ${String(spec.min)}-${String(spec.max)}.`,
    )
  }
  return value
}

function parseField(field: string, spec: FieldSpec): Set<number> {
  const values = new Set<number>()
  for (const part of field.split(',')) {
    if (part === '') throw new Error(`Empty list item in ${spec.name}.`)
    const [range = '', stepText, ...extra] = part.split('/')
    if (extra.length > 0) throw new Error(`Invalid step in ${spec.name}.`)

    let step = 1
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) < 1) {
        throw new Error(`Invalid step "${stepText}" in ${spec.name}.`)
      }
      step = Number(stepText)
    }

    let start: number
    let end: number
    if (range === '*') {
      start = spec.min
      end = spec.name === 'day of week' ? 6 : spec.max
    } else if (range.includes('-')) {
      const [from = '', to = '', ...rest] = range.split('-')
      if (rest.length > 0) throw new Error(`Invalid range "${range}" in ${spec.name}.`)
      start = parseValue(from, spec)
      end = parseValue(to, spec)
      if (start > end) throw new Error(`Range "${range}" in ${spec.name} is reversed.`)
    } else {
      start = parseValue(range, spec)
      end = stepText === undefined ? start : spec.max
    }

    for (let value = start; value <= end; value += step) {
      values.add(spec.name === 'day of week' && value === 7 ? 0 : value)
    }
  }
  return values
}

export function parseCron(expression: string): CronParseResult {
  const tokens = expandMacro(expression.trim()).split(/\s+/)
  if (tokens.length !== 5) {
    return {
      ok: false,
      error: `Expected 5 fields (minute hour day-of-month month day-of-week), got ${String(tokens.length)}.`,
    }
  }
  try {
    const [minutes, hours, daysOfMonth, months, daysOfWeek] = tokens.map((token, i) => {
      const spec = FIELDS[i]
      if (!spec) throw new Error('Too many fields.')
      return parseField(token, spec)
    }) as [Set<number>, Set<number>, Set<number>, Set<number>, Set<number>]
    return {
      ok: true,
      schedule: {
        minutes,
        hours,
        daysOfMonth,
        months,
        daysOfWeek,
        dayOfMonthRestricted: !(tokens[2] ?? '').startsWith('*'),
        dayOfWeekRestricted: !(tokens[4] ?? '').startsWith('*'),
        fixedTime: !(tokens[0] ?? '').startsWith('*') && !(tokens[1] ?? '').startsWith('*'),
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid cron expression.' }
  }
}

interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

function readClock(date: Date, zone: CronZone): WallClock {
  return zone === 'utc'
    ? {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        weekday: date.getUTCDay(),
      }
    : {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        weekday: date.getDay(),
      }
}

function buildDate(
  zone: CronZone,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return zone === 'utc'
    ? new Date(Date.UTC(year, month, day, hour, minute))
    : new Date(year, month, day, hour, minute)
}

function dayMatches(schedule: CronSchedule, clock: WallClock): boolean {
  const monthDay = schedule.daysOfMonth.has(clock.day)
  const weekDay = schedule.daysOfWeek.has(clock.weekday)
  if (schedule.dayOfMonthRestricted && schedule.dayOfWeekRestricted) return monthDay || weekDay
  return monthDay && weekDay
}

function sameWallMinute(a: WallClock, b: WallClock): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  )
}

function clockMatches(schedule: CronSchedule, clock: WallClock): boolean {
  return (
    schedule.months.has(clock.month + 1) &&
    dayMatches(schedule, clock) &&
    schedule.hours.has(clock.hour) &&
    schedule.minutes.has(clock.minute)
  )
}

function skippedByForwardTransition(schedule: CronSchedule, cursor: Date): boolean {
  const before = new Date(cursor.getTime() - 60000)
  const gapMinutes = before.getTimezoneOffset() - cursor.getTimezoneOffset()
  if (gapMinutes <= 0) return false
  const start = readClock(before, 'local')
  for (let offset = 1; offset <= gapMinutes; offset++) {
    const wall = new Date(
      Date.UTC(start.year, start.month, start.day, start.hour, start.minute + offset),
    )
    if (clockMatches(schedule, readClock(wall, 'utc'))) return true
  }
  return false
}

export function nextRuns(
  schedule: CronSchedule,
  from: Date,
  count: number,
  zone: CronZone = 'local',
): Date[] {
  const runs: Date[] = []
  const horizon = from.getTime() + HORIZON_YEARS * 366 * 24 * 3600 * 1000
  let cursor = new Date(Math.floor(from.getTime() / 60000) * 60000 + 60000)

  for (let i = 0; i < MAX_ITERATIONS && runs.length < count; i++) {
    if (cursor.getTime() > horizon) break
    const clock = readClock(cursor, zone)
    let next: Date

    if (
      zone === 'local' &&
      schedule.fixedTime &&
      !clockMatches(schedule, clock) &&
      skippedByForwardTransition(schedule, cursor)
    ) {
      runs.push(cursor)
      cursor = new Date(cursor.getTime() + 60000)
      continue
    }

    if (!schedule.months.has(clock.month + 1)) {
      next = buildDate(zone, clock.year, clock.month + 1, 1, 0, 0)
    } else if (!dayMatches(schedule, clock)) {
      next = buildDate(zone, clock.year, clock.month, clock.day + 1, 0, 0)
    } else if (!schedule.hours.has(clock.hour)) {
      next = buildDate(zone, clock.year, clock.month, clock.day, clock.hour + 1, 0)
    } else if (!schedule.minutes.has(clock.minute)) {
      next = new Date(cursor.getTime() + 60000)
    } else {
      const repeatedWallTime =
        zone === 'local' &&
        schedule.fixedTime &&
        runs.some((run) => sameWallMinute(readClock(run, 'local'), clock))
      if (!repeatedWallTime) runs.push(cursor)
      next = new Date(cursor.getTime() + 60000)
    }

    cursor = next.getTime() > cursor.getTime() ? next : new Date(cursor.getTime() + 60000)
  }
  return runs
}

export function describeCron(expression: string): string {
  return cronstrue.toString(expandMacro(expression.trim()), { use24HourTimeFormat: true })
}

export function analyzeCron(
  rawExpression: string,
  from: Date = new Date(),
  zone: CronZone = 'local',
  count: number = DEFAULT_RUN_COUNT,
): CronResult {
  const checked = expressionSchema.safeParse(rawExpression)
  if (!checked.success) {
    return { ok: false, error: checked.error.issues[0]?.message ?? 'Invalid expression.' }
  }
  const expression = checked.data

  const parsed = parseCron(expression)
  if (!parsed.ok) return parsed

  let description: string
  try {
    description = describeCron(expression)
  } catch {
    description = 'No description available for this expression.'
  }

  const runs = nextRuns(parsed.schedule, from, count, zone)
  return { ok: true, expression, description, nextRuns: runs, neverRuns: runs.length === 0 }
}
