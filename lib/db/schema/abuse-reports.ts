import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const ABUSE_RESOURCE_TYPES = ['paste', 'short', 'upload', 'note'] as const
export type AbuseResourceType = (typeof ABUSE_RESOURCE_TYPES)[number]

export const ABUSE_REASONS = ['spam', 'malware', 'phishing', 'illegal', 'csam', 'other'] as const
export type AbuseReason = (typeof ABUSE_REASONS)[number]

export const ABUSE_STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed'] as const
export type AbuseStatus = (typeof ABUSE_STATUSES)[number]

export const abuseReports = pgTable(
  'abuse_reports',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    reason: text('reason').notNull(),
    details: text('details'),
    reporterEmail: text('reporter_email'),
    reporterIpHash: text('reporter_ip_hash'),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'abuse_reports_resource_type_check',
      sql`${table.resourceType} in ('paste','short','upload','note')`,
    ),
    check(
      'abuse_reports_reason_check',
      sql`${table.reason} in ('spam','malware','phishing','illegal','csam','other')`,
    ),
    check(
      'abuse_reports_status_check',
      sql`${table.status} in ('pending','reviewed','actioned','dismissed')`,
    ),
    index('abuse_reports_resource_idx').on(table.resourceType, table.resourceId),
    index('abuse_reports_status_created_idx').on(table.status, table.createdAt),
  ],
)

export type AbuseReport = typeof abuseReports.$inferSelect
export type NewAbuseReport = typeof abuseReports.$inferInsert
