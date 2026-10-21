'use client'

import { useMemo, useState } from 'react'

import { ClockIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { type NumericUnit, type TimestampUnit, parseTimestamp } from './lib'

const UNIT_OPTIONS: { value: TimestampUnit; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 's', label: 'Seconds' },
  { value: 'ms', label: 'Milliseconds' },
  { value: 'us', label: 'Microseconds' },
  { value: 'ns', label: 'Nanoseconds' },
]

const UNIT_NAMES: Record<NumericUnit, string> = {
  s: 'seconds',
  ms: 'milliseconds',
  us: 'microseconds',
  ns: 'nanoseconds',
}

function currentTimeIn(unit: TimestampUnit, current: Date): string {
  const milliseconds = current.getTime()
  if (unit === 'ms') return String(milliseconds)
  if (unit === 'us') return String(BigInt(milliseconds) * BigInt(1000))
  if (unit === 'ns') return String(BigInt(milliseconds) * BigInt(1000000))
  return String(Math.floor(milliseconds / 1000))
}

export function TimestampConverter() {
  const [input, setInput] = useState('')
  const [unit, setUnit] = useState<TimestampUnit>('auto')
  const [now, setNow] = useState(() => new Date())

  const result = useMemo(() => parseTimestamp(input, unit, now), [input, unit, now])

  const setToNow = () => {
    const current = new Date()
    setNow(current)
    setInput(currentTimeIn(unit, current))
  }

  const rows = result.ok
    ? [
        { key: 'unix-seconds', label: 'Unix (seconds)', value: String(result.value.unixSeconds) },
        {
          key: 'unix-milliseconds',
          label: 'Unix (milliseconds)',
          value: String(result.value.unixMilliseconds),
        },
        { key: 'iso', label: 'ISO 8601 (UTC)', value: result.value.iso },
        { key: 'utc', label: 'UTC', value: result.value.utc },
        {
          key: 'local',
          label: `Local (${result.value.timeZone})`,
          value: result.value.local,
        },
        { key: 'relative', label: 'Relative', value: result.value.relative },
      ]
    : []

  return (
    <>
      <ToolPageHeader
        title="Timestamp Converter"
        description="Convert Unix seconds or milliseconds to ISO 8601, UTC and local time, and back. Runs entirely in your browser."
        icon={ClockIcon}
      />

      <div className="mb-4 space-y-2">
        <label
          htmlFor="timestamp-input"
          className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
        >
          Timestamp or date
        </label>
        <div className="flex gap-2">
          <Input
            id="timestamp-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
            }}
            placeholder="1700000000 or 2023-11-14T22:13:20Z"
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
            aria-invalid={input.trim() !== '' && !result.ok}
          />
          <Button onClick={setToNow}>Now</Button>
        </div>
        {input.trim() !== '' && !result.ok && (
          <p className="text-destructive text-xs" role="alert" data-testid="timestamp-error">
            {result.error}
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Numeric unit">
        {UNIT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={unit === option.value ? 'default' : 'outline'}
            size="sm"
            aria-pressed={unit === option.value}
            onClick={() => {
              setUnit(option.value)
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {result.ok && (
        <ul
          className="border-border divide-border divide-y rounded-lg border"
          data-testid="timestamp-output"
        >
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs">{row.label}</div>
                <div className="font-mono text-sm break-all" data-testid={`timestamp-${row.key}`}>
                  {row.value}
                </div>
              </div>
              <CopyButton value={row.value} size="icon-xs" label={`Copy ${row.label}`} />
            </li>
          ))}
        </ul>
      )}

      {result.ok && result.value.detectedUnit && (
        <p className="text-muted-foreground mt-3 text-xs">
          Interpreted as {UNIT_NAMES[result.value.detectedUnit]} since the Unix epoch.
        </p>
      )}
      <p className="text-muted-foreground mt-3 text-xs">
        Date strings without an offset are read as local time, except date-only values such as
        2026-10-21, which are read as UTC.
      </p>
    </>
  )
}
