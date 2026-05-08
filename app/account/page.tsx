import { eq } from 'drizzle-orm'

import { GenerateAccountCard } from '@/components/auth/generate-account-card'
import { SignInCard } from '@/components/auth/sign-in-card'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { getCurrentAccount } from '@/lib/auth/account'
import { db } from '@/lib/db/client'
import { accounts } from '@/lib/db/schema'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account · Knack',
  description: 'Generate a token-based Knack account or sign in with one you already have.',
}

async function getAccountReference(accountId: string): Promise<string | null> {
  const rows = await db
    .select({ tokenLookup: accounts.tokenLookup })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return row.tokenLookup.slice(-4)
}

export default async function AccountPage() {
  const account = await getCurrentAccount()

  if (account) {
    const reference = await getAccountReference(account.id)
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="text-muted-foreground text-sm">
            Signed in. Account reference (last 4 of lookup hash, share with support if needed):{' '}
            <span className="font-mono">{reference ?? '----'}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            Created: {account.createdAt.toLocaleDateString()}
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <SignOutButton />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground text-sm">
          Knack accounts are token-only. No email, no password, no recovery — just one long random
          string you keep safe.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <GenerateAccountCard />
        <SignInCard />
      </div>
    </div>
  )
}
