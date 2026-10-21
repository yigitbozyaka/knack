export type Base64Result = { ok: true; output: string } | { ok: false; error: string }

const CHUNK_SIZE = 0x8000

export function encodeBase64(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  const standard = btoa(binary)
  return urlSafe ? toUrlSafe(standard) : standard
}

export function decodeBase64(input: string): Base64Result {
  const cleaned = input.replace(/\s+/g, '')
  if (cleaned === '') return { ok: true, output: '' }
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(cleaned)) {
    return { ok: false, error: 'Input contains characters that are not valid base64.' }
  }
  const unpadded = cleaned.replace(/=+$/, '')
  if (unpadded.length % 4 === 1) {
    return { ok: false, error: 'Input has an invalid base64 length.' }
  }
  const standard = unpadded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4)
  try {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return { ok: true, output: new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
  } catch {
    return { ok: false, error: 'Decoded bytes are not valid UTF-8 text.' }
  }
}

function toUrlSafe(standard: string): string {
  return standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
