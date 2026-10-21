import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { LoremGenerator } from '@/features/generate-lorem/LoremGenerator'

export const metadata: Metadata = {
  title: 'Lorem Ipsum Generator',
  description:
    'Generate lorem ipsum placeholder text as paragraphs, sentences, or words. Runs entirely in your browser.',
}

export default function LoremGeneratorPage() {
  return (
    <ToolShell>
      <LoremGenerator />
    </ToolShell>
  )
}
