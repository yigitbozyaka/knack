import { createHmac, getRandomValues } from 'node:crypto'

import { hash, verify } from '@node-rs/argon2'

import { env } from '@/lib/env'

// 20 random digits ≈ log2(10^20) ≈ 66.4 bits of entropy. We tested 16 digits
// (~53 bits) earlier; 20 keeps brute-force well outside attacker budgets even
// without rate limiting (~10^14 guesses/year on commodity hardware vs. 10^20
// search space) while still fitting cleanly into a 5-group "XXXX-XXXX-..."
// display format.
export const TOKEN_LENGTH = 20
const GROUP_SIZE = 4

const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const

export function generateToken(): string {
  const buf = new Uint32Array(TOKEN_LENGTH)
  getRandomValues(buf)
  let raw = ''
  for (const value of buf) {
    raw += (value % 10).toString()
  }
  return formatToken(raw)
}

export function formatToken(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const groups: string[] = []
  for (let i = 0; i < digits.length; i += GROUP_SIZE) {
    groups.push(digits.slice(i, i + GROUP_SIZE))
  }
  return groups.join('-')
}

export function normalizeToken(raw: string): string {
  return raw.replace(/[\s-]/g, '')
}

export async function hashToken(raw: string): Promise<string> {
  return hash(normalizeToken(raw), ARGON2_OPTIONS)
}

export async function verifyToken(raw: string, storedHash: string): Promise<boolean> {
  try {
    return await verify(storedHash, normalizeToken(raw))
  } catch {
    return false
  }
}

export function lookupHash(raw: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(normalizeToken(raw)).digest('hex')
}
