import { CORE_SCHEMA, YAMLException, dump, load, mergeTag } from 'js-yaml'

import { type FormatResult } from './types'

const schema = CORE_SCHEMA.withTags(mergeTag)

function yamlError(err: unknown): FormatResult {
  if (err instanceof YAMLException) {
    return {
      ok: false,
      error: {
        message: err.reason,
        ...(err.mark && { line: err.mark.line + 1, col: err.mark.column + 1 }),
      },
    }
  }
  return { ok: false, error: { message: err instanceof Error ? err.message : 'Invalid YAML' } }
}

export function format(input: string): FormatResult {
  if (input.trim() === '') return { ok: true, output: '' }
  try {
    const parsed = load(input, { schema })
    return { ok: true, output: dump(parsed, { indent: 2, lineWidth: -1 }) }
  } catch (err) {
    return yamlError(err)
  }
}

export function validate(input: string): FormatResult {
  if (input.trim() === '') return { ok: true, output: '✓ Valid YAML' }
  try {
    load(input, { schema })
    return { ok: true, output: '✓ Valid YAML' }
  } catch (err) {
    return yamlError(err)
  }
}
