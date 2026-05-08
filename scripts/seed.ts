import './load-env'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { generateToken, hashToken, lookupHash } from '@/lib/auth/token'
import { accounts } from '@/lib/db/schema'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed in production. NODE_ENV must not be "production".')
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required to seed.')

  const client = postgres(databaseUrl, { max: 1, prepare: false })
  const db = drizzle(client)

  const existing = await db.select({ id: accounts.id }).from(accounts).limit(1)
  if (existing.length > 0) {
    console.log('Accounts table is non-empty; seed is idempotent and will not run again.')
    await client.end({ timeout: 5 })
    return
  }

  const token = generateToken()
  const tokenHash = await hashToken(token)
  const tokenLookup = lookupHash(token)

  await db.insert(accounts).values({ tokenHash, tokenLookup })

  console.log('━'.repeat(60))
  console.log('SEEDED DEMO ACCOUNT — DEV ONLY')
  console.log('Token (save this — you cannot recover it):')
  console.log()
  console.log(`  ${token}`)
  console.log()
  console.log('Sign in at /account with that token.')
  console.log('━'.repeat(60))

  await client.end({ timeout: 5 })
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
