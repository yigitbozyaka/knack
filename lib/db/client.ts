import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '@/lib/env'

type PostgresClient = ReturnType<typeof postgres>
type DrizzleClient = ReturnType<typeof drizzle<Record<string, never>>>

const isProduction = env.NODE_ENV === 'production'

const globalForDb = globalThis as unknown as {
  __knackPostgres?: PostgresClient
  __knackDrizzle?: DrizzleClient
}

function createClient(): PostgresClient {
  return postgres(env.DATABASE_URL, {
    max: isProduction ? 10 : 1,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    prepare: false,
  })
}

export const sql: PostgresClient = globalForDb.__knackPostgres ?? createClient()
export const db: DrizzleClient = globalForDb.__knackDrizzle ?? drizzle(sql)

if (!isProduction) {
  globalForDb.__knackPostgres = sql
  globalForDb.__knackDrizzle = db
}
