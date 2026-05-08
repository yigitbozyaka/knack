import Link from 'next/link'

import { eq } from 'drizzle-orm'
import { UserIcon } from 'lucide-react'

import { getCurrentAccount } from '@/lib/auth/account'
import { db } from '@/lib/db/client'
import { accounts } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

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

export async function AccountIndicator({ className }: { className?: string }) {
  const account = await getCurrentAccount()

  if (!account) {
    return (
      <Link
        href="/account"
        className={cn('text-muted-foreground hover:text-foreground text-sm', className)}
      >
        Sign in
      </Link>
    )
  }

  const reference = await getAccountReference(account.id)
  return (
    <Link
      href="/account"
      className={cn(
        'text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm',
        className,
      )}
      aria-label="Account"
    >
      <UserIcon className="size-4" />
      <span className="font-mono">{reference ?? '----'}</span>
    </Link>
  )
}
