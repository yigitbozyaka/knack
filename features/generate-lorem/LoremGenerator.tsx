'use client'

import { useState } from 'react'

import { RefreshCwIcon, TextIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { LOREM_LIMITS, type LoremUnit, clampCount, generateLorem } from './lib'

const UNITS: { value: LoremUnit; label: string }[] = [
  { value: 'paragraphs', label: 'Paragraphs' },
  { value: 'sentences', label: 'Sentences' },
  { value: 'words', label: 'Words' },
]

export function LoremGenerator() {
  const [unit, setUnit] = useState<LoremUnit>('paragraphs')
  const [count, setCount] = useState(3)
  const [countText, setCountText] = useState('3')
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [output, setOutput] = useState(() =>
    generateLorem({ unit: 'paragraphs', count: 3, startWithLorem: true }),
  )

  const apply = (next: { unit?: LoremUnit; count?: number; startWithLorem?: boolean }) => {
    const nextUnit = next.unit ?? unit
    const nextCount = clampCount(nextUnit, next.count ?? count)
    const nextStart = next.startWithLorem ?? startWithLorem
    setUnit(nextUnit)
    setCount(nextCount)
    setCountText(String(nextCount))
    setStartWithLorem(nextStart)
    setOutput(generateLorem({ unit: nextUnit, count: nextCount, startWithLorem: nextStart }))
  }

  const editCount = (text: string) => {
    setCountText(text)
    const parsed = parseInt(text, 10)
    if (Number.isNaN(parsed)) return
    const nextCount = clampCount(unit, parsed)
    setCount(nextCount)
    setOutput(generateLorem({ unit, count: nextCount, startWithLorem }))
  }

  return (
    <>
      <ToolPageHeader
        title="Lorem Ipsum Generator"
        description="Placeholder text in paragraphs, sentences, or words. Generated in your browser with crypto.getRandomValues."
        icon={TextIcon}
      />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Unit">
          {UNITS.map((item) => (
            <Button
              key={item.value}
              variant={unit === item.value ? 'default' : 'outline'}
              size="sm"
              aria-pressed={unit === item.value}
              onClick={() => {
                apply({ unit: item.value })
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="flex w-28 flex-col gap-1.5">
          <Label htmlFor="lorem-count">Count (max {LOREM_LIMITS[unit]})</Label>
          <Input
            id="lorem-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={LOREM_LIMITS[unit]}
            value={countText}
            onChange={(event) => {
              editCount(event.target.value)
            }}
            onBlur={() => {
              setCountText(String(count))
            }}
          />
        </div>

        <div className="flex items-center gap-2 pb-1.5">
          <Checkbox
            id="lorem-start"
            checked={startWithLorem}
            onCheckedChange={(checked) => {
              apply({ startWithLorem: checked === true })
            }}
          />
          <Label htmlFor="lorem-start" className="text-sm font-normal">
            Start with &ldquo;Lorem ipsum&rdquo;
          </Label>
        </div>
      </div>

      <div className="bg-muted/30 border-border mb-3 rounded-lg border p-4">
        <p
          data-testid="lorem-output"
          className="text-sm leading-relaxed whitespace-pre-wrap"
          aria-live="polite"
        >
          {output}
        </p>
      </div>

      <div className="flex gap-2">
        <CopyButton value={output} label="Copy text" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            apply({})
          }}
        >
          <RefreshCwIcon />
          Regenerate
        </Button>
      </div>
    </>
  )
}
