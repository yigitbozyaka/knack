import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { CronParser } from '@/features/cron/CronParser'

export const metadata: Metadata = {
  title: 'Cron Parser',
  description:
    'Explain a 5-field cron expression in plain English and preview its next five runs. Runs entirely in your browser — no upload, no server.',
}

export default function CronPage() {
  return (
    <ToolShell>
      <CronParser />
    </ToolShell>
  )
}
