import { describe, expect, it } from 'vitest'

import { csvToJson, jsonToCsv, parseCsvRows } from '../lib'

const COMMA = { delimiter: ',', header: true }

function okOutput(result: ReturnType<typeof csvToJson>): string {
  if (!result.ok) throw new Error(result.error.message)
  return result.output
}

describe('parseCsvRows', () => {
  it('parses quoted fields with delimiters, escaped quotes and newlines', () => {
    const parsed = parseCsvRows('a,"b,1","say ""hi""","line1\nline2"', ',')
    expect(parsed).toEqual({
      ok: true,
      rows: [['a', 'b,1', 'say "hi"', 'line1\nline2']],
      lines: [1],
    })
  })

  it('handles CRLF, CR and a trailing newline', () => {
    expect(parseCsvRows('a,b\r\n1,2\r\n', ',')).toEqual({
      ok: true,
      rows: [
        ['a', 'b'],
        ['1', '2'],
      ],
      lines: [1, 2],
    })
    expect(parseCsvRows('a\rb', ',')).toEqual({ ok: true, rows: [['a'], ['b']], lines: [1, 2] })
  })

  it('keeps empty fields and strips a BOM', () => {
    expect(parseCsvRows('\uFEFFa,,c', ',')).toEqual({
      ok: true,
      rows: [['a', '', 'c']],
      lines: [1],
    })
  })

  it('honours other delimiters', () => {
    expect(parseCsvRows('a;b\t1|2', ';')).toEqual({
      ok: true,
      rows: [['a', 'b\t1|2']],
      lines: [1],
    })
  })

  it('reports an unterminated quote with its position', () => {
    const parsed = parseCsvRows('a,b\n1,"oops', ',')
    expect(parsed).toEqual({
      ok: false,
      error: { message: 'Unterminated quoted field.', line: 2, col: 3 },
    })
  })

  it('reports a stray quote in an unquoted field', () => {
    const parsed = parseCsvRows('a,b"c', ',')
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toMatchObject({ line: 1, col: 4 })
  })

  it('reports text after a closing quote', () => {
    expect(parseCsvRows('"a"b', ',').ok).toBe(false)
  })

  it('keeps quoted empty records and skips unquoted blank lines', () => {
    expect(parseCsvRows('v\n""\nx', ',')).toEqual({
      ok: true,
      rows: [['v'], [''], ['x']],
      lines: [1, 2, 3],
    })
    expect(parseCsvRows('v\n\nx\n', ',')).toEqual({
      ok: true,
      rows: [['v'], ['x']],
      lines: [1, 3],
    })
  })

  it('rejects unusable delimiters', () => {
    expect(parseCsvRows('a', '"').ok).toBe(false)
    expect(parseCsvRows('a', ',,').ok).toBe(false)
  })
})

describe('csvToJson', () => {
  it('reports the physical line of a bad row after a multi-line quoted field', () => {
    const result = csvToJson('a,b\n"x\ny",2\n3', COMMA)
    expect(result).toMatchObject({ ok: false, error: { line: 4 } })
  })

  it('reports the physical line of a bad row after a skipped blank line', () => {
    const result = csvToJson('a,b\n\n1,2\n3', COMMA)
    expect(result).toMatchObject({ ok: false, error: { line: 4 } })
  })

  it('keeps a __proto__ column as an own property', () => {
    const output = okOutput(csvToJson('__proto__,b\n1,2', COMMA))
    expect(output).toContain('"__proto__": "1"')
    const parsed = JSON.parse(output) as Record<string, string>[]
    expect(Object.keys(parsed[0] ?? {})).toEqual(['__proto__', 'b'])
  })

  it('converts rows to objects using the header', () => {
    const output = okOutput(csvToJson('name,age\nAda,36\nLinus,54', COMMA))
    expect(JSON.parse(output)).toEqual([
      { name: 'Ada', age: '36' },
      { name: 'Linus', age: '54' },
    ])
  })

  it('returns arrays of arrays when the header toggle is off', () => {
    const output = okOutput(csvToJson('a,b\n1,2', { delimiter: ',', header: false }))
    expect(JSON.parse(output)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('preserves quoted values', () => {
    const output = okOutput(csvToJson('q\n"a, ""b"""', COMMA))
    expect(JSON.parse(output)).toEqual([{ q: 'a, "b"' }])
  })

  it('reports ragged rows with the line number', () => {
    const result = csvToJson('a,b\n1,2\n3', COMMA)
    expect(result).toEqual({
      ok: false,
      error: { message: 'Row has 1 fields but the header has 2.', line: 3 },
    })
  })

  it('reports duplicate headers', () => {
    const result = csvToJson('a,a\n1,2', COMMA)
    expect(result.ok).toBe(false)
  })

  it('rejects empty input', () => {
    expect(csvToJson('   ', COMMA).ok).toBe(false)
  })
})

describe('jsonToCsv', () => {
  it('writes a header and rows from objects', () => {
    const result = jsonToCsv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]', COMMA)
    expect(result).toEqual({ ok: true, output: 'a,b\n1,x\n2,y' })
  })

  it('omits the header when the toggle is off', () => {
    const result = jsonToCsv('[{"a":1}]', { delimiter: ',', header: false })
    expect(result).toEqual({ ok: true, output: '1' })
  })

  it('quotes delimiters, quotes and line breaks', () => {
    const result = jsonToCsv('[{"t":"a,b"},{"t":"say \\"hi\\""},{"t":"x\\ny"}]', COMMA)
    expect(result).toEqual({ ok: true, output: 't\n"a,b"\n"say ""hi"""\n"x\ny"' })
  })

  it('uses the union of keys and leaves gaps empty', () => {
    const result = jsonToCsv('[{"a":1},{"b":2}]', COMMA)
    expect(result).toEqual({ ok: true, output: 'a,b\n1,\n,2' })
  })

  it('serialises nested values, null and booleans', () => {
    const result = jsonToCsv('[{"a":{"x":1},"b":null,"c":true}]', { delimiter: ';', header: true })
    expect(result).toEqual({ ok: true, output: 'a;b;c\n"{""x"":1}";;true' })
  })

  it('uses the chosen delimiter for quoting', () => {
    const result = jsonToCsv('[{"a":"x;y","b":"p,q"}]', { delimiter: ';', header: true })
    expect(result).toEqual({ ok: true, output: 'a;b\n"x;y";p,q' })
  })

  it('accepts arrays of arrays', () => {
    expect(jsonToCsv('[[1,"a,b"],[2,"c"]]', COMMA)).toEqual({ ok: true, output: '1,"a,b"\n2,c' })
  })

  it('round-trips through csvToJson', () => {
    const json = '[{"a":"x, y","b":"line1\\nline2","c":"q\\"r"}]'
    const csv = jsonToCsv(json, COMMA)
    if (!csv.ok) throw new Error('csv failed')
    expect(JSON.parse(okOutput(csvToJson(csv.output, COMMA)))).toEqual(JSON.parse(json))
  })

  it('round-trips empty string values without losing records', () => {
    const json = '[{"a":""},{"a":"x"}]'
    const csv = jsonToCsv(json, COMMA)
    expect(csv).toEqual({ ok: true, output: 'a\n""\nx' })
    if (!csv.ok) throw new Error('csv failed')
    expect(JSON.parse(okOutput(csvToJson(csv.output, COMMA)))).toEqual(JSON.parse(json))
  })

  it('writes empty rows and single empty cells distinctly', () => {
    expect(jsonToCsv('[[],[1]]', COMMA)).toEqual({ ok: true, output: '\n1' })
    expect(jsonToCsv('[[""],[1]]', COMMA)).toEqual({ ok: true, output: '""\n1' })
  })

  it('reports invalid JSON', () => {
    expect(jsonToCsv('{nope', COMMA).ok).toBe(false)
  })

  it('rejects non-array JSON and mixed arrays', () => {
    expect(jsonToCsv('{"a":1}', COMMA).ok).toBe(false)
    expect(jsonToCsv('[{"a":1},[1]]', COMMA).ok).toBe(false)
    expect(jsonToCsv('[1,2]', COMMA).ok).toBe(false)
  })

  it('returns empty output for an empty array', () => {
    expect(jsonToCsv('[]', COMMA)).toEqual({ ok: true, output: '' })
  })
})
