'use client'

import { useState } from 'react'

import { CheckIcon, PaletteIcon, XIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import {
  type Rgb,
  contrastRatio,
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  parseColor,
  wcagLevels,
} from './lib'

type Format = 'hex' | 'rgb' | 'hsl' | 'oklch'

const FORMATS: { key: Format; label: string }[] = [
  { key: 'hex', label: 'HEX' },
  { key: 'rgb', label: 'RGB' },
  { key: 'hsl', label: 'HSL' },
  { key: 'oklch', label: 'OKLCH' },
]

const FORMATTERS: Record<Format, (rgb: Rgb) => string> = {
  hex: formatHex,
  rgb: formatRgb,
  hsl: formatHsl,
  oklch: formatOklch,
}

const INITIAL_RGB: Rgb = { r: 26, g: 43, b: 60 }
const INITIAL_BACKGROUND = '#ffffff'

function draftsFor(rgb: Rgb): Record<Format, string> {
  return {
    hex: formatHex(rgb),
    rgb: formatRgb(rgb),
    hsl: formatHsl(rgb),
    oklch: formatOklch(rgb),
  }
}

function BadgeRow({ label, pass, testId }: { label: string; pass: boolean; testId: string }) {
  return (
    <li
      data-testid={testId}
      data-pass={pass}
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
        pass
          ? 'border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400'
          : 'border-destructive/40 bg-destructive/10 text-destructive',
      )}
    >
      <span>{label}</span>
      <span className="flex items-center gap-1 font-medium">
        {pass ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />}
        {pass ? 'Pass' : 'Fail'}
      </span>
    </li>
  )
}

export function ColorConverter() {
  const [rgb, setRgb] = useState<Rgb>(INITIAL_RGB)
  const [drafts, setDrafts] = useState(() => draftsFor(INITIAL_RGB))
  const [errors, setErrors] = useState<Partial<Record<Format, string>>>({})

  const [backgroundText, setBackgroundText] = useState(INITIAL_BACKGROUND)
  const backgroundParsed = parseColor(backgroundText)

  const editFormat = (format: Format, value: string) => {
    const parsed = parseColor(value)
    if (parsed.ok) {
      setRgb(parsed.rgb)
      setDrafts({ ...draftsFor(parsed.rgb), [format]: value })
      setErrors({})
    } else {
      setDrafts({ ...drafts, [format]: value })
      setErrors({ [format]: parsed.error })
    }
  }

  const pickNative = (hex: string) => {
    const parsed = parseColor(hex)
    if (!parsed.ok) return
    setRgb(parsed.rgb)
    setDrafts(draftsFor(parsed.rgb))
    setErrors({})
  }

  const nativeValue = formatHex(rgb)
  const ratio = backgroundParsed.ok ? contrastRatio(rgb, backgroundParsed.rgb) : null
  const levels = ratio === null ? null : wcagLevels(ratio)

  return (
    <>
      <ToolPageHeader
        title="Color Converter"
        description="Convert between HEX, RGB, HSL, and OKLCH and check WCAG contrast. Runs entirely in your browser."
        icon={PaletteIcon}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-start gap-2">
          <Label htmlFor="color-native">Pick a color</Label>
          <input
            id="color-native"
            data-testid="color-native"
            type="color"
            value={nativeValue}
            onChange={(event) => {
              pickNative(event.target.value)
            }}
            className="border-border h-24 w-32 cursor-pointer rounded-lg border bg-transparent p-1"
          />
        </div>

        <div className="flex flex-col gap-3">
          {FORMATS.map(({ key, label }) => {
            const error = errors[key]
            return (
              <div key={key} className="flex flex-col gap-1">
                <Label htmlFor={`color-${key}`}>{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`color-${key}`}
                    data-testid={`color-${key}`}
                    value={drafts[key]}
                    spellCheck={false}
                    autoComplete="off"
                    aria-invalid={error !== undefined}
                    aria-describedby={error ? `color-${key}-error` : undefined}
                    onChange={(event) => {
                      editFormat(key, event.target.value)
                    }}
                    className="font-mono"
                  />
                  <CopyButton value={FORMATTERS[key](rgb)} size="icon-sm" label={`Copy ${label}`} />
                </div>
                {error && (
                  <p
                    id={`color-${key}-error`}
                    data-testid={`color-${key}-error`}
                    className="text-destructive text-xs"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <section aria-labelledby="contrast-heading" className="border-border rounded-lg border p-4">
        <h2 id="contrast-heading" className="mb-1 text-base font-semibold">
          WCAG contrast
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The color above is used as text on the background below.
        </p>

        <div className="mb-4 flex flex-col gap-1">
          <Label htmlFor="contrast-background">Background color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick background color"
              data-testid="contrast-background-native"
              value={backgroundParsed.ok ? formatHex(backgroundParsed.rgb) : INITIAL_BACKGROUND}
              onChange={(event) => {
                setBackgroundText(event.target.value)
              }}
              className="border-border h-8 w-12 cursor-pointer rounded-lg border bg-transparent p-0.5"
            />
            <Input
              id="contrast-background"
              data-testid="contrast-background"
              value={backgroundText}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!backgroundParsed.ok}
              aria-describedby={!backgroundParsed.ok ? 'contrast-background-error' : undefined}
              onChange={(event) => {
                setBackgroundText(event.target.value)
              }}
              className="font-mono"
            />
          </div>
          {!backgroundParsed.ok && (
            <p
              id="contrast-background-error"
              data-testid="contrast-background-error"
              className="text-destructive text-xs"
              role="alert"
            >
              {backgroundParsed.error}
            </p>
          )}
        </div>

        {backgroundParsed.ok && ratio !== null && levels && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div
              className="flex flex-col justify-center gap-1 rounded-lg border p-4"
              style={{
                color: formatHex(rgb),
                backgroundColor: formatHex(backgroundParsed.rgb),
              }}
            >
              <span className="text-2xl font-bold">Large text sample</span>
              <span className="text-sm">Normal text sample for checking legibility.</span>
            </div>

            <div>
              <p className="mb-2 text-sm">
                Contrast ratio:{' '}
                <span data-testid="contrast-ratio" className="font-mono text-lg font-semibold">
                  {(Math.floor(ratio * 100) / 100).toFixed(2)}:1
                </span>
              </p>
              <ul className="grid grid-cols-2 gap-2">
                <BadgeRow
                  label="AA normal (4.5)"
                  pass={levels.aaNormal}
                  testId="contrast-aa-normal"
                />
                <BadgeRow label="AA large (3)" pass={levels.aaLarge} testId="contrast-aa-large" />
                <BadgeRow
                  label="AAA normal (7)"
                  pass={levels.aaaNormal}
                  testId="contrast-aaa-normal"
                />
                <BadgeRow
                  label="AAA large (4.5)"
                  pass={levels.aaaLarge}
                  testId="contrast-aaa-large"
                />
              </ul>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
