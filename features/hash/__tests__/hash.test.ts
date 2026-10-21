import { afterEach, describe, expect, it, vi } from 'vitest'

import { HASH_ALGORITHMS, hashAll, hashText } from '../lib'

describe('hashText', () => {
  it('matches known vectors for "abc"', async () => {
    expect(await hashText('abc', 'SHA-1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect(await hashText('abc', 'SHA-256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(await hashText('abc', 'SHA-384')).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    )
    expect(await hashText('abc', 'SHA-512')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })

  it('hashes the empty string', async () => {
    expect(await hashText('', 'SHA-256')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('hashes multi-byte text as UTF-8', async () => {
    expect(await hashText('é', 'SHA-1')).toBe('bf15be717ac1b080b4f1c456692825891ff5073d')
  })

  it('rejects unsupported algorithms', async () => {
    await expect(hashText('abc', 'MD5' as never)).rejects.toThrow()
  })
})

describe('hashAll', () => {
  it('returns a digest for every algorithm with the right length', async () => {
    const results = await hashAll('knack')
    expect(Object.keys(results)).toEqual([...HASH_ALGORITHMS])
    expect(results['SHA-1']).toHaveLength(40)
    expect(results['SHA-256']).toHaveLength(64)
    expect(results['SHA-384']).toHaveLength(96)
    expect(results['SHA-512']).toHaveLength(128)
  })
})

describe('hashAll without Web Crypto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects when crypto.subtle is unavailable', async () => {
    vi.stubGlobal('crypto', {})
    await expect(hashAll('abc')).rejects.toThrow()
  })
})
