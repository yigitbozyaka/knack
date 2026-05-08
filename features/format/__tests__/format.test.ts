import { describe, expect, it } from 'vitest'

import { detectFormat } from '../lib/detect'
import * as json from '../lib/json'
import * as xml from '../lib/xml'
import * as yaml from '../lib/yaml'

const VALID_JSON = '{"name":"knack","version":1,"tags":["tool","util"]}'
const INVALID_JSON = '{name: knack}'

const VALID_YAML = 'name: knack\nversion: 1\ntags:\n  - tool\n  - util\n'
const INVALID_YAML = 'key: [\nbad'

const VALID_XML = '<root><item>hello</item></root>'
const INVALID_XML = '<root><item>unclosed</root>'

describe('JSON', () => {
  it('format: pretty-prints valid JSON', () => {
    const r = json.format(VALID_JSON)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.output).toContain('"name"')
  })

  it('format: returns error for invalid JSON', () => {
    const r = json.format(INVALID_JSON)
    expect(r.ok).toBe(false)
  })

  it('minify: removes whitespace', () => {
    const formatted = json.format(VALID_JSON)
    if (!formatted.ok) throw new Error()
    const minified = json.minify(formatted.output)
    expect(minified.ok).toBe(true)
    if (minified.ok) expect(minified.output).not.toContain('\n')
  })

  it('format is idempotent', () => {
    const first = json.format(VALID_JSON)
    if (!first.ok) throw new Error()
    const second = json.format(first.output)
    expect(second).toEqual(first)
  })

  it('validate: ok for valid JSON', () => {
    expect(json.validate(VALID_JSON).ok).toBe(true)
  })

  it('validate: error for invalid JSON', () => {
    expect(json.validate(INVALID_JSON).ok).toBe(false)
  })
})

describe('YAML', () => {
  it('format: round-trips valid YAML', () => {
    const r = yaml.format(VALID_YAML)
    expect(r.ok).toBe(true)
  })

  it('format: returns error with position for invalid YAML', () => {
    const r = yaml.format(INVALID_YAML)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.line).toBeGreaterThan(0)
    }
  })

  it('validate: ok for valid YAML', () => {
    expect(yaml.validate(VALID_YAML).ok).toBe(true)
  })

  it('validate: error for invalid YAML', () => {
    expect(yaml.validate(INVALID_YAML).ok).toBe(false)
  })
})

describe('XML', () => {
  it('format: indents valid XML', () => {
    const r = xml.format(VALID_XML)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.output).toContain('\n')
  })

  it('format: returns error with position for invalid XML', () => {
    const r = xml.format(INVALID_XML)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.line).toBeGreaterThan(0)
  })

  it('validate: ok for valid XML', () => {
    expect(xml.validate(VALID_XML).ok).toBe(true)
  })

  it('validate: error for invalid XML', () => {
    expect(xml.validate(INVALID_XML).ok).toBe(false)
  })
})

describe('detectFormat', () => {
  it('detects JSON from { prefix', () => {
    expect(detectFormat(VALID_JSON)).toBe('json')
  })

  it('detects XML from < prefix', () => {
    expect(detectFormat(VALID_XML)).toBe('xml')
  })

  it('detects YAML from key: value', () => {
    expect(detectFormat(VALID_YAML)).toBe('yaml')
  })
})
