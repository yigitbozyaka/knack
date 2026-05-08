'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { EyeIcon, EyeOffIcon, LogInIcon } from 'lucide-react'

import { signInAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignInCard() {
  const [pending, startTransition] = useTransition()
  const [token, setToken] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogInIcon className="size-4" /> Sign in with token
        </CardTitle>
        <CardDescription>Paste the token you saved when you created your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            startTransition(async () => {
              const result = await signInAction(token)
              if (result.status === 'success') {
                router.push('/')
                router.refresh()
                return
              }
              if (result.status === 'rate-limited') {
                setError('Too many sign-in attempts. Please try again in an hour.')
                return
              }
              setError(result.message)
            })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="token">Account token</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                name="token"
                type={reveal ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={(event) => {
                  setToken(event.target.value)
                }}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                className="font-mono"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setReveal((value) => !value)
                }}
                aria-label={reveal ? 'Hide token' : 'Show token'}
              >
                {reveal ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
