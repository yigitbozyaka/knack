import { describe, expect, it } from 'vitest'

import {
  isPrivateIPv4,
  isPrivateIPv6,
  safeFetch,
  SsrfError,
  validateUrl,
} from '@/lib/security/ssrf'

describe('isPrivateIPv4', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '10.255.255.254',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.254',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
  ])('flags %s as private', (ip) => {
    expect(isPrivateIPv4(ip)).toBe(true)
  })

  it.each(['1.1.1.1', '8.8.8.8', '93.184.216.34', '172.32.0.1', '192.169.0.1'])(
    'allows %s as public',
    (ip) => {
      expect(isPrivateIPv4(ip)).toBe(false)
    },
  )

  it('rejects malformed IPv4 input', () => {
    expect(isPrivateIPv4('not-an-ip')).toBe(false)
    expect(isPrivateIPv4('999.999.999.999')).toBe(false)
    expect(isPrivateIPv4('1.2.3')).toBe(false)
  })
})

describe('isPrivateIPv6', () => {
  it.each([
    '::1',
    '::',
    'fe80::1',
    'febf::1',
    'fc00::1',
    'fdff::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
  ])('flags %s as private', (ip) => {
    expect(isPrivateIPv6(ip)).toBe(true)
  })

  it.each(['2001:4860:4860::8888', '2606:4700:4700::1111', '::ffff:8.8.8.8'])(
    'allows %s as public',
    (ip) => {
      expect(isPrivateIPv6(ip)).toBe(false)
    },
  )
})

describe('validateUrl', () => {
  it('rejects non-http(s) protocols', () => {
    expect(() => validateUrl('file:///etc/passwd')).toThrow(SsrfError)
    expect(() => validateUrl('ftp://example.com')).toThrow(SsrfError)
    expect(() => validateUrl('javascript:alert(1)')).toThrow(SsrfError)
  })

  it('rejects URLs with credentials', () => {
    expect(() => validateUrl('http://user:pass@example.com')).toThrow(SsrfError)
  })

  it('rejects loopback hostnames', () => {
    expect(() => validateUrl('http://localhost/')).toThrow(SsrfError)
    expect(() => validateUrl('http://api.localhost/')).toThrow(SsrfError)
  })

  it('rejects private IPv4 literals', () => {
    expect(() => validateUrl('http://127.0.0.1/')).toThrow(SsrfError)
    expect(() => validateUrl('http://10.0.0.1/')).toThrow(SsrfError)
    expect(() => validateUrl('http://169.254.169.254/')).toThrow(SsrfError)
  })

  it('rejects private IPv6 literals', () => {
    expect(() => validateUrl('http://[::1]/')).toThrow(SsrfError)
    expect(() => validateUrl('http://[fe80::1]/')).toThrow(SsrfError)
  })

  it('returns a URL for a public hostname', () => {
    const result = validateUrl('https://example.com/path?q=1')
    expect(result.hostname).toBe('example.com')
    expect(result.protocol).toBe('https:')
  })

  it('throws on malformed input', () => {
    expect(() => validateUrl('not a url')).toThrow(SsrfError)
  })
})

describe('safeFetch', () => {
  it('refuses to dispatch loopback URLs without doing DNS', async () => {
    await expect(safeFetch('http://127.0.0.1/')).rejects.toBeInstanceOf(SsrfError)
  })

  it('refuses non-http(s) without DNS', async () => {
    await expect(safeFetch('file:///etc/passwd')).rejects.toBeInstanceOf(SsrfError)
  })
})
