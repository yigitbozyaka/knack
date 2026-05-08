'use client'

import { useRef } from 'react'

import { NotebookPenIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { estimateUsageBytes } from './lib/storage'
import { useNotes } from './lib/use-notes'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${String(Math.floor(diff / 60_000))}m ago`
  if (diff < 86_400_000) return `${String(Math.floor(diff / 3_600_000))}h ago`
  return `${String(Math.floor(diff / 86_400_000))}d ago`
}

export function NotesApp() {
  const {
    notes,
    activeNote,
    activeId,
    setActiveId,
    createNote,
    updateNote,
    removeNote,
    doExport,
    doImport,
    storageError,
  } = useNotes()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usedBytes = estimateUsageBytes()

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      doImport(ev.target?.result as string)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <ToolPageHeader
        title="Scratchpad"
        description="Browser-local notes. No account, no server — stored only in this browser."
        icon={NotebookPenIcon}
      />

      {storageError && (
        <p
          className="text-destructive bg-destructive/10 mb-4 rounded-lg px-3 py-2 text-sm"
          role="alert"
        >
          {storageError}
        </p>
      )}

      <div className="grid h-[36rem] grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Note list */}
        <aside className="border-border flex flex-col overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-muted-foreground text-xs">{String(notes.length)} notes</span>
            <Button size="icon-xs" variant="ghost" onClick={createNote} aria-label="New note">
              <PlusIcon />
            </Button>
          </div>

          <ul className="divide-border flex-1 divide-y overflow-y-auto">
            {notes.length === 0 && (
              <li className="text-muted-foreground p-4 text-center text-sm">
                No notes yet.
                <br />
                <button
                  className="mt-1 underline underline-offset-2"
                  onClick={createNote}
                  type="button"
                >
                  Create one
                </button>
              </li>
            )}
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  className={`hover:bg-muted/50 w-full px-3 py-2.5 text-left transition-colors ${activeId === note.id ? 'bg-muted' : ''}`}
                  onClick={() => {
                    setActiveId(note.id)
                  }}
                >
                  <p className="text-foreground truncate text-sm font-medium">
                    {note.title || 'Untitled'}
                  </p>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                    <span className="truncate">{note.body.slice(0, 40) || 'No content'}</span>
                    <span className="ml-auto shrink-0">{relativeTime(note.updatedAt)}</span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <div className="flex flex-col gap-3">
          {activeNote ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => {
                    updateNote({ title: e.target.value })
                  }}
                  placeholder="Title"
                  className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent text-lg font-semibold outline-none"
                  aria-label="Note title"
                />
                <div className="flex items-center gap-1">
                  <CopyButton value={activeNote.body} size="icon-xs" label="Copy note" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon-xs" variant="ghost" aria-label="Delete note">
                        <Trash2Icon className="text-destructive" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete note?</DialogTitle>
                        <DialogDescription>
                          &ldquo;{activeNote.title || 'Untitled'}&rdquo; will be permanently
                          deleted.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            removeNote(activeNote.id)
                          }}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <textarea
                value={activeNote.body}
                onChange={(e) => {
                  updateNote({ body: e.target.value })
                }}
                placeholder="Start writing…"
                className="border-border bg-muted/20 focus:ring-ring flex-1 resize-none rounded-lg border p-3 text-sm outline-none focus:ring-2"
                aria-label="Note body"
              />
            </>
          ) : (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-sm">
              <p>Select a note or create a new one</p>
              <Button size="sm" onClick={createNote}>
                <PlusIcon />
                New note
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {String(notes.length)} notes · {formatBytes(usedBytes)} / 5 MB used
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={doExport} disabled={notes.length === 0}>
            Export all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fileInputRef.current?.click()
            }}
          >
            <UploadIcon />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleImport}
            aria-label="Import notes file"
          />
        </div>
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        Notes are stored only in your browser. Clearing site data will delete them.
      </p>
    </>
  )
}
