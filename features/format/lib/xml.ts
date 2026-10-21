import { SyntaxValidator } from 'fast-xml-validator'
import xmlFormatter from 'xml-formatter'

import { type FormatResult } from './types'

interface XmlSyntaxError {
  message: string
  line?: number
  col?: number
}

function findSyntaxError(input: string): XmlSyntaxError | null {
  try {
    SyntaxValidator.validate(input)
    return null
  } catch (err) {
    if (err instanceof Error) {
      const { line, col } = err as Error & { line?: number; col?: number }
      return { message: err.message, line, col }
    }
    return { message: 'Invalid XML' }
  }
}

export function format(input: string): FormatResult {
  const syntaxError = findSyntaxError(input)
  if (syntaxError) return { ok: false, error: syntaxError }
  try {
    return { ok: true, output: xmlFormatter(input, { indentation: '  ', collapseContent: true }) }
  } catch (err) {
    return { ok: false, error: { message: err instanceof Error ? err.message : 'Format failed' } }
  }
}

export function validate(input: string): FormatResult {
  const syntaxError = findSyntaxError(input)
  if (syntaxError) return { ok: false, error: syntaxError }
  return { ok: true, output: '✓ Valid XML' }
}
