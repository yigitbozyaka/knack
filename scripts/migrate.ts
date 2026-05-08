import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations.')
  }

  const client = postgres(databaseUrl, { max: 1, prepare: false })
  const db = drizzle(client)

  console.log('Running migrations…')
  await migrate(db, { migrationsFolder: './lib/db/migrations' })
  console.log('Migrations complete.')

  await client.end({ timeout: 5 })
}

main().catch((err: unknown) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
