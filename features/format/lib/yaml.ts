import {
  CORE_SCHEMA,
  YAMLException,
  binaryTag,
  dump,
  load,
  loadAll,
  mergeTag,
  omapTag,
  pairsTag,
  setTag,
} from 'js-yaml'

import { type FormatResult } from './types'

const schema = CORE_SCHEMA.withTags(mergeTag, binaryTag, omapTag, pairsTag, setTag)

const EMPTY_DOCUMENT = Symbol('empty-document')

function parse(input: string): unknown {
  const documents = loadAll(input, { schema })
  if (documents.length === 0) return EMPTY_DOCUMENT
  if (documents.length === 1) return documents[0]
  return load(input, { schema })
}

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
    const parsed = parse(input)
    if (parsed === EMPTY_DOCUMENT) return { ok: true, output: '' }
    return { ok: true, output: dump(parsed, { indent: 2, lineWidth: -1 }) }
  } catch (err) {
    return yamlError(err)
  }
}

export function validate(input: string): FormatResult {
  if (input.trim() === '') return { ok: true, output: '✓ Valid YAML' }
  try {
    parse(input)
    return { ok: true, output: '✓ Valid YAML' }
  } catch (err) {
    return yamlError(err)
  }
}
