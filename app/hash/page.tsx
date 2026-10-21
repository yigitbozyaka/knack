import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { HashGenerator } from '@/features/hash/HashGenerator'

export const metadata: Metadata = {
  title: 'Hash Generator',
  description:
    'Compute SHA-1, SHA-256, SHA-384, and SHA-512 hashes with the Web Crypto API. Your text never leaves the browser.',
}

export default function HashPage() {
  return (
    <ToolShell>
      <HashGenerator />
    </ToolShell>
  )
}
