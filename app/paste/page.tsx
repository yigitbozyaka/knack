import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { PasteTool } from '@/features/paste/PasteTool'

export const metadata: Metadata = {
  title: 'Paste',
  description: 'Share text snippets with optional expiry. Anonymous or signed-in.',
}

export default function PastePage() {
  return (
    <ToolShell>
      <PasteTool />
    </ToolShell>
  )
}
