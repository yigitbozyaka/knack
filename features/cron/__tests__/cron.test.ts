import { describe, expect, it } from 'vitest'

import { analyzeCron, describeCron, nextRuns, parseCron } from '../lib'

const FROM = new Date('2026-10-21T08:00:30.000Z')

function runs(expression: string, count = 5) {
  const parsed = parseCron(expression)
  if (!parsed.ok) throw new Error(parsed.error)
  return nextRuns(parsed.schedule, FROM, count, 'utc').map((d) => d.toISOString())
}

describe('parseCron', () => {
  it('parses wildcards, lists, ranges and steps', () => {
    const parsed = parseCron('*/15 9-17 1,15 JAN-MAR MON-FRI')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect([...parsed.schedule.minutes]).toEqual([0, 15, 30, 45])
    expect([...parsed.schedule.hours]).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17])
    expect([...parsed.schedule.daysOfMonth]).toEqual([1, 15])
    expect([...parsed.schedule.months]).toEqual([1, 2, 3])
    expect([...parsed.schedule.daysOfWeek]).toEqual([1, 2, 3, 4, 5])
  })

  it('maps day-of-week 7 to Sunday', () => {
    const parsed = parseCron('0 0 * * 7')
    expect(parsed.ok && [...parsed.schedule.daysOfWeek]).toEqual([0])
  })

  it('expands macros', () => {
    expect(parseCron('@hourly').ok).toBe(true)
    expect(parseCron('@daily').ok).toBe(true)
  })

  it.each([
    ['* * * *', 'Expected 5 fields'],
    ['* * * * * *', 'Expected 5 fields'],
    ['60 * * * *', 'out of range'],
    ['* 24 * * *', 'out of range'],
    ['* * 0 * *', 'out of range'],
    ['* * * 13 *', 'out of range'],
    ['*/0 * * * *', 'Invalid step'],
    ['5-1 * * * *', 'reversed'],
    ['a * * * *', 'Invalid minute value'],
    ['1,,2 * * * *', 'Empty list item'],
  ])('rejects %s', (expression, message) => {
    const parsed = parseCron(expression)
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain(message)
  })
})

describe('nextRuns', () => {
  it('returns every five minutes after the start', () => {
    expect(runs('*/5 * * * *', 3)).toEqual([
      '2026-10-21T08:05:00.000Z',
      '2026-10-21T08:10:00.000Z',
      '2026-10-21T08:15:00.000Z',
    ])
  })

  it('never returns the current minute', () => {
    expect(runs('0 8 * * *', 1)).toEqual(['2026-10-22T08:00:00.000Z'])
  })

  it('rolls over to the next month and year', () => {
    expect(runs('0 0 1 1 *', 2)).toEqual(['2027-01-01T00:00:00.000Z', '2028-01-01T00:00:00.000Z'])
  })

  it('respects weekday ranges', () => {
    expect(runs('30 9 * * MON-FRI', 3)).toEqual([
      '2026-10-21T09:30:00.000Z',
      '2026-10-22T09:30:00.000Z',
      '2026-10-23T09:30:00.000Z',
    ])
  })

  it('uses OR semantics when day-of-month and day-of-week are both restricted', () => {
    expect(runs('0 0 25 * MON', 3)).toEqual([
      '2026-10-25T00:00:00.000Z',
      '2026-10-26T00:00:00.000Z',
      '2026-11-02T00:00:00.000Z',
    ])
  })

  it('finds leap days', () => {
    expect(runs('0 0 29 2 *', 1)).toEqual(['2028-02-29T00:00:00.000Z'])
  })

  it('returns nothing for impossible dates', () => {
    expect(runs('0 0 31 2 *')).toEqual([])
  })

  it('returns exactly the requested count', () => {
    expect(runs('* * * * *', 5)).toHaveLength(5)
  })
})

describe('describeCron', () => {
  it('produces a readable sentence', () => {
    expect(describeCron('*/5 9-17 * * MON-FRI')).toBe(
      'Every 5 minutes, between 09:00 and 17:59, Monday through Friday',
    )
  })

  it('describes macros', () => {
    expect(describeCron('@daily')).toContain('00:00')
  })
})

describe('analyzeCron', () => {
  it('combines description and next runs', () => {
    const result = analyzeCron('0 12 * * *', FROM, 'utc')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.nextRuns).toHaveLength(5)
    expect(result.neverRuns).toBe(false)
    expect(result.description).toContain('12:00')
  })

  it('flags schedules that never run', () => {
    const result = analyzeCron('0 0 31 2 *', FROM, 'utc')
    expect(result.ok && result.neverRuns).toBe(true)
  })

  it('rejects empty and overlong input', () => {
    expect(analyzeCron('   ').ok).toBe(false)
    expect(analyzeCron('* '.repeat(200)).ok).toBe(false)
  })

  it('reports parse errors', () => {
    const result = analyzeCron('nope')
    expect(result.ok).toBe(false)
  })
})
