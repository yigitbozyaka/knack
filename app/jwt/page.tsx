import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { JwtDecoder } from '@/features/jwt/JwtDecoder'

export const metadata: Metadata = {
  title: 'JWT Decoder',
  description:
    'Decode JSON Web Tokens and inspect header, payload, and expiry. Decode only — no verification, and the token never leaves your browser.',
}

export default function JwtPage() {
  return (
    <ToolShell>
      <JwtDecoder />
    </ToolShell>
  )
}
