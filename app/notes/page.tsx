import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { NotesAppNoSSR } from '@/features/notes/NotesAppNoSSR'

export const metadata: Metadata = {
  title: 'Scratchpad',
  description:
    'Browser-local notes. No account, no server — stored only in this browser. Your notes never leave your device.',
}

export default function NotesPage() {
  return (
    <ToolShell>
      <NotesAppNoSSR />
    </ToolShell>
  )
}
