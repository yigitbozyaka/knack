'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { CheckIcon, CopyIcon, KeyRoundIcon } from 'lucide-react'
import { toast } from 'sonner'

import { createAccountAction, signInAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function GenerateAccountCard() {
  const [pending, startTransition] = useTransition()
  const [continuing, startContinue] = useTransition()
  const [token, setToken] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [continueError, setContinueError] = useState<string | null>(null)
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
    if (!token) return
    setContinueError(null)
    const tokenToUse = token
    startContinue(async () => {
      const result = await signInAction(tokenToUse)
      if (result.status === 'success') {
        setToken(null)
        router.push('/')
        router.refresh()
        return
      }
      // Account was created but signing in failed (rate limit, transient DB
      // hiccup). The token is still valid — the user has it saved and can
      // paste it into the sign-in form on the same page.
      setContinueError(
        result.status === 'rate-limited'
          ? 'Too many sign-in attempts right now. Use Sign in with the token you just saved.'
          : 'Could not sign you in automatically. Use Sign in with the token you just saved.',
      )
    })
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
          // Block dismissing the dialog by clicking outside or pressing Escape
          // — the token is shown only here, once. The Continue button is the
          // only way out, and only after the user has acknowledged saving it.
          if (!open) return
        }}
      >
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(event) => {
            event.preventDefault()
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
          }}
        >
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
          {continueError ? (
            <p className="text-destructive text-sm" role="alert">
              {continueError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" disabled={!acknowledged || continuing} onClick={handleContinue}>
              {continuing ? 'Signing in…' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
