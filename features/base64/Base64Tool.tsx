'use client'

import { useState } from 'react'

import { HashIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { decodeBase64, encodeBase64 } from './lib'

type Mode = 'encode' | 'decode'

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [urlSafe, setUrlSafe] = useState(false)
  const [input, setInput] = useState('')

  let output = ''
  let error: string | null = null
  if (mode === 'encode') {
    output = encodeBase64(input, urlSafe)
  } else {
    const result = decodeBase64(input)
    if (result.ok) output = result.output
    else error = result.error
  }

  return (
    <>
      <ToolPageHeader
        title="Base64 encoder"
        description="Encode and decode UTF-8 text to and from base64 or base64url. Runs entirely in your browser."
        icon={HashIcon}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['encode', 'decode'] as const).map((m) => (
          <Button
            key={m}
            variant={mode === m ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMode(m)
            }}
          >
            {m === 'encode' ? 'Encode' : 'Decode'}
          </Button>
        ))}
        <label className="text-muted-foreground ml-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={(e) => {
              setUrlSafe(e.target.checked)
            }}
            disabled={mode === 'decode'}
            data-testid="base64-urlsafe"
          />
          URL-safe (base64url)
        </label>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="base64-input"
            className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
          >
            Input
          </label>
          <textarea
            id="base64-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
            }}
            placeholder={mode === 'encode' ? 'Text to encode…' : 'Base64 to decode…'}
            spellCheck={false}
            className={cn(
              'border-border bg-muted/30 focus:ring-ring h-64 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2',
              error && input && 'border-destructive',
            )}
            aria-invalid={error !== null && input !== ''}
          />
          {error && input && (
            <p className="text-destructive text-xs" role="alert" data-testid="base64-error">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Output
            </span>
            {output && <CopyButton value={output} size="xs" label="Copy" />}
          </div>
          <pre
            data-testid="base64-output"
            className="border-border bg-muted/30 h-64 overflow-auto rounded-lg border p-3 font-mono text-sm break-all whitespace-pre-wrap"
            aria-label="Output"
          >
            {output || (
              <span className="text-muted-foreground italic">Output will appear here</span>
            )}
          </pre>
        </div>
      </div>
    </>
  )
}
