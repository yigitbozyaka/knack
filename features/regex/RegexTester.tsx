'use client'

import { useMemo, useState } from 'react'

import { RegexIcon } from 'lucide-react'

import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { MAX_MATCHES, type RegexFlag, VALID_FLAGS, runRegex, toggleFlag } from './lib'

const FLAG_LABELS: Record<RegexFlag, string> = {
  g: 'global',
  i: 'ignore case',
  m: 'multiline',
  s: 'dot all',
  u: 'unicode',
  y: 'sticky',
}

export function RegexTester() {
  const [pattern, setPattern] = useState('(?<word>\\w+)@(\\w+)\\.com')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('mail ada@example.com or bob@knack.com today')

  const result = useMemo(() => runRegex(pattern, flags, text), [pattern, flags, text])

  return (
    <>
      <ToolPageHeader
        title="Regex Tester"
        description="Test JavaScript regular expressions with live highlighting and capture groups. Runs entirely in your browser."
        icon={RegexIcon}
      />

      <div className="mb-4 space-y-2">
        <label
          htmlFor="regex-pattern"
          className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
        >
          Pattern
        </label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono">/</span>
          <Input
            id="regex-pattern"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value)
            }}
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
            aria-invalid={!result.ok}
          />
          <span className="text-muted-foreground font-mono">/{flags}</span>
        </div>
        {!result.ok && (
          <p className="text-destructive text-xs" role="alert" data-testid="regex-error">
            {result.error}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Flags">
        {VALID_FLAGS.map((flag) => (
          <Button
            key={flag}
            variant={flags.includes(flag) ? 'default' : 'outline'}
            size="sm"
            aria-pressed={flags.includes(flag)}
            title={FLAG_LABELS[flag]}
            onClick={() => {
              setFlags((current) => toggleFlag(current, flag))
            }}
          >
            {flag}
          </Button>
        ))}
      </div>

      <div className="mb-4 space-y-2">
        <label
          htmlFor="regex-text"
          className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
        >
          Test string
        </label>
        <Textarea
          id="regex-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          spellCheck={false}
          className="min-h-32 font-mono"
        />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Highlighted
        </span>
        <span className="text-muted-foreground text-xs" data-testid="regex-count">
          {result.ok
            ? `${String(result.matches.length)}${result.truncated ? '+' : ''} ${
                result.matches.length === 1 && !result.truncated ? 'match' : 'matches'
              }`
            : '0 matches'}
        </span>
      </div>
      <pre
        data-testid="regex-highlight"
        className="border-border bg-muted/30 mb-2 max-h-80 overflow-auto rounded-lg border p-3 font-mono text-sm break-all whitespace-pre-wrap"
      >
        {result.ok ? (
          result.segments.map((segment, i) =>
            segment.matchIndex === null ? (
              <span key={i}>{segment.text}</span>
            ) : (
              <mark
                key={i}
                data-testid="regex-mark"
                className={cn(
                  'text-foreground rounded-sm px-0.5',
                  segment.matchIndex % 2 === 0 ? 'bg-yellow-300/60' : 'bg-orange-300/60',
                )}
              >
                {segment.text}
              </mark>
            ),
          )
        ) : (
          <span className="text-muted-foreground">{text}</span>
        )}
      </pre>
      {result.ok && result.truncated && (
        <p className="text-muted-foreground mb-4 text-xs" role="status">
          Showing the first {MAX_MATCHES} matches only.
        </p>
      )}

      {result.ok && result.matches.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="regex-groups">
            <caption className="text-muted-foreground mb-2 text-left text-xs font-medium tracking-wide uppercase">
              Matches and capture groups
            </caption>
            <thead>
              <tr className="border-border border-b">
                <th className="px-2 py-1.5 font-medium">#</th>
                <th className="px-2 py-1.5 font-medium">Range</th>
                <th className="px-2 py-1.5 font-medium">Match</th>
                <th className="px-2 py-1.5 font-medium">Groups</th>
              </tr>
            </thead>
            <tbody>
              {result.matches.map((match, i) => (
                <tr key={i} className="border-border border-b align-top" data-testid="regex-row">
                  <td className="text-muted-foreground px-2 py-1.5">{i + 1}</td>
                  <td className="text-muted-foreground px-2 py-1.5 font-mono">
                    {match.index}–{match.end}
                  </td>
                  <td className="px-2 py-1.5 font-mono break-all">{match.value}</td>
                  <td className="px-2 py-1.5">
                    {match.groups.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <ul className="space-y-0.5 font-mono">
                        {match.groups.map((group) => (
                          <li key={group.index} className="break-all">
                            <span className="text-muted-foreground">
                              {group.name ?? String(group.index)}:
                            </span>{' '}
                            {group.value ?? (
                              <span className="text-muted-foreground">undefined</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
