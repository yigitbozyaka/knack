'use client'

import { useCallback, useRef, useState } from 'react'

import { ArrowLeftRightIcon, BracesIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { detectFormat } from './lib/detect'
import * as json from './lib/json'
import { type FormatError, type FormatType } from './lib/types'
import * as xml from './lib/xml'
import * as yaml from './lib/yaml'

const FORMAT_TYPES: FormatType[] = ['auto', 'json', 'yaml', 'xml']
const FORMAT_LABELS: Record<FormatType, string> = {
  auto: 'Auto',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
}

function resolveFormat(type: FormatType, input: string): Exclude<FormatType, 'auto'> {
  return type === 'auto' ? detectFormat(input) : type
}

export function Formatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [formatType, setFormatType] = useState<FormatType>('auto')
  const [error, setError] = useState<FormatError | null>(null)
  const [validMsg, setValidMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const run = useCallback(
    (action: 'format' | 'minify' | 'validate') => {
      setError(null)
      setValidMsg(null)
      const resolved = resolveFormat(formatType, input)

      let result
      if (action === 'format') {
        result =
          resolved === 'json'
            ? json.format(input)
            : resolved === 'yaml'
              ? yaml.format(input)
              : xml.format(input)
      } else if (action === 'minify') {
        result = json.minify(input)
      } else {
        result =
          resolved === 'json'
            ? json.validate(input)
            : resolved === 'yaml'
              ? yaml.validate(input)
              : xml.validate(input)
      }

      if (result.ok) {
        if (action === 'validate') {
          setValidMsg(result.output)
        } else {
          setOutput(result.output)
        }
      } else {
        setError(result.error)
      }
    },
    [input, formatType],
  )

  const swap = () => {
    setInput(output)
    setOutput('')
    setError(null)
    setValidMsg(null)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const resolved = resolveFormat(formatType, input)
  const canMinify = resolved === 'json'

  return (
    <>
      <ToolPageHeader
        title="Formatter"
        description="Pretty-print, minify, and validate JSON, XML, and YAML. Runs entirely in your browser."
        icon={BracesIcon}
      />

      {/* Format selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FORMAT_TYPES.map((t) => (
          <Button
            key={t}
            variant={formatType === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFormatType(t)
            }}
          >
            {FORMAT_LABELS[t]}
          </Button>
        ))}
      </div>

      {/* Two-pane editor */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input pane */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Input
          </label>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError(null)
              setValidMsg(null)
            }}
            placeholder="Paste your JSON, YAML, or XML here…"
            spellCheck={false}
            className={cn(
              'border-border bg-muted/30 focus:ring-ring h-80 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2',
              error && 'border-destructive',
            )}
            aria-label="Input"
            aria-invalid={error !== null}
          />
          {/* Error display */}
          {error && (
            <p className="text-destructive text-xs" role="alert">
              {error.line != null
                ? `Line ${String(error.line)}${error.col != null ? `, col ${String(error.col)}` : ''}: `
                : ''}
              {error.message}
            </p>
          )}
          {validMsg && (
            <p className="text-xs text-green-600 dark:text-green-400" role="status">
              {validMsg}
            </p>
          )}
        </div>

        {/* Output pane */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Output
            </label>
            {output && <CopyButton value={output} size="xs" label="Copy" />}
          </div>
          <pre
            data-testid="format-output"
            className="border-border bg-muted/30 h-80 overflow-auto rounded-lg border p-3 font-mono text-sm whitespace-pre-wrap"
            aria-label="Output"
          >
            {output || (
              <span className="text-muted-foreground italic">Output will appear here</span>
            )}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            run('format')
          }}
        >
          Format
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            run('minify')
          }}
          disabled={!canMinify}
        >
          Minify
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            run('validate')
          }}
        >
          Validate
        </Button>
        <Button variant="ghost" onClick={swap} disabled={!output} aria-label="Swap output to input">
          <ArrowLeftRightIcon />
          Swap
        </Button>
      </div>
    </>
  )
}
