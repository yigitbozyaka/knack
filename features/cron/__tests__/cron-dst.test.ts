import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { nextRuns, parseCron } from '../lib'

const originalZone = process.env.TZ

beforeAll(() => {
  process.env.TZ = 'America/New_York'
})

afterAll(() => {
  if (originalZone === undefined) delete process.env.TZ
  else process.env.TZ = originalZone
})

function localRuns(expression: string, from: string, count: number) {
  const parsed = parseCron(expression)
  if (!parsed.ok) throw new Error(parsed.error)
  return nextRuns(parsed.schedule, new Date(from), count, 'local').map((d) => d.toISOString())
}

describe('daylight saving time in the local view', () => {
  it('runs a skipped fixed-time job right after the spring-forward transition', () => {
    expect(localRuns('30 2 * * *', '2026-03-07T15:00:00Z', 3)).toEqual([
      '2026-03-08T07:00:00.000Z',
      '2026-03-09T06:30:00.000Z',
      '2026-03-10T06:30:00.000Z',
    ])
  })

  it('runs a job skipped at the last minute of the gap', () => {
    expect(localRuns('59 2 * * *', '2026-03-07T15:00:00Z', 2)).toEqual([
      '2026-03-08T07:00:00.000Z',
      '2026-03-09T06:59:00.000Z',
    ])
  })

  it('lists each fixed time once in a repeated hour with several minutes', () => {
    expect(localRuns('0,30 1 * * *', '2026-10-31T12:00:00Z', 4)).toEqual([
      '2026-11-01T05:00:00.000Z',
      '2026-11-01T05:30:00.000Z',
      '2026-11-02T06:00:00.000Z',
      '2026-11-02T06:30:00.000Z',
    ])
  })

  it('lists a fixed-time job once on the fall-back day', () => {
    expect(localRuns('30 1 * * *', '2026-10-31T12:00:00Z', 3)).toEqual([
      '2026-11-01T05:30:00.000Z',
      '2026-11-02T06:30:00.000Z',
      '2026-11-03T06:30:00.000Z',
    ])
  })

  it('keeps firing a wildcard job through the repeated hour', () => {
    expect(localRuns('*/30 * * * *', '2026-11-01T04:45:00Z', 4)).toEqual([
      '2026-11-01T05:00:00.000Z',
      '2026-11-01T05:30:00.000Z',
      '2026-11-01T06:00:00.000Z',
      '2026-11-01T06:30:00.000Z',
    ])
  })

  it('leaves jobs outside the transition window untouched', () => {
    expect(localRuns('0 9 * * *', '2026-03-07T15:00:00Z', 2)).toEqual([
      '2026-03-08T13:00:00.000Z',
      '2026-03-09T13:00:00.000Z',
    ])
  })
})
