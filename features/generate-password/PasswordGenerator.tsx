'use client'

import { useCallback, useState } from 'react'

import { KeyRoundIcon, RefreshCwIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import {
  type PasswordOptions,
  type StrengthLabel,
  charsetSize,
  estimateEntropy,
  generatePassword,
  strengthLabel,
} from './lib'

const DEFAULT_OPTS: PasswordOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: false,
  avoidAmbiguous: false,
}

const STRENGTH_CONFIG: Record<StrengthLabel, { label: string; color: string; width: string }> = {
  weak: { label: 'Weak', color: 'bg-destructive', width: 'w-1/4' },
  fair: { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' },
  strong: { label: 'Strong', color: 'bg-yellow-500', width: 'w-3/4' },
  'very strong': { label: 'Very strong', color: 'bg-green-500', width: 'w-full' },
}

function tryGenerate(o: PasswordOptions): { password: string; error: string | null } {
  try {
    return { password: generatePassword(o), error: null }
  } catch (err) {
    return { password: '', error: err instanceof Error ? err.message : 'Generation failed.' }
  }
}

export function PasswordGenerator() {
  const [opts, setOpts] = useState<PasswordOptions>(DEFAULT_OPTS)
  const [password, setPassword] = useState(() => tryGenerate(DEFAULT_OPTS).password)
  const [error, setError] = useState<string | null>(null)

  const applyOpts = useCallback((next: PasswordOptions) => {
    setOpts(next)
    const result = tryGenerate(next)
    setPassword(result.password)
    setError(result.error)
  }, [])

  const regenerate = useCallback(() => {
    const result = tryGenerate(opts)
    setPassword(result.password)
    setError(result.error)
  }, [opts])

  const setOpt = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    applyOpts({ ...opts, [key]: value })
  }

  const size = charsetSize(opts)
  const bits = size > 0 ? estimateEntropy(opts.length, size) : 0
  const strength = size > 0 ? strengthLabel(bits) : 'weak'
  const strengthCfg = STRENGTH_CONFIG[strength]

  return (
    <>
      <ToolPageHeader
        title="Password Generator"
        description="Strong random passwords generated entirely in your browser using crypto.getRandomValues."
        icon={KeyRoundIcon}
      />

      {/* Output */}
      <div className="bg-muted/30 border-border mb-2 flex items-center gap-3 rounded-lg border px-4 py-3">
        <span data-testid="password-output" className="flex-1 font-mono text-sm break-all">
          {error ? <span className="text-destructive">{error}</span> : password}
        </span>
        {password && <CopyButton value={password} size="icon-sm" label="Copy password" />}
        <Button variant="ghost" size="icon-sm" onClick={regenerate} aria-label="Regenerate">
          <RefreshCwIcon />
        </Button>
      </div>

      {/* Strength meter */}
      <div className="mb-6">
        <div className="bg-muted mb-1 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              strengthCfg.color,
              strengthCfg.width,
            )}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {strengthCfg.label} · {Math.round(bits)} bits
        </p>
      </div>

      {/* Length slider */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="pw-length">Length</Label>
          <span className="text-muted-foreground font-mono text-sm">{opts.length}</span>
        </div>
        <input
          id="pw-length"
          type="range"
          min={8}
          max={128}
          value={opts.length}
          onChange={(e) => {
            setOpt('length', parseInt(e.target.value, 10))
          }}
          className="accent-foreground w-full"
        />
      </div>

      {/* Character class checkboxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            { key: 'lowercase', label: 'Lowercase (a–z)' },
            { key: 'uppercase', label: 'Uppercase (A–Z)' },
            { key: 'digits', label: 'Digits (0–9)' },
            { key: 'symbols', label: 'Symbols (!@#…)' },
            { key: 'avoidAmbiguous', label: 'Avoid ambiguous (0, O, l, I…)' },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={`pw-${key}`}
              checked={opts[key]}
              onCheckedChange={(checked) => {
                setOpt(key, checked === true)
              }}
            />
            <Label htmlFor={`pw-${key}`} className="text-sm font-normal">
              {label}
            </Label>
          </div>
        ))}
      </div>
    </>
  )
}
