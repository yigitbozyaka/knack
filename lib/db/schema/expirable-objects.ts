import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const EXPIRABLE_KINDS = ['upload', 'paste', 'note', 'short'] as const
export type ExpirableKind = (typeof EXPIRABLE_KINDS)[number]

export const expirableObjects = pgTable(
  'expirable_objects',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    kind: text('kind').notNull(),
    resourceId: text('resource_id').notNull(),
    storageKey: text('storage_key'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('expirable_objects_kind_check', sql`${table.kind} in ('upload','paste','note','short')`),
    index('expirable_objects_expires_at_idx').on(table.expiresAt),
  ],
)

export type ExpirableObject = typeof expirableObjects.$inferSelect
export type NewExpirableObject = typeof expirableObjects.$inferInsert
