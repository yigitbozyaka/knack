'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import hljs from 'highlight.js'
import { FileTextIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'

import { renderMarkdown } from './lib/render'

const SAMPLE = `# Welcome to the Markdown Viewer

Paste markdown on the left and see a live preview on the right.

## Features

- **Bold**, *italic*, and \`inline code\`
- Fenced code blocks with syntax highlighting
- Tables, blockquotes, and task lists
- Safe: all HTML is sanitized before rendering

## Code example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

> **Tip:** Outbound links open in a new tab with \`rel="noopener noreferrer nofollow"\` applied automatically.
`

export function MarkdownViewer() {
  const [markdown, setMarkdown] = useState(SAMPLE)
  const previewRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => renderMarkdown(markdown), [markdown])

  useEffect(() => {
    if (!previewRef.current) return
    previewRef.current.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
      hljs.highlightElement(block)
    })
  }, [html])

  return (
    <>
      <ToolPageHeader
        title="Markdown Viewer"
        description="Live markdown preview with syntax highlighting. All HTML is sanitized — safe to paste untrusted content."
        icon={FileTextIcon}
      />

      <div className="mb-2 flex justify-end gap-2">
        <CopyButton value={markdown} label="Copy markdown" size="sm" />
        <CopyButton value={html} label="Copy HTML" size="sm" />
      </div>

      {/* Two-pane layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Markdown
          </label>
          <textarea
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value)
            }}
            spellCheck={false}
            className="border-border bg-muted/30 focus:ring-ring h-[32rem] w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2"
            aria-label="Markdown input"
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Preview
          </label>
          <div
            ref={previewRef}
            // renderMarkdown passes through DOMPurify — safe to set innerHTML
            dangerouslySetInnerHTML={{ __html: html }}
            className="markdown-body border-border bg-muted/30 h-[32rem] overflow-auto rounded-lg border p-4"
          />
        </div>
      </div>
    </>
  )
}
