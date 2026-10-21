'use client'

import { useEffect, useMemo, useState } from 'react'

import { DiffIcon } from 'lucide-react'

import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import {
  type DiffMode,
  type RowKind,
  type Segment,
  type SegmentKind,
  type SplitCell,
  computeDiff,
} from './lib'

type ViewMode = 'unified' | 'split'

const DEBOUNCE_MS = 250

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])
  return debounced
}

const ROW_STYLES: Record<RowKind, string> = {
  context: '',
  add: 'bg-green-500/10',
  remove: 'bg-red-500/10',
}

const SEGMENT_STYLES: Record<SegmentKind, string> = {
  equal: '',
  add: 'bg-green-500/30',
  remove: 'bg-red-500/30 line-through decoration-red-500/60',
}

const ROW_PREFIX: Record<RowKind, string> = { context: ' ', add: '+', remove: '-' }

function Segments({ segments, highlight }: { segments: Segment[]; highlight: boolean }) {
  return (
    <>
      {segments.map((segment, i) => (
        <span key={i} className={cn(highlight && SEGMENT_STYLES[segment.kind], 'rounded-sm')}>
          {segment.text}
        </span>
      ))}
    </>
  )
}

function SplitSide({ cell }: { cell: SplitCell | null }) {
  if (!cell) return <div className="bg-muted/40 min-h-6" />
  return (
    <div className={cn('flex min-h-6 gap-2 px-2', ROW_STYLES[cell.kind])}>
      <span className="text-muted-foreground w-8 shrink-0 text-right select-none">
        {cell.lineNumber}
      </span>
      <span className="break-all whitespace-pre-wrap">
        <Segments segments={cell.segments} highlight />
      </span>
    </div>
  )
}

export function DiffViewer() {
  const [original, setOriginal] = useState('const greeting = "hello"\nconsole.log(greeting)\n')
  const [modified, setModified] = useState(
    'const greeting = "hello world"\nconsole.log(greeting)\nexport {}\n',
  )
  const [mode, setMode] = useState<DiffMode>('line')
  const [view, setView] = useState<ViewMode>('unified')

  const debouncedOriginal = useDebounced(original, DEBOUNCE_MS)
  const debouncedModified = useDebounced(modified, DEBOUNCE_MS)

  const result = useMemo(
    () => computeDiff(debouncedOriginal, debouncedModified, mode),
    [debouncedOriginal, debouncedModified, mode],
  )

  return (
    <>
      <ToolPageHeader
        title="Text Diff"
        description="Compare two texts line by line or word by word, unified or side by side. Runs entirely in your browser."
        icon={DiffIcon}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="diff-original"
            className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
          >
            Original
          </label>
          <Textarea
            id="diff-original"
            value={original}
            onChange={(e) => {
              setOriginal(e.target.value)
            }}
            spellCheck={false}
            className="min-h-40 font-mono"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="diff-modified"
            className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
          >
            Modified
          </label>
          <Textarea
            id="diff-modified"
            value={modified}
            onChange={(e) => {
              setModified(e.target.value)
            }}
            spellCheck={false}
            className="min-h-40 font-mono"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-6">
        <div className="flex gap-2" role="group" aria-label="Diff granularity">
          {(['line', 'word'] as const).map((m) => (
            <Button
              key={m}
              variant={mode === m ? 'default' : 'outline'}
              size="sm"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m)
              }}
            >
              {m === 'line' ? 'Line' : 'Word'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2" role="group" aria-label="Layout">
          {(['unified', 'split'] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'outline'}
              size="sm"
              aria-pressed={view === v}
              onClick={() => {
                setView(v)
              }}
            >
              {v === 'unified' ? 'Unified' : 'Side by side'}
            </Button>
          ))}
        </div>
        {result.ok && (
          <span className="text-muted-foreground text-xs" data-testid="diff-stats">
            +{result.stats.added} −{result.stats.removed} ={result.stats.unchanged}
          </span>
        )}
      </div>

      {!result.ok && (
        <p className="text-destructive text-sm" role="alert">
          {result.error}
        </p>
      )}

      {result.ok && result.notes.length > 0 && (
        <ul className="text-muted-foreground mb-3 space-y-1 text-xs" data-testid="diff-notes">
          {result.notes.map((note) => (
            <li key={note} role="status">
              {note}
            </li>
          ))}
        </ul>
      )}

      {result.ok && view === 'unified' && (
        <div
          data-testid="diff-output"
          className="border-border bg-muted/30 overflow-x-auto rounded-lg border py-2 font-mono text-sm"
        >
          {result.mode === 'word' ? (
            <div className="px-3 break-words whitespace-pre-wrap">
              <Segments segments={result.unified[0]?.segments ?? []} highlight />
            </div>
          ) : (
            result.unified.map((row, i) => (
              <div
                key={i}
                data-testid="diff-row"
                data-kind={row.kind}
                className={cn('flex min-h-6 gap-2 px-2', ROW_STYLES[row.kind])}
              >
                <span className="text-muted-foreground w-8 shrink-0 text-right select-none">
                  {row.oldLine ?? ''}
                </span>
                <span className="text-muted-foreground w-8 shrink-0 text-right select-none">
                  {row.newLine ?? ''}
                </span>
                <span className="text-muted-foreground w-3 shrink-0 select-none">
                  {ROW_PREFIX[row.kind]}
                </span>
                <span className="break-all whitespace-pre-wrap">
                  <Segments segments={row.segments} highlight={row.kind !== 'context'} />
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {result.ok && view === 'split' && (
        <div
          data-testid="diff-output"
          className="border-border bg-muted/30 grid grid-cols-2 overflow-x-auto rounded-lg border py-2 font-mono text-sm"
        >
          {result.split.map((row, i) => (
            <div key={i} className="contents" data-testid="diff-row">
              <SplitSide cell={row.left} />
              <SplitSide cell={row.right} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
