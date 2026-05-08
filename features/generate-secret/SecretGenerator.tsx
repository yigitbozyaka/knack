'use client'

import { useCallback, useState } from 'react'

import { RefreshCwIcon, ShieldIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { type SecretFormat, type SecretOptions, generateSecret } from './lib'

const DEFAULT_OPTS: SecretOptions = { format: 'hex', byteLength: 32 }

const FORMAT_LABELS: Record<SecretFormat, string> = {
  hex: 'Hex',
  base64: 'Base64',
  base64url: 'Base64url',
  alphanumeric: 'Alphanumeric',
}

export function SecretGenerator() {
  const [opts, setOpts] = useState<SecretOptions>(DEFAULT_OPTS)
  const [secret, setSecret] = useState(() => generateSecret(DEFAULT_OPTS))

  const applyOpts = useCallback((next: SecretOptions) => {
    setOpts(next)
    setSecret(generateSecret(next))
  }, [])

  const regenerate = useCallback(() => {
    setSecret(generateSecret(opts))
  }, [opts])

  return (
    <>
      <ToolPageHeader
        title="Secret Generator"
        description="Generate cryptographic random strings for API keys, JWT secrets, and session tokens."
        icon={ShieldIcon}
      />

      {/* Format select */}
      <div className="mb-4">
        <Label htmlFor="secret-format" className="mb-2 block">
          Format
        </Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FORMAT_LABELS) as SecretFormat[]).map((fmt) => (
            <Button
              key={fmt}
              variant={opts.format === fmt ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                applyOpts({ ...opts, format: fmt })
              }}
            >
              {FORMAT_LABELS[fmt]}
            </Button>
          ))}
        </div>
      </div>

      {/* Byte length slider */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="secret-bytes">Byte length</Label>
          <span className="text-muted-foreground font-mono text-sm">{opts.byteLength}</span>
        </div>
        <input
          id="secret-bytes"
          type="range"
          min={16}
          max={128}
          step={8}
          value={opts.byteLength}
          onChange={(e) => {
            applyOpts({ ...opts, byteLength: parseInt(e.target.value, 10) })
          }}
          className="accent-foreground w-full"
        />
      </div>

      {/* Output */}
      <div className="bg-muted/30 border-border mb-8 flex items-start gap-3 rounded-lg border px-4 py-3">
        <span className="flex-1 font-mono text-sm leading-relaxed break-all">{secret}</span>
        <div className="flex shrink-0 gap-1">
          <CopyButton value={secret} size="icon-sm" label="Copy secret" />
          <Button variant="ghost" size="icon-sm" onClick={regenerate} aria-label="Regenerate">
            <RefreshCwIcon />
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Use these for API keys, JWT secrets, session secrets, and similar tokens. Choose the format
        that matches what your system expects — hex for most databases, base64url for web tokens,
        alphanumeric for systems that reject special characters.
      </p>
    </>
  )
}
