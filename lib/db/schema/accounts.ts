import { sql } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

// Accounts use a Mullvad-style flow: the user is given a long random token at
// signup, the server stores only an Argon2id hash of that token. Because
// Argon2 hashes are not deterministic, we cannot query by them — so we also
// store an HMAC-SHA256(token, SESSION_SECRET) "lookup hash" that is
// deterministic and indexed for O(1) row lookups during sign-in. The Argon2
// hash is then verified against the supplied token in constant time.
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tokenHash: text('token_hash').notNull().unique(),
    tokenLookup: text('token_lookup').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    isDisabled: boolean('is_disabled').notNull().default(false),
  },
  (table) => [
    uniqueIndex('accounts_token_lookup_idx').on(table.tokenLookup),
    index('accounts_last_seen_at_idx').on(table.lastSeenAt),
  ],
)

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
