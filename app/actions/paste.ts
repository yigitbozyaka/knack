'use server'

import { headers } from 'next/headers'

import { createPasteSchema, expiryToDate, generateSlug } from '@/features/paste/lib'
import { getCurrentAccount } from '@/lib/auth/account'
import { db } from '@/lib/db/client'
import { expirableObjects, pastes } from '@/lib/db/schema'
import { checkRateLimit, strictLimiter } from '@/lib/rate-limit'

export type CreatePasteState =
  | { status: 'idle' }
  | { status: 'success'; slug: string }
  | { status: 'rate-limited' }
  | { status: 'error'; fieldErrors: Record<string, string> }

async function getRequesterIdentifier(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return headerList.get('x-real-ip') ?? 'unknown'
}

export async function createPaste(
  _previous: CreatePasteState,
  formData: FormData,
): Promise<CreatePasteState> {
  const identifier = await getRequesterIdentifier()
  const limit = await checkRateLimit(`paste:${identifier}`, strictLimiter)
  if (!limit.ok) {
    return { status: 'rate-limited' }
  }

  const parsed = createPasteSchema.safeParse({
    content: formData.get('content'),
    expiry: formData.get('expiry'),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'form'
      fieldErrors[key] ??= issue.message
    }
    return { status: 'error', fieldErrors }
  }

  const account = await getCurrentAccount()
  const expiresAt = expiryToDate(parsed.data.expiry, Date.now())

  const inserted = await db
    .insert(pastes)
    .values({
      slug: generateSlug(),
      accountId: account?.id ?? null,
      content: parsed.data.content,
      expiresAt,
    })
    .returning({ id: pastes.id, slug: pastes.slug })

  const paste = inserted[0]
  if (!paste) {
    return { status: 'error', fieldErrors: { form: 'Could not create paste. Try again.' } }
  }

  if (expiresAt) {
    await db.insert(expirableObjects).values({
      kind: 'paste',
      resourceId: paste.id,
      expiresAt,
    })
  }

  return { status: 'success', slug: paste.slug }
}
