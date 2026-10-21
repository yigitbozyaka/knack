import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { Base64Tool } from '@/features/base64/Base64Tool'

export const metadata: Metadata = {
  title: 'Base64 Encoder',
  description:
    'Encode and decode UTF-8 text to and from base64 or base64url. Runs entirely in your browser — no upload, no server.',
}

export default function Base64Page() {
  return (
    <ToolShell>
      <Base64Tool />
    </ToolShell>
  )
}
