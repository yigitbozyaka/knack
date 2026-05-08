export type SecretFormat = 'hex' | 'base64' | 'base64url' | 'alphanumeric'

export interface SecretOptions {
  format: SecretFormat
  byteLength: number
}

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function generateSecret(opts: SecretOptions): string {
  const bytes = crypto.getRandomValues(new Uint8Array(opts.byteLength))

  switch (opts.format) {
    case 'hex':
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

    case 'base64': {
      let bin = ''
      for (const b of bytes) bin += String.fromCharCode(b)
      return btoa(bin)
    }

    case 'base64url': {
      let bin = ''
      for (const b of bytes) bin += String.fromCharCode(b)
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }

    case 'alphanumeric': {
      // Rejection sampling: discard bytes that cause modulo bias.
      const threshold = Math.floor(256 / ALPHANUM.length) * ALPHANUM.length
      const result: string[] = []
      while (result.length < opts.byteLength) {
        const buf = crypto.getRandomValues(new Uint8Array(opts.byteLength * 2))
        for (const byte of buf) {
          if (result.length >= opts.byteLength) break
          if (byte < threshold) result.push(ALPHANUM[byte % ALPHANUM.length] ?? '')
        }
      }
      return result.join('')
    }
  }
}

export function expectedLength(opts: SecretOptions): number {
  switch (opts.format) {
    case 'hex':
      return opts.byteLength * 2
    case 'base64':
      return Math.ceil(opts.byteLength / 3) * 4
    case 'base64url':
      return Math.ceil((opts.byteLength * 4) / 3)
    case 'alphanumeric':
      return opts.byteLength
  }
}
