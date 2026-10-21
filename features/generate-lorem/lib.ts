export type LoremUnit = 'paragraphs' | 'sentences' | 'words'

export interface LoremOptions {
  unit: LoremUnit
  count: number
  startWithLorem: boolean
}

export const LOREM_LIMITS: Record<LoremUnit, number> = {
  paragraphs: 50,
  sentences: 200,
  words: 2000,
}

const OPENING_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
]

const WORDS = [
  ...OPENING_WORDS,
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'at',
  'vero',
  'eos',
  'accusamus',
  'iusto',
  'odio',
  'dignissimos',
  'ducimus',
  'blanditiis',
  'praesentium',
  'voluptatum',
  'deleniti',
  'atque',
  'corrupti',
  'quos',
  'dolores',
  'quas',
  'molestias',
  'excepturi',
  'obcaecati',
  'cupiditate',
  'provident',
  'similique',
  'mollitia',
  'animi',
  'perspiciatis',
  'unde',
  'omnis',
  'iste',
  'natus',
  'error',
  'voluptatem',
  'accusantium',
  'doloremque',
  'laudantium',
  'totam',
  'rem',
  'aperiam',
  'eaque',
  'ipsa',
  'quae',
  'ab',
  'illo',
  'inventore',
  'veritatis',
  'quasi',
  'architecto',
  'beatae',
  'vitae',
  'dicta',
  'explicabo',
]

export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 2 ** 32) {
    throw new RangeError('maxExclusive must be an integer between 1 and 2^32.')
  }
  const limit = Math.floor(2 ** 32 / maxExclusive) * maxExclusive
  const buffer = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buffer)
    const value = buffer[0] ?? 0
    if (value < limit) return value % maxExclusive
  }
}

function randomIntBetween(min: number, max: number): number {
  return min + randomInt(max - min + 1)
}

function pickWord(): string {
  return WORDS[randomInt(WORDS.length)] ?? 'lorem'
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function buildSentence(startWithLorem: boolean): string {
  const length = randomIntBetween(6, 14)
  const words = startWithLorem ? [...OPENING_WORDS] : []
  while (words.length < length) words.push(pickWord())

  const commaAfter = new Set<number>()
  if (startWithLorem) commaAfter.add(4)
  else if (words.length > 8) commaAfter.add(randomIntBetween(2, words.length - 4))

  const text = words.map((word, index) => (commaAfter.has(index) ? `${word},` : word)).join(' ')
  return `${capitalize(text)}.`
}

function buildParagraph(startWithLorem: boolean): string {
  const sentenceCount = randomIntBetween(3, 6)
  const sentences: string[] = []
  for (let index = 0; index < sentenceCount; index++) {
    sentences.push(buildSentence(startWithLorem && index === 0))
  }
  return sentences.join(' ')
}

export function clampCount(unit: LoremUnit, count: number): number {
  if (!Number.isFinite(count)) return 1
  return Math.min(LOREM_LIMITS[unit], Math.max(1, Math.floor(count)))
}

export function generateLorem(options: LoremOptions): string {
  const count = clampCount(options.unit, options.count)

  if (options.unit === 'words') {
    const words: string[] = options.startWithLorem ? OPENING_WORDS.slice(0, count) : []
    while (words.length < count) words.push(pickWord())
    return words.join(' ')
  }

  if (options.unit === 'sentences') {
    const sentences: string[] = []
    for (let index = 0; index < count; index++) {
      sentences.push(buildSentence(options.startWithLorem && index === 0))
    }
    return sentences.join(' ')
  }

  const paragraphs: string[] = []
  for (let index = 0; index < count; index++) {
    paragraphs.push(buildParagraph(options.startWithLorem && index === 0))
  }
  return paragraphs.join('\n\n')
}
