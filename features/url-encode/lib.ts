export type TextCodecResult = { ok: true; output: string } | { ok: false; error: string }

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  sect: '§',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  laquo: '«',
  raquo: '»',
  bull: '•',
  middot: '·',
}

const MAX_CODE_POINT = 0x10ffff

export function encodeUrl(text: string): string {
  return encodeURIComponent(text)
}

export function decodeUrl(input: string): TextCodecResult {
  try {
    return { ok: true, output: decodeURIComponent(input) }
  } catch {
    return { ok: false, error: 'Input contains a malformed percent-encoded sequence.' }
  }
}

export function encodeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char)
}

export function decodeHtml(input: string): string {
  return input.replace(
    /&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g,
    (match, body: string) => {
      if (body.startsWith('#')) {
        const isHex = body[1] === 'x' || body[1] === 'X'
        const codePoint = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10)
        return isValidCodePoint(codePoint) ? String.fromCodePoint(codePoint) : match
      }
      return NAMED_ENTITIES[body] ?? match
    },
  )
}

function isValidCodePoint(codePoint: number): boolean {
  const isSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff
  return codePoint > 0 && codePoint <= MAX_CODE_POINT && !isSurrogate
}
