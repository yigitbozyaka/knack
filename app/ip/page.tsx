import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { IpViewer } from '@/features/ip/IpViewer'

export const metadata: Metadata = {
  title: "What's My IP?",
  description:
    'See your public IP address instantly. Nothing is logged or stored — your IP is never saved.',
}

export default function IpPage() {
  return (
    <ToolShell>
      <IpViewer />
    </ToolShell>
  )
}
