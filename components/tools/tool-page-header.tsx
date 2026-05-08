import { type ReactNode } from 'react'

import { type LucideIcon } from 'lucide-react'

interface ToolPageHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  actions?: ReactNode
}

export function ToolPageHeader({ title, description, icon: Icon, actions }: ToolPageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground mt-0.5 flex rounded-lg p-2">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm leading-snug">{description}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
