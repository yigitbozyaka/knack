import { validate as validateJson } from './json'
import { type FormatType } from './types'
import { validate as validateXml } from './xml'
import { validate as validateYaml } from './yaml'

export function detectFormat(input: string): Exclude<FormatType, 'auto'> {
  const trimmed = input.trimStart()
  if (!trimmed) return 'json'

  // Structural heuristics first — fast path
  if (trimmed.startsWith('<')) return 'xml'
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'

  // Try validators as tie-breaker for ambiguous input
  if (validateJson(trimmed).ok) return 'json'
  if (validateXml(trimmed).ok) return 'xml'
  if (validateYaml(trimmed).ok) return 'yaml'

  return 'yaml'
}
