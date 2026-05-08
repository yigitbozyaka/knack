import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { SecretGenerator } from '@/features/generate-secret/SecretGenerator'

export const metadata: Metadata = {
  title: 'Secret Generator',
  description:
    'Generate cryptographic random strings for API keys, JWT secrets, and session tokens. Runs entirely in your browser.',
}

export default function SecretPage() {
  return (
    <ToolShell>
      <SecretGenerator />
    </ToolShell>
  )
}
