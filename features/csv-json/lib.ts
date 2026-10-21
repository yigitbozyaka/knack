export const DELIMITERS = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
  pipe: '|',
} as const

export type DelimiterName = keyof typeof DELIMITERS

export interface ConvertOptions {
  delimiter: string
  header: boolean
}

export interface ConvertError {
  message: string
  line?: number
  col?: number
}

export type ConvertResult = { ok: true; output: string } | { ok: false; error: ConvertError }

type ParseRowsResult =
  | { ok: true; rows: string[][]; lines: number[] }
  | { ok: false; error: ConvertError }

type Cell = string | number | boolean | null | undefined | object

function fail(message: string, line?: number, col?: number): { ok: false; error: ConvertError } {
  const error: ConvertError = { message }
  if (line !== undefined) error.line = line
  if (col !== undefined) error.col = col
  return { ok: false, error }
}

export function parseCsvRows(input: string, delimiter: string): ParseRowsResult {
  if (delimiter.length !== 1 || delimiter === '"' || delimiter === '\n' || delimiter === '\r') {
    return fail('Delimiter must be a single character other than a quote or line break.')
  }

  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const rows: string[][] = []
  const lines: number[] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let fieldWasQuoted = false
  let rowHasQuotedField = false
  let rowStartLine = 1
  let line = 1
  let col = 0
  let quoteLine = 1
  let quoteCol = 1

  const endField = () => {
    row.push(field)
    field = ''
    fieldWasQuoted = false
  }

  const endRow = () => {
    endField()
    const isBlankLine = row.length === 1 && row[0] === '' && !rowHasQuotedField
    if (!isBlankLine) {
      rows.push(row)
      lines.push(rowStartLine)
    }
    row = []
    rowHasQuotedField = false
  }

  for (let index = 0; index < text.length; index++) {
    const char = text.charAt(index)
    col++

    if (inQuotes) {
      if (char === '"') {
        if (text.charAt(index + 1) === '"') {
          field += '"'
          index++
          col++
        } else {
          inQuotes = false
        }
      } else {
        field += char
        if (char === '\n') {
          line++
          col = 0
        }
      }
      continue
    }

    if (char === '"') {
      if (field.length > 0 || fieldWasQuoted) {
        return fail('Unexpected quote inside an unquoted field.', line, col)
      }
      inQuotes = true
      fieldWasQuoted = true
      rowHasQuotedField = true
      quoteLine = line
      quoteCol = col
    } else if (char === delimiter) {
      endField()
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text.charAt(index + 1) === '\n') index++
      endRow()
      line++
      rowStartLine = line
      col = 0
    } else if (fieldWasQuoted) {
      return fail('Unexpected character after a closing quote.', line, col)
    } else {
      field += char
    }
  }

  if (inQuotes) return fail('Unterminated quoted field.', quoteLine, quoteCol)

  if (field.length > 0 || fieldWasQuoted || row.length > 0) endRow()

  return { ok: true, rows, lines }
}

export function csvToJson(input: string, options: ConvertOptions): ConvertResult {
  const blankCharacters = options.delimiter === '\t' ? /[\r\n ]/g : /[\r\n\t ]/g
  if (input.replace(/^\uFEFF/, '').replace(blankCharacters, '') === '') {
    return fail('Paste some CSV to convert.')
  }

  const parsed = parseCsvRows(input, options.delimiter)
  if (!parsed.ok) return parsed
  const { rows, lines } = parsed

  if (!options.header) {
    return { ok: true, output: JSON.stringify(rows, null, 2) }
  }

  const [headers = [], ...body] = rows
  const seen = new Set<string>()
  for (const name of headers) {
    if (seen.has(name)) return fail(`Duplicate header "${name}".`, lines[0] ?? 1)
    seen.add(name)
  }

  const objects: Record<string, string>[] = []
  for (const [index, values] of body.entries()) {
    if (values.length !== headers.length) {
      return fail(
        `Row has ${String(values.length)} fields but the header has ${String(headers.length)}.`,
        lines[index + 1],
      )
    }
    const record: Record<string, string> = Object.create(null) as Record<string, string>
    for (const [column, name] of headers.entries()) {
      record[name] = values[column] ?? ''
    }
    objects.push(record)
  }

  return { ok: true, output: JSON.stringify(objects, null, 2) }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cellToText(value: Cell): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function escapeCell(text: string, delimiter: string): string {
  const needsQuotes =
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r') ||
    text.startsWith('\uFEFF') ||
    text.startsWith(' ') ||
    text.endsWith(' ')
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text
}

export function jsonToCsv(input: string, options: ConvertOptions): ConvertResult {
  if (input.trim() === '') return fail('Paste some JSON to convert.')
  if (options.delimiter.length !== 1 || /["\r\n]/.test(options.delimiter)) {
    return fail('Delimiter must be a single character other than a quote or line break.')
  }

  let data: unknown
  try {
    data = JSON.parse(input)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Invalid JSON.')
  }

  if (!Array.isArray(data)) return fail('JSON must be an array of objects or an array of arrays.')
  if (data.length === 0) return { ok: true, output: '' }

  const lines: string[] = []
  const writeRow = (cells: Cell[]) => {
    const line = cells
      .map((cell) => escapeCell(cellToText(cell), options.delimiter))
      .join(options.delimiter)
    lines.push(cells.length === 1 && line === '' ? '""' : line)
  }

  if (data.every(isPlainObject)) {
    const columns: string[] = []
    const known = new Set<string>()
    for (const item of data) {
      for (const key of Object.keys(item)) {
        if (!known.has(key)) {
          known.add(key)
          columns.push(key)
        }
      }
    }
    if (options.header) writeRow(columns)
    for (const item of data) {
      writeRow(columns.map((column) => item[column] as Cell))
    }
    return { ok: true, output: lines.join('\n') }
  }

  if (data.every((item): item is unknown[] => Array.isArray(item))) {
    for (const item of data) writeRow(item as Cell[])
    return { ok: true, output: lines.join('\n') }
  }

  return fail('Every item must be an object, or every item must be an array.')
}
