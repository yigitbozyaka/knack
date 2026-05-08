import { cache } from 'react'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { accounts } from '@/lib/db/schema'
import { UnauthorizedError } from '@/lib/errors'

import { getSession } from './session'

export interface CurrentAccount {
  id: string
  createdAt: Date
}

export const getCurrentAccount = cache(async (): Promise<CurrentAccount | null> => {
  const session = await getSession()
  if (!session) return null

  const rows = await db
    .select({ id: accounts.id, createdAt: accounts.createdAt, isDisabled: accounts.isDisabled })
    .from(accounts)
    .where(eq(accounts.id, session.accountId))
    .limit(1)

  const row = rows[0]
  if (!row || row.isDisabled) return null
  return { id: row.id, createdAt: row.createdAt }
})

export async function requireAccount(): Promise<CurrentAccount> {
  const account = await getCurrentAccount()
  if (!account) {
    throw new UnauthorizedError()
  }
  return account
}
