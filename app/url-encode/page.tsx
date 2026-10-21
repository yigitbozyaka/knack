import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { UrlEncodeTool } from '@/features/url-encode/UrlEncodeTool'

export const metadata: Metadata = {
  title: 'URL / HTML Encoder',
  description:
    'Percent-encode URL components or escape HTML entities, and decode them back. Runs entirely in your browser.',
}

export default function UrlEncodePage() {
  return (
    <ToolShell>
      <UrlEncodeTool />
    </ToolShell>
  )
}
