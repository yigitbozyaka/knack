const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = new Set(['0', 'O', '1', 'l', 'I'])

export interface PasswordOptions {
  length: number
  lowercase: boolean
  uppercase: boolean
  digits: boolean
  symbols: boolean
  avoidAmbiguous: boolean
}

export function generatePassword(opts: PasswordOptions): string {
  let charset = ''
  if (opts.lowercase) charset += LOWERCASE
  if (opts.uppercase) charset += UPPERCASE
  if (opts.digits) charset += DIGITS
  if (opts.symbols) charset += SYMBOLS

  if (opts.avoidAmbiguous) {
    charset = charset
      .split('')
      .filter((c) => !AMBIGUOUS.has(c))
      .join('')
  }

  if (charset.length === 0) throw new Error('At least one character class must be enabled.')

  const result: string[] = []
  // Rejection sampling avoids modulo bias: discard any byte >= threshold.
  const threshold = Math.floor(256 / charset.length) * charset.length

  while (result.length < opts.length) {
    const buf = crypto.getRandomValues(new Uint8Array(opts.length * 2))
    for (const byte of buf) {
      if (result.length >= opts.length) break
      if (byte < threshold) result.push(charset[byte % charset.length] ?? '')
    }
  }

  return result.join('')
}

export function estimateEntropy(length: number, charsetSize: number): number {
  return length * Math.log2(charsetSize)
}

export type StrengthLabel = 'weak' | 'fair' | 'strong' | 'very strong'

export function strengthLabel(bits: number): StrengthLabel {
  if (bits < 40) return 'weak'
  if (bits < 60) return 'fair'
  if (bits < 80) return 'strong'
  return 'very strong'
}

export function charsetSize(opts: PasswordOptions): number {
  let charset = ''
  if (opts.lowercase) charset += LOWERCASE
  if (opts.uppercase) charset += UPPERCASE
  if (opts.digits) charset += DIGITS
  if (opts.symbols) charset += SYMBOLS
  if (opts.avoidAmbiguous) {
    charset = charset
      .split('')
      .filter((c) => !AMBIGUOUS.has(c))
      .join('')
  }
  return charset.length
}
