import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { Formatter } from '@/features/format/Formatter'

export const metadata: Metadata = {
  title: 'Formatter',
  description:
    'Pretty-print, minify, and validate JSON, XML, and YAML. Runs entirely in your browser — no upload, no server.',
}

export default function FormatPage() {
  return (
    <ToolShell>
      <Formatter />
    </ToolShell>
  )
}
