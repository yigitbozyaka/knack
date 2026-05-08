import dynamic from 'next/dynamic'

import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'

// NotesApp reads from localStorage on init — disable SSR entirely to avoid hydration mismatch.
const NotesApp = dynamic(() => import('@/features/notes/NotesApp').then((m) => m.NotesApp), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Scratchpad',
  description:
    'Browser-local notes. No account, no server — stored only in this browser. Your notes never leave your device.',
}

export default function NotesPage() {
  return (
    <ToolShell>
      <NotesApp />
    </ToolShell>
  )
}
