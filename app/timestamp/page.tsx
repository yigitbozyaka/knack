import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { TimestampConverter } from '@/features/timestamp/TimestampConverter'

export const metadata: Metadata = {
  title: 'Timestamp Converter',
  description:
    'Convert Unix seconds or milliseconds to ISO 8601, UTC and local time, and back. Runs entirely in your browser — no upload, no server.',
}

export default function TimestampPage() {
  return (
    <ToolShell>
      <TimestampConverter />
    </ToolShell>
  )
}
