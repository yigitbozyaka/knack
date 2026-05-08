'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

import { type Note, deleteNote, exportAll, importAll, listNotes, saveNote } from './storage'

export type { Note }

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => listNotes())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Note | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setNotes(listNotes())
  }, [])

  const activeNote = useMemo<Note | null>(() => {
    if (!activeId) return null
    if (draft?.id === activeId) return draft
    return notes.find((n) => n.id === activeId) ?? null
  }, [notes, activeId, draft])

  const createNote = useCallback(() => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      updatedAt: new Date().toISOString(),
    }
    try {
      saveNote(note)
      setStorageError(null)
    } catch (err) {
      setStorageError(err instanceof Error ? err.message : 'Save failed.')
      return
    }
    refresh()
    setActiveId(note.id)
  }, [refresh])

  const updateNote = useCallback(
    (changes: Partial<Pick<Note, 'title' | 'body'>>) => {
      if (!activeId) return
      const base = notes.find((n) => n.id === activeId)
      if (!base) return
      const updated: Note = { ...base, ...changes, updatedAt: new Date().toISOString() }
      setDraft(updated)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        try {
          saveNote(updated)
          setStorageError(null)
        } catch (err) {
          setStorageError(err instanceof Error ? err.message : 'Auto-save failed.')
        }
        refresh()
        setDraft(null)
      }, 500)
    },
    [activeId, notes, refresh],
  )

  const removeNote = useCallback(
    (id: string) => {
      deleteNote(id)
      refresh()
      if (activeId === id) setActiveId(null)
    },
    [activeId, refresh],
  )

  const doExport = useCallback(() => {
    const blob = new Blob([exportAll()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knack-notes.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const doImport = useCallback(
    (json: string) => {
      try {
        importAll(json)
        refresh()
        setStorageError(null)
      } catch {
        setStorageError('Import failed. Make sure the file is a valid Knack notes export.')
      }
    },
    [refresh],
  )

  return {
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
  }
}
