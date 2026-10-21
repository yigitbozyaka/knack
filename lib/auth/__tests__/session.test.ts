import { beforeEach, describe, expect, it, vi } from 'vitest'

const jar = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      set: (nameOrOptions: string | { name: string; value: string }, value?: string) => {
        if (typeof nameOrOptions === 'string') jar.set(nameOrOptions, value ?? '')
        else jar.set(nameOrOptions.name, nameOrOptions.value)
      },
      delete: (name: string) => {
        jar.delete(name)
      },
    }),
}))

import { clearSession, getSession, setSession } from '@/lib/auth/session'

describe('session cookie flow', () => {
  beforeEach(() => {
    jar.clear()
  })

  it('returns null when no cookie is present', async () => {
    expect(await getSession()).toBeNull()
  })

  it('round-trips the account id through a sealed cookie', async () => {
    await setSession('account-1')
    const sealed = jar.get('knack_session')
    expect(sealed).toBeTruthy()
    expect(sealed).not.toContain('account-1')
    expect(await getSession()).toEqual({ accountId: 'account-1' })
  })

  it('returns null after clearSession', async () => {
    await setSession('account-1')
    await clearSession()
    expect(await getSession()).toBeNull()
  })

  it('rejects a tampered cookie', async () => {
    await setSession('account-1')
    const sealed = jar.get('knack_session') ?? ''
    jar.set('knack_session', sealed.slice(0, -4) + 'AAAA')
    expect(await getSession()).toBeNull()
  })
})
