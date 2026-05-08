import { z } from 'zod'

export interface Note {
  id: string
  title: string
  body: string
  updatedAt: string
}

const NAMESPACE = 'knack:notes:'
const MANIFEST_KEY = `${NAMESPACE}_manifest`

const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  updatedAt: z.string(),
})

const ExportSchema = z.object({
  version: z.literal(1),
  notes: z.array(NoteSchema),
})

function isClient(): boolean {
  return typeof localStorage !== 'undefined'
}

function getManifest(): string[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(MANIFEST_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function setManifest(ids: string[]): void {
  localStorage.setItem(MANIFEST_KEY, JSON.stringify(ids))
}

export function listNotes(): Note[] {
  if (!isClient()) return []
  return getManifest()
    .map((id) => {
      try {
        const raw = localStorage.getItem(`${NAMESPACE}${id}`)
        if (!raw) return null
        return JSON.parse(raw) as Note
      } catch {
        return null
      }
    })
    .filter((n): n is Note => n !== null)
}

export function getNote(id: string): Note | null {
  if (!isClient()) return null
  try {
    const raw = localStorage.getItem(`${NAMESPACE}${id}`)
    return raw ? (JSON.parse(raw) as Note) : null
  } catch {
    return null
  }
}

export function saveNote(note: Note): void {
  const key = `${NAMESPACE}${note.id}`
  try {
    localStorage.setItem(key, JSON.stringify(note))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Delete some notes to free up space.')
    }
    throw err
  }

  const manifest = getManifest()
  if (!manifest.includes(note.id)) {
    setManifest([note.id, ...manifest])
  }
}

export function deleteNote(id: string): void {
  localStorage.removeItem(`${NAMESPACE}${id}`)
  setManifest(getManifest().filter((existing) => existing !== id))
}

export function estimateUsageBytes(): number {
  if (!isClient()) return 0
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? ''
    if (!key.startsWith(NAMESPACE)) continue
    total += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2
  }
  return total
}

export function exportAll(): string {
  return JSON.stringify({ version: 1, notes: listNotes() })
}

export function importAll(json: string): Note[] {
  const parsed = ExportSchema.parse(JSON.parse(json))
  parsed.notes.forEach((note) => {
    saveNote(note)
  })
  return listNotes()
}
