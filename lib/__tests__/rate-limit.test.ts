import { afterEach, describe, expect, it, vi } from 'vitest'

const returning = vi.fn()

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({ returning }),
      }),
    }),
  },
}))

vi.mock('@/lib/env', () => ({
  env: { RATE_LIMIT_ENABLED: true, RATE_LIMIT_SALT: 'test-salt-at-least-32-characters-long' },
}))

const { checkRateLimit } = await import('@/lib/rate-limit')

const config = { requests: 3, windowMs: 60_000, prefix: 'test' }

afterEach(() => {
  vi.restoreAllMocks()
  returning.mockReset()
})

describe('checkRateLimit', () => {
  it('allows a request while the window still has room', async () => {
    returning.mockResolvedValue([{ count: 3 }])

    const result = await checkRateLimit('1.2.3.4', config)

    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBeGreaterThan(Date.now() - 60_000)
  })

  it('denies once the count passes the configured limit', async () => {
    returning.mockResolvedValue([{ count: 4 }])

    const result = await checkRateLimit('1.2.3.4', config)

    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('hashes the identifier so raw IPs never reach the database', async () => {
    let seenKey = ''
    returning.mockImplementation(() => Promise.resolve([{ count: 1 }]))
    const insert = vi.fn(() => ({
      values: (row: { key: string }) => {
        seenKey = row.key
        return { onConflictDoUpdate: () => ({ returning }) }
      },
    }))
    const { db } = await import('@/lib/db/client')
    vi.spyOn(db, 'insert').mockImplementation(insert as unknown as typeof db.insert)

    await checkRateLimit('203.0.113.7', config)

    expect(seenKey.startsWith('test:')).toBe(true)
    expect(seenKey).not.toContain('203.0.113.7')
  })

  it('allows the request when the backend throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    returning.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await checkRateLimit('1.2.3.4', config)

    expect(result.ok).toBe(true)
  })

  it('allows the request when the backend hangs past the timeout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    returning.mockImplementation(() => new Promise(() => undefined))

    const started = Date.now()
    const result = await checkRateLimit('1.2.3.4', config)

    expect(result.ok).toBe(true)
    expect(Date.now() - started).toBeLessThan(3_000)
  })
})
