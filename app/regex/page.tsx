import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { RegexTester } from '@/features/regex/RegexTester'

export const metadata: Metadata = {
  title: 'Regex Tester',
  description:
    'Test JavaScript regular expressions with live match highlighting and capture groups. Runs entirely in your browser — no upload, no server.',
}

export default function RegexPage() {
  return (
    <ToolShell>
      <RegexTester />
    </ToolShell>
  )
}
