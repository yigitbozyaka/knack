'use client'

import { useTransition } from 'react'

import { LogOutIcon } from 'lucide-react'

import { signOutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      onClick={() => {
        startTransition(async () => {
          await signOutAction()
        })
      }}
      disabled={pending}
    >
      <LogOutIcon /> Sign out
    </Button>
  )
}
