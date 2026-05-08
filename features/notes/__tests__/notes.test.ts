import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteNote, exportAll, getNote, importAll, listNotes, saveNote } from '../lib/storage'

// Manual localStorage mock for Node.js test environment
let store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    const { [key]: _removed, ...rest } = store
    store = rest
  },
  clear: () => {
    store = {}
  },
  get length() {
    return Object.keys(store).length
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
}
vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
  localStorageMock.clear()
})

const NOTE = { id: 'abc', title: 'Test', body: 'Hello', updatedAt: '2024-01-01T00:00:00.000Z' }

describe('saveNote / listNotes / getNote', () => {
  it('saves and retrieves a note', () => {
    saveNote(NOTE)
    expect(getNote('abc')).toEqual(NOTE)
  })

  it('listNotes returns saved notes in insertion order (newest first)', () => {
    saveNote(NOTE)
    saveNote({ ...NOTE, id: 'def', title: 'Second' })
    const ids = listNotes().map((n) => n.id)
    expect(ids[0]).toBe('def')
    expect(ids[1]).toBe('abc')
  })

  it('saves the same note twice without duplicating manifest', () => {
    saveNote(NOTE)
    saveNote({ ...NOTE, title: 'Updated' })
    expect(listNotes()).toHaveLength(1)
    expect(listNotes()[0]?.title).toBe('Updated')
  })
})

describe('deleteNote', () => {
  it('removes the note and its manifest entry', () => {
    saveNote(NOTE)
    deleteNote('abc')
    expect(getNote('abc')).toBeNull()
    expect(listNotes()).toHaveLength(0)
  })
})

describe('export / import', () => {
  it('roundtrips all notes', () => {
    saveNote(NOTE)
    saveNote({ ...NOTE, id: 'def', title: 'Second' })
    const json = exportAll()

    localStorageMock.clear()
    const imported = importAll(json)
    expect(imported).toHaveLength(2)
  })

  it('importAll rejects invalid JSON structure', () => {
    expect(() => importAll('{"version":2,"notes":[]}')).toThrow()
    expect(() => importAll('not-json')).toThrow()
  })
})
