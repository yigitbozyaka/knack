import { index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text('key').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.key, table.windowStart] }),
    index('rate_limits_window_start_idx').on(table.windowStart),
  ],
)

export type RateLimitRow = typeof rateLimits.$inferSelect
