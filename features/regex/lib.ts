export const MAX_MATCHES = 1000
export const MAX_INPUT_LENGTH = 100_000
export const VALID_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const

export type RegexFlag = (typeof VALID_FLAGS)[number]

export interface RegexGroup {
  index: number
  name: string | null
  value: string | null
}

export interface RegexMatch {
  index: number
  end: number
  value: string
  groups: RegexGroup[]
}

export interface RegexSegment {
  text: string
  matchIndex: number | null
}

export type RegexResult =
  | { ok: true; matches: RegexMatch[]; truncated: boolean; segments: RegexSegment[] }
  | { ok: false; error: string }

export function sanitizeFlags(flags: string): string {
  return VALID_FLAGS.filter((flag) => flags.includes(flag)).join('')
}

export function toggleFlag(flags: string, flag: RegexFlag): string {
  return flags.includes(flag) ? flags.replace(flag, '') : sanitizeFlags(flags + flag)
}

export function captureGroupNames(pattern: string): (string | null)[] {
  const names: (string | null)[] = []
  let inClass = false
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    if (char === '\\') {
      i += 1
    } else if (inClass) {
      if (char === ']') inClass = false
    } else if (char === '[') {
      inClass = true
    } else if (char === '(') {
      if (pattern[i + 1] !== '?') {
        names.push(null)
      } else {
        const named = /^\(\?<([^>=!][^>]*)>/.exec(pattern.slice(i))
        if (named) names.push(named[1] ?? null)
      }
    }
  }
  return names
}

function nextIndexAfterEmptyMatch(text: string, index: number, unicode: boolean): number {
  if (!unicode) return index + 1
  const code = text.codePointAt(index)
  return index + (code !== undefined && code > 0xffff ? 2 : 1)
}

export function buildSegments(text: string, matches: RegexMatch[]): RegexSegment[] {
  const segments: RegexSegment[] = []
  let cursor = 0
  matches.forEach((match, matchIndex) => {
    if (match.end === match.index) return
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), matchIndex: null })
    }
    segments.push({ text: match.value, matchIndex })
    cursor = match.end
  })
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matchIndex: null })
  }
  return segments
}

export function runRegex(pattern: string, flags: string, text: string): RegexResult {
  if (pattern === '') {
    return { ok: true, matches: [], truncated: false, segments: [{ text, matchIndex: null }] }
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: `Test string is longer than ${String(MAX_INPUT_LENGTH)} characters.`,
    }
  }

  const effectiveFlags = sanitizeFlags(flags)
  const global = effectiveFlags.includes('g')
  let regex: RegExp
  try {
    regex = new RegExp(pattern, effectiveFlags)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid pattern.' }
  }

  const groupNames = captureGroupNames(pattern)
  const matches: RegexMatch[] = []
  let truncated = false

  let result = regex.exec(text)
  while (result !== null) {
    if (matches.length >= MAX_MATCHES) {
      truncated = true
      break
    }
    matches.push({
      index: result.index,
      end: result.index + result[0].length,
      value: result[0],
      groups: result.slice(1).map((value, i) => ({
        index: i + 1,
        name: groupNames[i] ?? null,
        value: (value as string | undefined) ?? null,
      })),
    })
    if (!global) break
    if (result[0] === '') {
      regex.lastIndex = nextIndexAfterEmptyMatch(text, regex.lastIndex, regex.unicode)
      if (regex.lastIndex > text.length) break
    }
    result = regex.exec(text)
  }

  return { ok: true, matches, truncated, segments: buildSegments(text, matches) }
}
