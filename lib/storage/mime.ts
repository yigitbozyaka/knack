import { fileTypeFromBuffer } from 'file-type'

export const IMAGE_ALLOWLIST = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

// Anything in this list is rejected outright. We block these because they can
// either execute on someone's machine if downloaded, or be served back as
// content that the browser will render — which gives an attacker a foothold
// on knack.wtf's origin (cookies, CSP-trusted scripts, etc.).
export const FILE_BLOCKLIST = [
  'application/x-msdownload', // .exe / .dll
  'application/x-msi',
  'application/x-msdos-program',
  'application/x-sh',
  'application/x-bat',
  'application/x-csh',
  'application/x-elf',
  'application/x-mach-binary',
  'application/javascript',
  'application/x-javascript',
  'application/ecmascript',
  'application/wasm',
  'text/javascript',
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml', // SVG can carry script tags
] as const

export type ValidateMode = 'image' | 'file'

export type ValidateResult = { ok: true; type: string } | { ok: false; reason: string }

export interface ValidateOptions {
  buffer: Uint8Array
  declaredType: string
  mode: ValidateMode
}

export async function detectMime(buffer: Uint8Array): Promise<string | null> {
  const result = await fileTypeFromBuffer(buffer)
  return result?.mime ?? null
}

export async function validateUpload(options: ValidateOptions): Promise<ValidateResult> {
  const detected = await detectMime(options.buffer)

  // For text-only payloads (paste, note) magic-byte sniffing returns null;
  // accept the declared type if it isn't on the blocklist. Callers using
  // mode: 'file' for binary uploads should always have a sniffable type.
  const effective = detected ?? options.declaredType.toLowerCase()

  if ((FILE_BLOCKLIST as readonly string[]).includes(effective)) {
    return { ok: false, reason: `Files of type ${effective} are not allowed.` }
  }

  if (options.mode === 'image') {
    if (!(IMAGE_ALLOWLIST as readonly string[]).includes(effective)) {
      return { ok: false, reason: `Only PNG, JPEG, WebP, GIF, and AVIF images are allowed.` }
    }
  }

  if (detected && !mimeTypesEqual(detected, options.declaredType)) {
    return {
      ok: false,
      reason: `Declared type ${options.declaredType} does not match detected ${detected}.`,
    }
  }

  return { ok: true, type: effective }
}

function mimeTypesEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}
