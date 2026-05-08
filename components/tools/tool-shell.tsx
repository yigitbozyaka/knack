import { type ReactNode } from 'react'

import Link from 'next/link'

import { ChevronLeftIcon } from 'lucide-react'

import { ToolErrorBoundary } from '@/components/tools/tool-error-boundary'

interface ToolShellProps {
  children: ReactNode
}

export function ToolShell({ children }: ToolShellProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
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
