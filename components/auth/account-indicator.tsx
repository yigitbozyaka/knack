import Link from 'next/link'

import { UserIcon } from 'lucide-react'

import { getCurrentAccount } from '@/lib/auth/account'
import { cn } from '@/lib/utils'

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

  return (
    <Link
      href="/account"
      className={cn(
        'text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm',
        className,
      )}
      aria-label="Account"
      title={`Account ${account.id}`}
    >
      <UserIcon className="size-4" />
      <span className="font-mono">{account.id.slice(-4)}</span>
    </Link>
  )
}
