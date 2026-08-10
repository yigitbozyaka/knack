'use client'

import { useActionState } from 'react'

import { FileText } from 'lucide-react'

import { createPaste, type CreatePasteState } from '@/app/actions/paste'
import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_EXPIRY, EXPIRY_LABELS, EXPIRY_OPTIONS } from '@/features/paste/lib'

export function PasteTool() {
  const [state, formAction, isPending] = useActionState<CreatePasteState, FormData>(createPaste, {
    status: 'idle',
  })

  const shareUrl =
    state.status === 'success'
      ? typeof window !== 'undefined'
        ? `${window.location.origin}/paste/${state.slug}`
        : `/paste/${state.slug}`
      : ''

  return (
    <div className="space-y-6">
      <ToolPageHeader
        title="Paste"
        description="Share text snippets with optional expiry. Anonymous or signed-in."
        icon={FileText}
      />

      {state.status === 'rate-limited' && (
        <p role="alert" className="text-destructive text-sm">
          Too many pastes — try again in a minute.
        </p>
      )}

      {state.status === 'success' ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">Your paste is ready. Share this link:</p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareUrl}
              data-testid="paste-share-url"
              className="font-mono text-sm"
            />
            <CopyButton value={shareUrl} label="Copy link" />
          </div>
          <a
            href={`/paste/${state.slug}`}
            className="hover:text-foreground text-muted-foreground inline-block text-sm underline underline-offset-4"
          >
            View paste →
          </a>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paste-content">Content</Label>
            <Textarea
              id="paste-content"
              name="content"
              data-testid="paste-content"
              rows={12}
              placeholder="Paste your text here…"
            />
            {state.status === 'error' && state.fieldErrors.content && (
              <p role="alert" className="text-destructive text-sm">
                {state.fieldErrors.content}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paste-expiry">Expires</Label>
            <select
              id="paste-expiry"
              name="expiry"
              defaultValue={DEFAULT_EXPIRY}
              className="border-input bg-background focus:ring-ring h-9 w-full rounded-md border px-3 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {EXPIRY_LABELS[opt]}
                </option>
              ))}
            </select>
          </div>

          {state.status === 'error' && state.fieldErrors.form && (
            <p role="alert" className="text-destructive text-sm">
              {state.fieldErrors.form}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create paste'}
          </Button>
        </form>
      )}
    </div>
  )
}
