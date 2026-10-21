import { diffLines, diffWords } from 'diff'

export const MAX_INPUT_LENGTH = 200_000
export const DIFF_TIMEOUT_MS = 500

export type DiffMode = 'line' | 'word'
export type SegmentKind = 'equal' | 'add' | 'remove'
export type RowKind = 'context' | 'add' | 'remove'

export interface Segment {
  text: string
  kind: SegmentKind
}

export interface UnifiedRow {
  kind: RowKind
  oldLine: number | null
  newLine: number | null
  segments: Segment[]
}

export interface SplitCell {
  kind: RowKind
  lineNumber: number
  segments: Segment[]
}

export interface SplitRow {
  left: SplitCell | null
  right: SplitCell | null
}

export interface DiffStats {
  added: number
  removed: number
  unchanged: number
}

export type DiffResult =
  | {
      ok: true
      mode: DiffMode
      unified: UnifiedRow[]
      split: SplitRow[]
      stats: DiffStats
      notes: string[]
    }
  | { ok: false; error: string }

interface Block {
  kind: SegmentKind
  lines: string[]
}

function splitLines(value: string): string[] {
  const lines = value.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

interface Budget {
  remaining(): number
}

function createBudget(): Budget {
  const deadline = Date.now() + DIFF_TIMEOUT_MS
  return { remaining: () => deadline - Date.now() }
}

function toBlocks(oldText: string, newText: string, budget: Budget): Block[] | undefined {
  const changes = diffLines(oldText, newText, { timeout: Math.max(1, budget.remaining()) })
  if (changes === undefined) return undefined
  return changes.map((change) => ({
    kind: change.added ? 'add' : change.removed ? 'remove' : 'equal',
    lines: splitLines(change.value),
  }))
}

function inlineSegments(
  oldLine: string,
  newLine: string,
  budget: Budget,
): [Segment[], Segment[]] | undefined {
  if (budget.remaining() <= 0) return undefined
  const changes = diffWords(oldLine, newLine, { timeout: budget.remaining() })
  if (changes === undefined) return undefined
  const left: Segment[] = []
  const right: Segment[] = []
  for (const change of changes) {
    if (change.added) right.push({ text: change.value, kind: 'add' })
    else if (change.removed) left.push({ text: change.value, kind: 'remove' })
    else {
      left.push({ text: change.value, kind: 'equal' })
      right.push({ text: change.value, kind: 'equal' })
    }
  }
  return [left, right]
}

function plain(text: string, kind: SegmentKind): Segment[] {
  return [{ text, kind }]
}

function withTrailingNewline(text: string): string {
  return text === '' || text.endsWith('\n') ? text : `${text}\n`
}

function diffByLine(oldText: string, newText: string, budget: Budget): DiffResult {
  const blocks = toBlocks(withTrailingNewline(oldText), withTrailingNewline(newText), budget)
  if (blocks === undefined) return { ok: false, error: 'The inputs are too different to diff.' }

  const unified: UnifiedRow[] = []
  const split: SplitRow[] = []
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 }
  let oldNo = 1
  let newNo = 1

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (!block) continue

    if (block.kind === 'equal') {
      for (const line of block.lines) {
        unified.push({
          kind: 'context',
          oldLine: oldNo,
          newLine: newNo,
          segments: plain(line, 'equal'),
        })
        split.push({
          left: { kind: 'context', lineNumber: oldNo, segments: plain(line, 'equal') },
          right: { kind: 'context', lineNumber: newNo, segments: plain(line, 'equal') },
        })
        oldNo += 1
        newNo += 1
        stats.unchanged += 1
      }
      continue
    }

    const next = blocks[i + 1]
    const removedLines = block.kind === 'remove' ? block.lines : []
    const addedLines = block.kind === 'add' ? block.lines : next?.kind === 'add' ? next.lines : []
    if (block.kind === 'remove' && next?.kind === 'add') i += 1

    const paired = Math.min(removedLines.length, addedLines.length)
    const leftSegments: Segment[][] = removedLines.map((line) => plain(line, 'remove'))
    const rightSegments: Segment[][] = addedLines.map((line) => plain(line, 'add'))
    for (let p = 0; p < paired; p++) {
      const inline = inlineSegments(removedLines[p] ?? '', addedLines[p] ?? '', budget)
      if (inline) {
        leftSegments[p] = inline[0]
        rightSegments[p] = inline[1]
      }
    }

    removedLines.forEach((_, index) => {
      unified.push({
        kind: 'remove',
        oldLine: oldNo + index,
        newLine: null,
        segments: leftSegments[index] ?? [],
      })
    })
    addedLines.forEach((_, index) => {
      unified.push({
        kind: 'add',
        oldLine: null,
        newLine: newNo + index,
        segments: rightSegments[index] ?? [],
      })
    })

    const rowCount = Math.max(removedLines.length, addedLines.length)
    for (let r = 0; r < rowCount; r++) {
      split.push({
        left:
          r < removedLines.length
            ? { kind: 'remove', lineNumber: oldNo + r, segments: leftSegments[r] ?? [] }
            : null,
        right:
          r < addedLines.length
            ? { kind: 'add', lineNumber: newNo + r, segments: rightSegments[r] ?? [] }
            : null,
      })
    }

    oldNo += removedLines.length
    newNo += addedLines.length
    stats.removed += removedLines.length
    stats.added += addedLines.length
  }

  return { ok: true, mode: 'line', unified, split, stats, notes: [] }
}

function diffByWord(oldText: string, newText: string, budget: Budget): DiffResult {
  const changes = diffWords(oldText, newText, { timeout: Math.max(1, budget.remaining()) })
  if (changes === undefined) return { ok: false, error: 'The inputs are too different to diff.' }

  const merged: Segment[] = []
  const left: Segment[] = []
  const right: Segment[] = []
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 }

  for (const change of changes) {
    const words = change.value.split(/\s+/).filter(Boolean).length
    if (change.added) {
      merged.push({ text: change.value, kind: 'add' })
      right.push({ text: change.value, kind: 'add' })
      stats.added += words
    } else if (change.removed) {
      merged.push({ text: change.value, kind: 'remove' })
      left.push({ text: change.value, kind: 'remove' })
      stats.removed += words
    } else {
      merged.push({ text: change.value, kind: 'equal' })
      left.push({ text: change.value, kind: 'equal' })
      right.push({ text: change.value, kind: 'equal' })
      stats.unchanged += words
    }
  }

  return {
    ok: true,
    mode: 'word',
    unified: [{ kind: 'context', oldLine: null, newLine: null, segments: merged }],
    split: [
      {
        left: { kind: 'context', lineNumber: 1, segments: left },
        right: { kind: 'context', lineNumber: 1, segments: right },
      },
    ],
    stats,
    notes: [],
  }
}

type LineEndingStyle = 'none' | 'lf' | 'crlf' | 'mixed'

function lineEndingStyle(text: string): LineEndingStyle {
  const crlf = text.includes('\r\n')
  const lf = /(^|[^\r])\n/.test(text)
  if (crlf && lf) return 'mixed'
  if (crlf) return 'crlf'
  return lf ? 'lf' : 'none'
}

function describeNotes(oldText: string, newText: string, mode: DiffMode): string[] {
  const notes: string[] = []
  const oldStyle = lineEndingStyle(oldText)
  const newStyle = lineEndingStyle(newText)
  if (oldStyle !== 'none' && newStyle !== 'none' && oldStyle !== newStyle) {
    notes.push(
      `Line endings differ (original: ${oldStyle.toUpperCase()}, modified: ${newStyle.toUpperCase()}); they are treated as equal.`,
    )
  }
  if (mode === 'line' && oldText !== '' && newText !== '') {
    const oldEnds = oldText.endsWith('\n')
    const newEnds = newText.endsWith('\n')
    if (oldEnds !== newEnds) {
      notes.push(
        `\\ No newline at end of file (${oldEnds ? 'modified' : 'original'}); a missing final newline is not counted as a change.`,
      )
    }
  }
  return notes
}

export function computeDiff(oldText: string, newText: string, mode: DiffMode): DiffResult {
  if (oldText.length > MAX_INPUT_LENGTH || newText.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: `Each side must be at most ${String(MAX_INPUT_LENGTH)} characters.`,
    }
  }
  const normalizedOld = oldText.replace(/\r\n/g, '\n')
  const normalizedNew = newText.replace(/\r\n/g, '\n')
  const budget = createBudget()
  const result =
    mode === 'line'
      ? diffByLine(normalizedOld, normalizedNew, budget)
      : diffByWord(normalizedOld, normalizedNew, budget)
  return result.ok ? { ...result, notes: describeNotes(oldText, newText, mode) } : result
}
