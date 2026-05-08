import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { UuidGenerator } from '@/features/generate-uuid/UuidGenerator'

export const metadata: Metadata = {
  title: 'UUID Generator',
  description:
    'Generate RFC-compliant UUID v4 and v7 identifiers instantly in your browser. No server, no logging.',
}

export default function UuidPage() {
  return (
    <ToolShell>
      <UuidGenerator />
    </ToolShell>
  )
}
