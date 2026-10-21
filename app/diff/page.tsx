import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { DiffViewer } from '@/features/diff/DiffViewer'

export const metadata: Metadata = {
  title: 'Text Diff',
  description:
    'Compare two texts line by line or word by word, unified or side by side. Runs entirely in your browser — no upload, no server.',
}

export default function DiffPage() {
  return (
    <ToolShell wide>
      <DiffViewer />
    </ToolShell>
  )
}
