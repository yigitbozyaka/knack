'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { clearSession, setSession } from '@/lib/auth/session'
import { generateToken, hashToken, lookupHash, normalizeToken, verifyToken } from '@/lib/auth/token'
import { db } from '@/lib/db/client'
import { accounts } from '@/lib/db/schema'
import { accountCreateLimiter, checkRateLimit, signInLimiter } from '@/lib/rate-limit'

export type CreateAccountState =
  | { status: 'success'; token: string }
  | { status: 'rate-limited' }
  | { status: 'error'; message: string }

export type SignInState =
  | { status: 'success' }
  | { status: 'rate-limited' }
  | { status: 'error'; message: string }

const tokenInputSchema = z
  .string({ error: 'Enter your account token.' })
  .trim()
  .min(1, 'Enter your account token.')
  .transform((value) => normalizeToken(value))
  .pipe(z.string().regex(/^\d{20}$/, 'That token does not look right.'))

async function getRequesterIdentifier(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return headerList.get('x-real-ip') ?? 'unknown'
}

const GENERIC_SIGN_IN_ERROR = 'Invalid token.'
const SIGN_IN_MISS_DELAY_MS = 1_000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createAccountAction(): Promise<CreateAccountState> {
  const ip = await getRequesterIdentifier()
  const limit = await checkRateLimit(ip, accountCreateLimiter)
  if (!limit.ok) return { status: 'rate-limited' }

  const token = generateToken()
  const tokenHash = await hashToken(token)
  const tokenLookup = lookupHash(token)

  const inserted = await db
    .insert(accounts)
    .values({ tokenHash, tokenLookup })
    .returning({ id: accounts.id })

  const account = inserted[0]
  if (!account) {
    return { status: 'error', message: 'Could not create account. Please try again.' }
  }

  // Intentionally not calling setSession here. Writing the session cookie
  // inside this action would make Next revalidate the current route's RSC,
  // which flips app/account/page.tsx into its signed-in branch and unmounts
  // GenerateAccountCard before the "save your token" dialog can open. The
  // client calls signInAction(token) from the dialog's Continue button once
  // the user has acknowledged saving the token.
  return { status: 'success', token }
}

export async function signInAction(rawToken: string): Promise<SignInState> {
  const ip = await getRequesterIdentifier()
  const limit = await checkRateLimit(ip, signInLimiter)
  if (!limit.ok) return { status: 'rate-limited' }

  const parsed = tokenInputSchema.safeParse(rawToken)
  if (!parsed.success) {
    await delay(SIGN_IN_MISS_DELAY_MS)
    return { status: 'error', message: GENERIC_SIGN_IN_ERROR }
  }

  const tokenLookup = lookupHash(parsed.data)
  const rows = await db
    .select({
      id: accounts.id,
      tokenHash: accounts.tokenHash,
      isDisabled: accounts.isDisabled,
    })
    .from(accounts)
    .where(eq(accounts.tokenLookup, tokenLookup))
    .limit(1)

  const row = rows[0]
  if (!row || row.isDisabled) {
    await delay(SIGN_IN_MISS_DELAY_MS)
    return { status: 'error', message: GENERIC_SIGN_IN_ERROR }
  }

  const ok = await verifyToken(parsed.data, row.tokenHash)
  if (!ok) {
    await delay(SIGN_IN_MISS_DELAY_MS)
    return { status: 'error', message: GENERIC_SIGN_IN_ERROR }
  }

  await db.update(accounts).set({ lastSeenAt: new Date() }).where(eq(accounts.id, row.id))
  await setSession(row.id)
  return { status: 'success' }
}

export async function signOutAction(): Promise<void> {
  await clearSession()
  redirect('/')
}
