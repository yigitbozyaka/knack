'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'

import { CalendarClockIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { type CronZone, analyzeCron } from './lib'

const EXAMPLES = ['*/5 * * * *', '0 9 * * MON-FRI', '30 2 1 * *', '0 0 29 2 *', '@daily']

const subscribeNothing = () => () => undefined

function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  )
}

function formatRun(date: Date, zone: CronZone): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone === 'utc' ? 'UTC' : undefined,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).format(date)
}

export function CronParser() {
  const [expression, setExpression] = useState('*/15 9-17 * * MON-FRI')
  const [zone, setZone] = useState<CronZone>('local')
  const [now, setNow] = useState(() => new Date())
  const hydrated = useHydrated()

  const result = useMemo(() => analyzeCron(expression, now, zone), [expression, now, zone])

  return (
    <>
      <ToolPageHeader
        title="Cron Parser"
        description="Explain a 5-field cron expression in plain English and preview its next runs. Runs entirely in your browser."
        icon={CalendarClockIcon}
      />

      <div className="mb-4 space-y-2">
        <label
          htmlFor="cron-expression"
          className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
        >
          Cron expression
        </label>
        <Input
          id="cron-expression"
          value={expression}
          onChange={(e) => {
            setExpression(e.target.value)
            setNow(new Date())
          }}
          placeholder="minute hour day-of-month month day-of-week"
          spellCheck={false}
          autoComplete="off"
          className="font-mono"
          aria-invalid={!result.ok}
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <Button
              key={example}
              variant="ghost"
              size="xs"
              className="font-mono"
              onClick={() => {
                setExpression(example)
                setNow(new Date())
              }}
            >
              {example}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Time zone">
        {(['local', 'utc'] as const).map((z) => (
          <Button
            key={z}
            variant={zone === z ? 'default' : 'outline'}
            size="sm"
            aria-pressed={zone === z}
            onClick={() => {
              setZone(z)
            }}
          >
            {z === 'local' ? 'Local time' : 'UTC'}
          </Button>
        ))}
      </div>

      {!result.ok && (
        <p className="text-destructive text-sm" role="alert" data-testid="cron-error">
          {result.error}
        </p>
      )}

      {result.ok && hydrated && (
        <>
          <div className="bg-muted/30 border-border mb-6 rounded-lg border px-4 py-3">
            <div className="text-muted-foreground mb-1 text-xs">Meaning</div>
            <p className="text-sm" data-testid="cron-description">
              {result.description}
            </p>
          </div>

          <div className="mb-2 text-xs font-medium tracking-wide uppercase">
            <span className="text-muted-foreground">Next runs</span>
          </div>
          {result.neverRuns ? (
            <p className="text-muted-foreground text-sm" data-testid="cron-never">
              This expression never matches a real date in the next 40 years.
            </p>
          ) : (
            <ol
              className="border-border divide-border divide-y rounded-lg border"
              data-testid="cron-runs"
            >
              {result.nextRuns.map((run) => {
                const text = formatRun(run, zone)
                return (
                  <li
                    key={run.getTime()}
                    className="flex items-center justify-between px-3 py-2"
                    data-testid="cron-run"
                  >
                    <span className="font-mono text-sm">{text}</span>
                    <CopyButton value={run.toISOString()} size="icon-xs" label="Copy ISO time" />
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </>
  )
}
