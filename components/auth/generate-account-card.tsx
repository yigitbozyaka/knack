'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { CheckIcon, CopyIcon, KeyRoundIcon } from 'lucide-react'
import { toast } from 'sonner'

import { createAccountAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function GenerateAccountCard() {
  const [pending, startTransition] = useTransition()
  const [token, setToken] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await createAccountAction()
      if (result.status === 'success') {
        setToken(result.token)
        setAcknowledged(false)
        setCopied(false)
        return
      }
      if (result.status === 'rate-limited') {
        setError('You are creating accounts too quickly. Please try again in an hour.')
        return
      }
      setError(result.message)
    })
  }

  async function handleCopy() {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      toast.success('Token copied to clipboard.')
    } catch {
      toast.error('Could not copy. Select the text and copy manually.')
    }
  }

  function handleContinue() {
    setToken(null)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-4" /> Generate a new account
          </CardTitle>
          <CardDescription>
            No email. No password. We give you a long random token. Save it somewhere safe — it is
            the only way to sign back in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleGenerate} disabled={pending}>
            {pending ? 'Generating…' : 'Generate token'}
          </Button>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </CardContent>
      </Card>

      <Dialog
        open={token !== null}
        onOpenChange={(open) => {
          if (!open && acknowledged) handleContinue()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save your account token</DialogTitle>
            <DialogDescription>
              This is the only time we will show this token. If you lose it, the account is gone —
              there is no recovery.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted text-foreground rounded-md p-3 font-mono text-sm break-all select-all">
            {token}
          </div>
          <Button type="button" onClick={handleCopy} variant="outline">
            {copied ? (
              <>
                <CheckIcon /> Copied
              </>
            ) : (
              <>
                <CopyIcon /> Copy token
              </>
            )}
          </Button>
          <Label className="flex items-start gap-2 text-sm font-normal">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(value) => {
                setAcknowledged(value === true)
              }}
              aria-describedby="ack-description"
            />
            <span id="ack-description">
              I have saved this token. I understand it cannot be recovered.
            </span>
          </Label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" disabled={!acknowledged} onClick={handleContinue}>
                Continue
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
