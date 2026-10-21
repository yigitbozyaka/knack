'use client'

import { useEffect, useState } from 'react'

import { FingerprintIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'

import { HASH_ALGORITHMS, type HashResults, hashAll } from './lib'

interface Computed {
  input: string
  results: HashResults
}

export function HashGenerator() {
  const [input, setInput] = useState('')
  const [computed, setComputed] = useState<Computed | null>(null)
  const [failedInput, setFailedInput] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    hashAll(input)
      .then((results) => {
        if (!cancelled) setComputed({ input, results })
      })
      .catch(() => {
        if (!cancelled) setFailedInput(input)
      })
    return () => {
      cancelled = true
    }
  }, [input])

  const results = computed?.input === input ? computed.results : null
  const failed = failedInput === input

  return (
    <>
      <ToolPageHeader
        title="Hash generator"
        description="Compute SHA-1, SHA-256, SHA-384, and SHA-512 digests with the Web Crypto API. Your text never leaves the browser."
        icon={FingerprintIcon}
      />

      <div className="mb-6 flex flex-col gap-2">
        <label
          htmlFor="hash-input"
          className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
        >
          Input
        </label>
        <textarea
          id="hash-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
          }}
          placeholder="Text to hash…"
          spellCheck={false}
          className="border-border bg-muted/30 focus:ring-ring h-40 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2"
        />
      </div>

      {failed && (
        <p className="text-destructive mb-4 text-sm" role="alert" data-testid="hash-error">
          Hashing is unavailable: the Web Crypto API requires a secure context (HTTPS or localhost).
        </p>
      )}

      <ul className="mb-4 space-y-3">
        {HASH_ALGORITHMS.map((algorithm) => {
          const digest = results?.[algorithm] ?? ''
          return (
            <li key={algorithm} className="bg-muted/30 border-border rounded-lg border px-4 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {algorithm}
                </span>
                <CopyButton value={digest} size="icon-xs" label={`Copy ${algorithm}`} />
              </div>
              <span
                data-testid={`hash-output-${algorithm.toLowerCase()}`}
                className="block font-mono text-sm break-all"
              >
                {digest}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="text-muted-foreground text-sm">
        SHA-1 is shown for compatibility and is not collision resistant. MD5 is not offered because
        the Web Crypto API does not provide it.
      </p>
    </>
  )
}
