export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

export type HashResults = Record<HashAlgorithm, string>

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest(algorithm, data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashAll(text: string): Promise<HashResults> {
  const entries = await Promise.all(
    HASH_ALGORITHMS.map(async (algorithm) => [algorithm, await hashText(text, algorithm)] as const),
  )
  return Object.fromEntries(entries) as HashResults
}
