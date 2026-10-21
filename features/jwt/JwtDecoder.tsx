'use client'

import { useState } from 'react'

import { KeyRoundIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { OutputPanel } from '@/components/tools/output-panel'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { cn } from '@/lib/utils'

import { type DecodedJwt, decodeJwt } from './lib'

const CLAIM_LABELS = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before' } as const

function JwtDetails({ token }: { token: DecodedJwt }) {
  return (
    <div className="space-y-4" data-testid="jwt-result">
      <div className="flex flex-wrap gap-2">
        {token.expired && (
          <span
            data-testid="jwt-expired-badge"
            className="bg-destructive/10 text-destructive rounded-full px-3 py-1 text-xs font-medium"
          >
            Expired
          </span>
        )}
        {token.notYetValid && (
          <span
            data-testid="jwt-not-yet-valid-badge"
            className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
          >
            Not yet valid
          </span>
        )}
        {!token.expired && !token.notYetValid && (
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
            Time claims OK
          </span>
        )}
      </div>

      {token.timeClaims.length > 0 && (
        <dl className="border-border divide-border divide-y rounded-lg border text-sm">
          {token.timeClaims.map((info) => (
            <div key={info.claim} className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">
                {CLAIM_LABELS[info.claim]} <span className="font-mono text-xs">({info.claim})</span>
              </dt>
              <dd className="font-mono" data-testid={`jwt-${info.claim}`}>
                {info.iso}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OutputPanel language="header" value={JSON.stringify(token.header, null, 2)} />
        <OutputPanel language="payload" value={JSON.stringify(token.payload, null, 2)} />
      </div>

      <div className="bg-muted/30 border-border flex items-center gap-3 rounded-lg border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
            Signature (not verified)
          </div>
          <span className="block font-mono text-sm break-all">{token.signature || '—'}</span>
        </div>
        <CopyButton value={token.signature} size="icon-sm" label="Copy signature" />
      </div>
    </div>
  )
}

export function JwtDecoder() {
  const [input, setInput] = useState('')

  const trimmed = input.trim()
  const result = trimmed === '' ? null : decodeJwt(trimmed)
  const error = result && !result.ok ? result.error : null

  return (
    <>
      <ToolPageHeader
        title="JWT decoder"
        description="Inspect a JSON Web Token's header, payload, and time claims. Decode only: the signature is never verified and the token never leaves your browser."
        icon={KeyRoundIcon}
      />

      <div className="mb-6 flex flex-col gap-2">
        <label
          htmlFor="jwt-input"
          className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
        >
          Token
        </label>
        <textarea
          id="jwt-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
          }}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
          spellCheck={false}
          className={cn(
            'border-border bg-muted/30 focus:ring-ring h-32 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2',
            error && 'border-destructive',
          )}
          aria-invalid={error !== null}
        />
        {error && (
          <p className="text-destructive text-xs" role="alert" data-testid="jwt-error">
            {error}
          </p>
        )}
      </div>

      {result?.ok && <JwtDetails token={result.token} />}
    </>
  )
}
