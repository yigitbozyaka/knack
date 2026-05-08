export type FormatType = 'auto' | 'json' | 'yaml' | 'xml'

export interface FormatError {
  message: string
  line?: number
  col?: number
}

export type FormatResult = { ok: true; output: string } | { ok: false; error: FormatError }
