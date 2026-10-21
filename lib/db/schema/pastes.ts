import { sql } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { accounts } from './accounts'

export const pastes = pgTable(
  'pastes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text('slug').notNull().unique(),
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('pastes_account_id_idx').on(table.accountId),
    index('pastes_expires_at_idx').on(table.expiresAt),
  ],
)

export type Paste = typeof pastes.$inferSelect
export type NewPaste = typeof pastes.$inferInsert
