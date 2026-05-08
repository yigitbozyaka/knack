import Link from 'next/link'

import { ArrowUpRightIcon } from 'lucide-react'

import { type Tool } from '@/lib/tools/registry'
import { cn } from '@/lib/utils'

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const isLive = tool.status === 'live'

  const className = cn(
    'group bg-card border-border flex flex-col gap-3 rounded-xl border p-4 transition-colors',
    isLive ? 'hover:border-foreground/40 hover:bg-card/80' : 'cursor-not-allowed opacity-60',
  )

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <Icon className="text-muted-foreground size-5" aria-hidden />
        {isLive ? (
          <ArrowUpRightIcon className="text-muted-foreground/60 group-hover:text-foreground size-4 transition-colors" />
        ) : (
          <span className="border-border text-muted-foreground rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
            Soon
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-medium">{tool.name}</h3>
        <p className="text-muted-foreground text-xs leading-snug">{tool.description}</p>
      </div>
    </>
  )

  if (!isLive) {
    return (
      <div className={className} aria-disabled="true">
        {inner}
      </div>
    )
  }

  return (
    <Link href={`/${tool.slug}`} className={className}>
      {inner}
    </Link>
  )
}
