import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center',
        className,
      )}
      role="status"
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <h2 className="text-foreground text-base font-medium">{title}</h2>
      {description ? <p className="text-muted-foreground max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
