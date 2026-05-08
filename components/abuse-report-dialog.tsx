'use client'

import { useActionState, useEffect, useId, useState } from 'react'

import { reportAbuse, type ReportAbuseState } from '@/app/actions/report-abuse'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initialState: ReportAbuseState = { status: 'idle' }

const REASON_OPTIONS = [
  { value: 'illegal', label: 'Illegal content' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'copyright', label: 'Copyright violation' },
  { value: 'malware', label: 'Malware or phishing' },
  { value: 'other', label: 'Other' },
] as const

export function AbuseReportDialog() {
  const [state, formAction, pending] = useActionState(reportAbuse, initialState)
  const [open, setOpen] = useState(false)
  const urlId = useId()
  const reasonId = useId()
  const descId = useId()
  const emailId = useId()

  useEffect(() => {
    if (state.status === 'success') {
      const timer = setTimeout(() => {
        setOpen(false)
      }, 1500)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [state.status])

  const fieldError = (key: string) =>
    state.status === 'error' ? state.fieldErrors[key] : undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Report abuse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report abuse</DialogTitle>
          <DialogDescription>
            Tell us about a Knack page or output that violates our terms. We read every report.
          </DialogDescription>
        </DialogHeader>

        {state.status === 'success' ? (
          <p className="text-sm">Thanks — we got it. Closing this in a moment.</p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={urlId}>URL</Label>
              <Input
                id={urlId}
                name="url"
                type="url"
                required
                placeholder="https://knack.wtf/some-tool"
                aria-invalid={Boolean(fieldError('url'))}
                aria-describedby={fieldError('url') ? `${urlId}-error` : undefined}
              />
              {fieldError('url') ? (
                <p id={`${urlId}-error`} className="text-destructive text-xs">
                  {fieldError('url')}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={reasonId}>Reason</Label>
              <select
                id={reasonId}
                name="reason"
                required
                defaultValue=""
                aria-invalid={Boolean(fieldError('reason'))}
                aria-describedby={fieldError('reason') ? `${reasonId}-error` : undefined}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>
                  Select a reason…
                </option>
                {REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldError('reason') ? (
                <p id={`${reasonId}-error`} className="text-destructive text-xs">
                  {fieldError('reason')}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={descId}>What&apos;s wrong?</Label>
              <Textarea
                id={descId}
                name="description"
                rows={4}
                required
                minLength={20}
                maxLength={2000}
                placeholder="Describe what you're reporting and why."
                aria-invalid={Boolean(fieldError('description'))}
                aria-describedby={fieldError('description') ? `${descId}-error` : undefined}
              />
              {fieldError('description') ? (
                <p id={`${descId}-error`} className="text-destructive text-xs">
                  {fieldError('description')}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={emailId}>
                Your email <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id={emailId}
                name="reporterEmail"
                type="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldError('reporterEmail'))}
                aria-describedby={fieldError('reporterEmail') ? `${emailId}-error` : undefined}
              />
              {fieldError('reporterEmail') ? (
                <p id={`${emailId}-error`} className="text-destructive text-xs">
                  {fieldError('reporterEmail')}
                </p>
              ) : null}
            </div>

            {state.status === 'rate-limited' ? (
              <p className="text-destructive text-xs" role="alert">
                Too many reports from this network. Please wait a minute and try again.
              </p>
            ) : null}
            {state.status === 'error' && state.formError ? (
              <p className="text-destructive text-xs" role="alert">
                {state.formError}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? 'Sending…' : 'Send report'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
