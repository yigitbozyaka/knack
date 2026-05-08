import { type ReactNode } from 'react'

import { CopyButton } from '@/components/tools/copy-button'
import { cn } from '@/lib/utils'

interface OutputPanelProps {
  value: string
  language?: string
  actions?: ReactNode
  monospace?: boolean
  className?: string
}

// Usage: <OutputPanel value={result} language="json" />
export function OutputPanel({
  value,
  language,
  actions,
  monospace = true,
  className,
}: OutputPanelProps) {
  return (
    <div className={cn('bg-muted/30 border-border relative rounded-lg border', className)}>
      <div className="flex items-center justify-between border-b px-3 py-2">
        {language ? (
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {language}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1.5">
          {actions}
          <CopyButton value={value} size="icon-xs" label="Copy output" />
        </div>
      </div>
      <pre
        className={cn(
          'text-foreground max-h-96 overflow-auto p-3 text-sm break-all whitespace-pre-wrap',
          monospace && 'font-mono',
        )}
        data-language={language}
      >
        {value || <span className="text-muted-foreground italic">No output yet</span>}
      </pre>
    </div>
  )
}
