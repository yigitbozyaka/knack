import { type FormatResult } from './types'

export function format(input: string): FormatResult {
  try {
    return { ok: true, output: JSON.stringify(JSON.parse(input) as unknown, null, 2) }
  } catch (err) {
    return { ok: false, error: { message: err instanceof Error ? err.message : 'Invalid JSON' } }
  }
}

export function minify(input: string): FormatResult {
  try {
    return { ok: true, output: JSON.stringify(JSON.parse(input) as unknown) }
  } catch (err) {
    return { ok: false, error: { message: err instanceof Error ? err.message : 'Invalid JSON' } }
  }
}

export function validate(input: string): FormatResult {
  try {
    JSON.parse(input)
    return { ok: true, output: '✓ Valid JSON' }
  } catch (err) {
    return { ok: false, error: { message: err instanceof Error ? err.message : 'Invalid JSON' } }
  }
}
