'use client'

import { useState } from 'react'

import { LinkIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { decodeHtml, decodeUrl, encodeHtml, encodeUrl } from './lib'

type Format = 'url' | 'html'
type Direction = 'encode' | 'decode'

function convert(
  format: Format,
  direction: Direction,
  input: string,
): { output: string; error: string | null } {
  if (format === 'url') {
    if (direction === 'encode') return { output: encodeUrl(input), error: null }
    const result = decodeUrl(input)
    return result.ok ? { output: result.output, error: null } : { output: '', error: result.error }
  }
  return { output: direction === 'encode' ? encodeHtml(input) : decodeHtml(input), error: null }
}

export function UrlEncodeTool() {
  const [format, setFormat] = useState<Format>('url')
  const [direction, setDirection] = useState<Direction>('encode')
  const [input, setInput] = useState('')

  const { output, error } = convert(format, direction, input)

  return (
    <>
      <ToolPageHeader
        title="URL / HTML encoder"
        description="Percent-encode URL components or escape HTML entities, and decode them back. Runs entirely in your browser."
        icon={LinkIcon}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(['url', 'html'] as const).map((f) => (
          <Button
            key={f}
            variant={format === f ? 'default' : 'outline'}
            size="sm"
            aria-pressed={format === f}
            onClick={() => {
              setFormat(f)
            }}
          >
            {f === 'url' ? 'URL' : 'HTML'}
          </Button>
        ))}
        <span className="bg-border mx-1 w-px" aria-hidden />
        {(['encode', 'decode'] as const).map((d) => (
          <Button
            key={d}
            variant={direction === d ? 'default' : 'outline'}
            size="sm"
            aria-pressed={direction === d}
            onClick={() => {
              setDirection(d)
            }}
          >
            {d === 'encode' ? 'Encode' : 'Decode'}
          </Button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="url-encode-input"
            className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
          >
            Input
          </label>
          <textarea
            id="url-encode-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
            }}
            placeholder={direction === 'encode' ? 'Text to encode…' : 'Text to decode…'}
            spellCheck={false}
            className={cn(
              'border-border bg-muted/30 focus:ring-ring h-64 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2',
              error && 'border-destructive',
            )}
            aria-invalid={error !== null}
          />
          {error && (
            <p className="text-destructive text-xs" role="alert" data-testid="url-encode-error">
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
            data-testid="url-encode-output"
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
