'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import hljs from 'highlight.js'
import {
  Columns2Icon,
  EyeIcon,
  FileTextIcon,
  MaximizeIcon,
  MinimizeIcon,
  PencilIcon,
} from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

const VIEWS = [
  { id: 'editor', label: 'Editor', icon: PencilIcon },
  { id: 'split', label: 'Split', icon: Columns2Icon },
  { id: 'preview', label: 'Preview', icon: EyeIcon },
] as const

type View = (typeof VIEWS)[number]['id']

export function MarkdownViewer() {
  const [markdown, setMarkdown] = useState(SAMPLE)
  const [view, setView] = useState<View>('split')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => renderMarkdown(markdown), [markdown])
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0

  useEffect(() => {
    if (!previewRef.current) return
    previewRef.current.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
      hljs.highlightElement(block)
    })
  }, [html, view])

  useEffect(() => {
    const sync = () => {
      setIsFullscreen(document.fullscreenElement === workspaceRef.current)
    }
    document.addEventListener('fullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
    }
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void workspaceRef.current?.requestFullscreen()
    }
  }

  return (
    <>
      <ToolPageHeader
        title="Markdown Viewer"
        description="Live markdown preview with syntax highlighting. All HTML is sanitized — safe to paste untrusted content."
        icon={FileTextIcon}
      />

      <div
        ref={workspaceRef}
        className="markdown-workspace bg-background flex h-[calc(100dvh-15rem)] min-h-[28rem] flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="border-border bg-muted/30 inline-flex gap-0.5 rounded-lg border p-0.5">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                type="button"
                variant={view === id ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs"
                aria-pressed={view === id}
                onClick={() => {
                  setView(id)
                }}
              >
                <Icon className="size-3.5" />
                {label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
              {words} words · {markdown.length} chars
            </span>
            <CopyButton value={markdown} label="Copy markdown" size="sm" />
            <CopyButton value={html} label="Copy HTML" size="sm" />
            <Button type="button" variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'grid min-h-0 flex-1 gap-3',
            view === 'split' && 'grid-rows-2 lg:grid-cols-2 lg:grid-rows-1',
          )}
        >
          {view !== 'preview' && (
            <textarea
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value)
              }}
              spellCheck={false}
              className="border-border bg-muted/30 focus:ring-ring h-full w-full resize-none rounded-lg border p-4 font-mono text-sm outline-none focus:ring-2"
              aria-label="Markdown input"
            />
          )}

          {view !== 'editor' && (
            <div
              ref={previewRef}
              dangerouslySetInnerHTML={{ __html: html }}
              className={cn(
                'markdown-body border-border bg-muted/30 h-full overflow-auto rounded-lg border p-6',
                view === 'preview' && 'mx-auto w-full max-w-5xl',
              )}
              role="region"
              aria-label="Markdown preview"
              tabIndex={0}
            />
          )}
        </div>
      </div>
    </>
  )
}
