import { type YAMLException, dump, load } from 'js-yaml'

import { type FormatResult } from './types'

function yamlError(err: unknown): FormatResult {
  // js-yaml throws YAMLException with .reason and .mark (line/column)
  const e = err as YAMLException
  if (typeof e.reason === 'string') {
    return {
      ok: false,
      error: {
        message: e.reason,
        line: e.mark.line + 1,
        col: e.mark.column + 1,
      },
    }
  }
  return { ok: false, error: { message: err instanceof Error ? err.message : 'Invalid YAML' } }
}

export function format(input: string): FormatResult {
  try {
    const parsed = load(input)
    return { ok: true, output: dump(parsed, { indent: 2, lineWidth: -1 }) }
  } catch (err) {
    return yamlError(err)
  }
}

export function validate(input: string): FormatResult {
  try {
    load(input)
    return { ok: true, output: '✓ Valid YAML' }
  } catch (err) {
    return yamlError(err)
  }
}
