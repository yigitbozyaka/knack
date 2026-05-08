import { cookies } from 'next/headers'

import { getIronSession, type SessionOptions } from 'iron-session'

import { env } from '@/lib/env'

const NINETY_DAYS_SECONDS = 60 * 60 * 24 * 90

export interface SessionData {
  accountId?: string
  // Track when we last refreshed lastSeenAt to avoid hammering the DB on every
  // request — the action layer reads this to decide if a touch is needed.
  lastTouchedAt?: number
}

const sessionOptions: SessionOptions = {
  password: env.SESSION_SECRET,
  cookieName: env.SESSION_COOKIE_NAME,
  ttl: NINETY_DAYS_SECONDS,
  cookieOptions: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: NINETY_DAYS_SECONDS,
  },
}

async function readSession() {
  const store = await cookies()
  return getIronSession<SessionData>(store, sessionOptions)
}

export async function getSession(): Promise<{ accountId: string } | null> {
  const session = await readSession()
  if (!session.accountId) return null
  return { accountId: session.accountId }
}

export async function setSession(accountId: string): Promise<void> {
  const session = await readSession()
  session.accountId = accountId
  session.lastTouchedAt = Date.now()
  await session.save()
}

export async function clearSession(): Promise<void> {
  const session = await readSession()
  session.destroy()
}
