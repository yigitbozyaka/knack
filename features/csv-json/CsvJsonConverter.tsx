'use client'

import { useMemo, useState } from 'react'

import { ArrowLeftRightIcon, TableIcon } from 'lucide-react'

import { OutputPanel } from '@/components/tools/output-panel'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { DELIMITERS, type DelimiterName, csvToJson, jsonToCsv } from './lib'

type Direction = 'csv-to-json' | 'json-to-csv'

const DELIMITER_LABELS: Record<DelimiterName, string> = {
  comma: 'Comma ( , )',
  semicolon: 'Semicolon ( ; )',
  tab: 'Tab',
  pipe: 'Pipe ( | )',
}

export function CsvJsonConverter() {
  const [direction, setDirection] = useState<Direction>('csv-to-json')
  const [delimiterName, setDelimiterName] = useState<DelimiterName>('comma')
  const [header, setHeader] = useState(true)
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (input.trim() === '') return null
    const options = { delimiter: DELIMITERS[delimiterName], header }
    return direction === 'csv-to-json' ? csvToJson(input, options) : jsonToCsv(input, options)
  }, [direction, delimiterName, header, input])

  const error = result && !result.ok ? result.error : null
  const output = result?.ok ? result.output : ''
  const outputLanguage = direction === 'csv-to-json' ? 'json' : 'csv'

  const swap = () => {
    setDirection(direction === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json')
    setInput(output)
  }

  return (
    <>
      <ToolPageHeader
        title="CSV ⇄ JSON Converter"
        description="Convert between CSV and JSON with RFC 4180 quoting. Runs entirely in your browser."
        icon={TableIcon}
      />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Direction">
          <Button
            variant={direction === 'csv-to-json' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={direction === 'csv-to-json'}
            onClick={() => {
              setDirection('csv-to-json')
            }}
          >
            CSV → JSON
          </Button>
          <Button
            variant={direction === 'json-to-csv' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={direction === 'json-to-csv'}
            onClick={() => {
              setDirection('json-to-csv')
            }}
          >
            JSON → CSV
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="csv-delimiter">Delimiter</Label>
          <select
            id="csv-delimiter"
            data-testid="csv-delimiter"
            value={delimiterName}
            onChange={(event) => {
              setDelimiterName(event.target.value as DelimiterName)
            }}
            className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
          >
            {(Object.keys(DELIMITERS) as DelimiterName[]).map((name) => (
              <option key={name} value={name}>
                {DELIMITER_LABELS[name]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pb-1.5">
          <Checkbox
            id="csv-header"
            checked={header}
            onCheckedChange={(checked) => {
              setHeader(checked === true)
            }}
          />
          <Label htmlFor="csv-header" className="text-sm font-normal">
            First row is a header
          </Label>
        </div>

        <Button variant="outline" size="sm" onClick={swap} disabled={output === ''}>
          <ArrowLeftRightIcon />
          Use output as input
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="csv-input"
            className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
          >
            {direction === 'csv-to-json' ? 'CSV input' : 'JSON input'}
          </label>
          <textarea
            id="csv-input"
            data-testid="csv-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
            }}
            placeholder={
              direction === 'csv-to-json' ? 'name,age\nAda,36' : '[{"name": "Ada", "age": 36}]'
            }
            spellCheck={false}
            aria-invalid={error !== null}
            aria-describedby={error ? 'csv-error' : undefined}
            className={cn(
              'border-border bg-muted/30 focus:ring-ring h-80 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2',
              error && 'border-destructive',
            )}
          />
          {error && (
            <p
              id="csv-error"
              data-testid="csv-error"
              className="text-destructive text-xs"
              role="alert"
            >
              {error.line !== undefined
                ? `Line ${String(error.line)}${error.col !== undefined ? `, col ${String(error.col)}` : ''}: `
                : ''}
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Output
          </span>
          <div data-testid="csv-output">
            <OutputPanel value={output} language={outputLanguage} />
          </div>
        </div>
      </div>
    </>
  )
}
