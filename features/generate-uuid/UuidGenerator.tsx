'use client'

import { useState } from 'react'

import { FingerprintIcon, RefreshCwIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'

import { type UuidVersion, generateUuid } from './lib'

export function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>('v4')
  const [single, setSingle] = useState<string>(() => generateUuid('v4'))
  const [batch, setBatch] = useState<string[]>([])

  const generate = (v: UuidVersion = version) => {
    setSingle(generateUuid(v))
    setBatch([])
  }

  const changeVersion = (v: UuidVersion) => {
    setVersion(v)
    generate(v)
  }

  const generateBatch = () => {
    const ids = Array.from({ length: 10 }, () => generateUuid(version))
    setSingle(ids[0] ?? '')
    setBatch(ids)
  }

  return (
    <>
      <ToolPageHeader
        title="UUID Generator"
        description="Generate RFC-compliant UUID v4 and v7 identifiers in your browser. No server, no logging."
        icon={FingerprintIcon}
      />

      <div className="mb-4 flex gap-2">
        {(['v4', 'v7'] as const).map((v) => (
          <Button
            key={v}
            variant={version === v ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              changeVersion(v)
            }}
          >
            {v.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="bg-muted/30 border-border mb-4 flex items-center gap-3 rounded-lg border px-4 py-3">
        <span data-testid="uuid-output" className="flex-1 font-mono text-sm break-all">
          {single}
        </span>
        <CopyButton value={single} size="icon-sm" label="Copy UUID" />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            generate()
          }}
        >
          <RefreshCwIcon />
          Generate
        </Button>
        <Button variant="outline" onClick={generateBatch}>
          Generate 10
        </Button>
      </div>

      {batch.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">10 UUIDs</span>
            <CopyButton value={batch.join('\n')} label="Copy all" size="sm" />
          </div>
          <ul className="border-border divide-border divide-y rounded-lg border font-mono text-sm">
            {batch.map((id, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-2">
                <span className="break-all">{id}</span>
                <CopyButton value={id} size="icon-xs" label="Copy" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-muted-foreground space-y-2 text-sm">
        <p>
          <strong className="text-foreground">v4</strong> — Fully random. No temporal information.
          Use it when you need opaque, unguessable identifiers with no ordering requirement.
        </p>
        <p>
          <strong className="text-foreground">v7</strong> — Timestamp-prefixed random. Sortable by
          creation time, making it database-index-friendly. Prefer v7 for primary keys.
        </p>
      </div>
    </>
  )
}
