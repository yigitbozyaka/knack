import { XMLValidator } from 'fast-xml-parser'
import xmlFormatter from 'xml-formatter'

import { type FormatResult } from './types'

export function format(input: string): FormatResult {
  // Validate first so formatting errors surface as structured errors
  const validation = XMLValidator.validate(input)
  if (validation !== true) {
    return {
      ok: false,
      error: {
        message: validation.err.msg,
        line: validation.err.line,
        col: validation.err.col,
      },
    }
  }
  try {
    return { ok: true, output: xmlFormatter(input, { indentation: '  ', collapseContent: true }) }
  } catch (err) {
    return { ok: false, error: { message: err instanceof Error ? err.message : 'Format failed' } }
  }
}

export function validate(input: string): FormatResult {
  const result = XMLValidator.validate(input)
  if (result === true) return { ok: true, output: '✓ Valid XML' }
  return {
    ok: false,
    error: {
      message: result.err.msg,
      line: result.err.line,
      col: result.err.col,
    },
  }
}
