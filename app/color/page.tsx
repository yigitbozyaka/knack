import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { ColorConverter } from '@/features/color/ColorConverter'

export const metadata: Metadata = {
  title: 'Color Converter',
  description:
    'Convert colors between HEX, RGB, HSL, and OKLCH and check WCAG AA/AAA contrast. Runs entirely in your browser.',
}

export default function ColorConverterPage() {
  return (
    <ToolShell>
      <ColorConverter />
    </ToolShell>
  )
}
