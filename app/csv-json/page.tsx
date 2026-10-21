import { type Metadata } from 'next'

import { ToolShell } from '@/components/tools/tool-shell'
import { CsvJsonConverter } from '@/features/csv-json/CsvJsonConverter'

export const metadata: Metadata = {
  title: 'CSV ⇄ JSON Converter',
  description:
    'Convert CSV to JSON and JSON to CSV with delimiter choice, header toggle, and correct quoting. Runs entirely in your browser.',
}

export default function CsvJsonConverterPage() {
  return (
    <ToolShell>
      <CsvJsonConverter />
    </ToolShell>
  )
}
