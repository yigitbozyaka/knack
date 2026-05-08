export type UuidVersion = 'v4' | 'v7'

export function generateUuid(version: UuidVersion): string {
  return version === 'v4' ? crypto.randomUUID() : generateUuidV7()
}

// UUID v7 per RFC 9562: 48-bit Unix-ms timestamp | ver=7 | 12-bit rand_a | var=10 | 62-bit rand_b
// Avoids BigInt so it works under tsconfig target ES2017.
function generateUuidV7(): string {
  const ms = Date.now()
  const bytes = crypto.getRandomValues(new Uint8Array(16))

  // Split 48-bit timestamp into upper-16 and lower-32 without BigInt.
  // Date.now() < 2^41 for centuries; Math.floor + >>> 0 keeps full precision.
  const msHi16 = Math.floor(ms / 0x100000000) & 0xffff
  const msLo32 = ms >>> 0

  bytes[0] = (msHi16 >> 8) & 0xff
  bytes[1] = msHi16 & 0xff
  bytes[2] = (msLo32 >>> 24) & 0xff
  bytes[3] = (msLo32 >>> 16) & 0xff
  bytes[4] = (msLo32 >>> 8) & 0xff
  bytes[5] = msLo32 & 0xff
  // Version 7 in high nibble of byte 6
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70
  // RFC 4122 variant (10xx) in high bits of byte 8
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
