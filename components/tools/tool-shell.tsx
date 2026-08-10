import { type ReactNode } from 'react'

import Link from 'next/link'

import { ChevronLeftIcon } from 'lucide-react'

import { ToolErrorBoundary } from '@/components/tools/tool-error-boundary'
import { cn } from '@/lib/utils'

interface ToolShellProps {
  children: ReactNode
  wide?: boolean
}

export function ToolShell({ children, wide = false }: ToolShellProps) {
  return (
    <div className={cn('mx-auto w-full px-4 py-8', wide ? 'max-w-[100rem]' : 'max-w-4xl')}>
      <nav className="mb-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeftIcon className="size-4" />
          All tools
        </Link>
      </nav>
      <ToolErrorBoundary>{children}</ToolErrorBoundary>
    </div>
  )
}
