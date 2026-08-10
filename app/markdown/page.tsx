import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { MarkdownViewer } from '@/features/markdown/MarkdownViewer'

export const metadata: Metadata = {
  title: 'Markdown Viewer',
  description:
    'Live markdown preview with syntax highlighting. All output is sanitized — safe to paste untrusted content.',
}

export default function MarkdownPage() {
  return (
    <ToolShell wide>
      <MarkdownViewer />
    </ToolShell>
  )
}
