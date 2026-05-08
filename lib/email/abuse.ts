import { env } from '@/lib/env'

export interface AbuseReport {
  url: string
  reason: string
  description: string
  reporterEmail?: string
}

// Stub for now — once we wire a real transport (Resend, SES, Postmark…), the
// full report (including description) goes to abuse@knack.wtf. We deliberately
// don't echo the description into application logs: report content can be
// sensitive, and the log sink isn't the right place for it.
export function sendAbuseReport(report: AbuseReport): void {
  console.warn(
    JSON.stringify({
      level: 'warn',
      kind: 'abuse_report',
      url: report.url,
      reason: report.reason,
      descriptionLength: report.description.length,
      reporterEmail: report.reporterEmail ?? null,
      receivedAt: new Date().toISOString(),
      env: env.NODE_ENV,
    }),
  )
}
