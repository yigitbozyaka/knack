import { customAlphabet } from 'nanoid'
import { z } from 'zod'

export const MAX_CONTENT_LENGTH = 100_000

export const EXPIRY_OPTIONS = ['1h', '1d', '7d', '30d', 'never'] as const
export type ExpiryOption = (typeof EXPIRY_OPTIONS)[number]
export const DEFAULT_EXPIRY: ExpiryOption = '7d'

const EXPIRY_MS: Record<Exclude<ExpiryOption, 'never'>, number> = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

export function expiryToDate(option: ExpiryOption, now: number): Date | null {
  if (option === 'never') return null
  return new Date(now + EXPIRY_MS[option])
}

export const createPasteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Paste some text first.')
    .max(
      MAX_CONTENT_LENGTH,
      'Content must be ' + String(MAX_CONTENT_LENGTH) + ' characters or fewer.',
    ),
  expiry: z.enum(EXPIRY_OPTIONS),
})
export type CreatePasteInput = z.infer<typeof createPasteSchema>

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const generateSlugId = customAlphabet(SLUG_ALPHABET, 10)

export function generateSlug(): string {
  return generateSlugId()
}

export const EXPIRY_LABELS: Record<ExpiryOption, string> = {
  '1h': '1 hour',
  '1d': '1 day',
  '7d': '7 days',
  '30d': '30 days',
  never: 'Never',
}
