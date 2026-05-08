'use server'

import { headers } from 'next/headers'

import { z } from 'zod'

import { sendAbuseReport } from '@/lib/email/abuse'
import { checkRateLimit, strictLimiter } from '@/lib/rate-limit'

const REASONS = ['illegal', 'harassment', 'copyright', 'malware', 'other'] as const

const schema = z.object({
  url: z.url('Enter the URL the report is about.'),
  reason: z.enum(REASONS, { error: 'Pick a reason.' }),
  description: z
    .string()
    .min(20, 'Tell us a little more — at least 20 characters.')
    .max(2000, 'Keep the description under 2000 characters.'),
  reporterEmail: z
    .union([z.literal(''), z.email('That email looks off.')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
})

export type ReportAbuseState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'rate-limited' }
  | { status: 'error'; fieldErrors: Record<string, string>; formError?: string }

async function getRequesterIdentifier(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return headerList.get('x-real-ip') ?? 'unknown'
}

export async function reportAbuse(
  _previous: ReportAbuseState,
  formData: FormData,
): Promise<ReportAbuseState> {
  const identifier = await getRequesterIdentifier()
  const limit = await checkRateLimit(`abuse:${identifier}`, strictLimiter)
  if (!limit.ok) {
    return { status: 'rate-limited' }
  }

  const parsed = schema.safeParse({
    url: formData.get('url'),
    reason: formData.get('reason'),
    description: formData.get('description'),
    reporterEmail: formData.get('reporterEmail'),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'form'
      fieldErrors[key] ??= issue.message
    }
    return { status: 'error', fieldErrors }
  }

  try {
    sendAbuseReport(parsed.data)
  } catch {
    return {
      status: 'error',
      fieldErrors: {},
      formError: "We couldn't send that report. Please try again in a moment.",
    }
  }

  return { status: 'success' }
}
