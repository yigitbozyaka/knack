import { lookup } from 'node:dns/promises'

// SSRF guard for outbound fetches. Always reach for `safeFetch` instead of
// raw `fetch` when the URL is in any way derived from user input.
//
// Threat model in `docs/threat-model.md` row 2 covers what this protects
// against and the trade-offs we accept (notably DNS rebinding — we resolve
// once, then fetch trusts the kernel's resolver. Tightening this requires
// pinning the resolved IP into the connection layer; future work).

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

const DEFAULT_TIMEOUT_MS = 8_000

export class SsrfError extends Error {
  override readonly name = 'SsrfError'
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const num = Number(part)
    if (num < 0 || num > 255) return null
    result = result * 256 + num
  }
  return result
}

const PRIVATE_IPV4_RANGES: readonly (readonly [number, number])[] = [
  [ipv4ToInt('0.0.0.0') ?? 0, ipv4ToInt('0.255.255.255') ?? 0],
  [ipv4ToInt('10.0.0.0') ?? 0, ipv4ToInt('10.255.255.255') ?? 0],
  [ipv4ToInt('100.64.0.0') ?? 0, ipv4ToInt('100.127.255.255') ?? 0],
  [ipv4ToInt('127.0.0.0') ?? 0, ipv4ToInt('127.255.255.255') ?? 0],
  [ipv4ToInt('169.254.0.0') ?? 0, ipv4ToInt('169.254.255.255') ?? 0],
  [ipv4ToInt('172.16.0.0') ?? 0, ipv4ToInt('172.31.255.255') ?? 0],
  [ipv4ToInt('192.0.0.0') ?? 0, ipv4ToInt('192.0.0.255') ?? 0],
  [ipv4ToInt('192.168.0.0') ?? 0, ipv4ToInt('192.168.255.255') ?? 0],
  [ipv4ToInt('198.18.0.0') ?? 0, ipv4ToInt('198.19.255.255') ?? 0],
  [ipv4ToInt('224.0.0.0') ?? 0, ipv4ToInt('239.255.255.255') ?? 0],
  [ipv4ToInt('240.0.0.0') ?? 0, ipv4ToInt('255.255.255.255') ?? 0],
]

export function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip)
  if (value === null) return false
  for (const [start, end] of PRIVATE_IPV4_RANGES) {
    if (value >= start && value <= end) return true
  }
  return false
}

export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true

  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice('::ffff:'.length)
    if (mapped.includes('.')) return isPrivateIPv4(mapped)
  }

  const firstColon = lower.indexOf(':')
  if (firstColon <= 0) return false
  const first = parseInt(lower.slice(0, firstColon), 16)
  if (Number.isNaN(first)) return false

  if (first >= 0xfe80 && first <= 0xfebf) return true
  if (first >= 0xfc00 && first <= 0xfdff) return true
  if (first >= 0xff00) return true

  return false
}

export function validateUrl(input: string): URL {
  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    throw new SsrfError(`Invalid URL: ${input}`)
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new SsrfError(`Disallowed protocol: ${parsed.protocol}`)
  }
  if (parsed.username || parsed.password) {
    throw new SsrfError('URL credentials are not allowed.')
  }
  if (!parsed.hostname) {
    throw new SsrfError('URL must include a hostname.')
  }

  let host = parsed.hostname.toLowerCase()
  // WHATWG URL keeps the brackets on IPv6 hostnames (e.g. `[::1]`).
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1)
  }

  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new SsrfError('Loopback hostname is not allowed.')
  }

  if (isPrivateIPv4(host)) {
    throw new SsrfError(`Private IPv4 literal not allowed: ${host}`)
  }
  if (host.includes(':') && isPrivateIPv6(host)) {
    throw new SsrfError(`Private IPv6 literal not allowed: ${host}`)
  }

  return parsed
}

async function ensureHostnameIsPublic(hostname: string): Promise<void> {
  const addresses = await lookup(hostname, { all: true, verbatim: false })
  for (const { address, family } of addresses) {
    if (family === 4 && isPrivateIPv4(address)) {
      throw new SsrfError(`Hostname resolves to private IPv4: ${hostname} -> ${address}`)
    }
    if (family === 6 && isPrivateIPv6(address)) {
      throw new SsrfError(`Hostname resolves to private IPv6: ${hostname} -> ${address}`)
    }
  }
}

export interface SafeFetchOptions extends RequestInit {
  /** Per-request timeout in ms. Default 8000. */
  timeoutMs?: number
  /** Allow following redirects (each destination is re-validated). Default false. */
  allowRedirects?: boolean
}

export async function safeFetch(
  input: string | URL,
  options: SafeFetchOptions = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, allowRedirects = false, ...init } = options

  const target = validateUrl(typeof input === 'string' ? input : input.toString())
  await ensureHostnameIsPublic(target.hostname)

  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(target, {
      ...init,
      signal: controller.signal,
      redirect: allowRedirects ? 'follow' : 'manual',
    })
  } finally {
    clearTimeout(timer)
  }
}
