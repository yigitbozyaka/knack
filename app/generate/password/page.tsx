import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { PasswordGenerator } from '@/features/generate-password/PasswordGenerator'

export const metadata: Metadata = {
  title: 'Password Generator',
  description:
    'Generate strong random passwords with adjustable length and character set. Runs entirely in your browser.',
}

export default function PasswordPage() {
  return (
    <ToolShell>
      <PasswordGenerator />
    </ToolShell>
  )
}
