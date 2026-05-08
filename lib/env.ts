import { z } from 'zod'

const booleanFromString = z
  .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((value) => value === 'true' || value === '1')

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.url(),

  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_PUBLIC_URL: z.url(),

  SESSION_COOKIE_NAME: z.string().min(1).default('knack_session'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  RATE_LIMIT_ENABLED: booleanFromString.default(true),
  RATE_LIMIT_SALT: z.string().min(32, 'RATE_LIMIT_SALT must be at least 32 characters'),

  CRON_SECRET: z.string().min(32, 'CRON_SECRET must be at least 32 characters'),
})

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
})

const isServer = typeof window === 'undefined'

const clientSource: Record<string, string | undefined> = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

function formatErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
}

function parseServer() {
  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    throw new Error(`Invalid server environment variables:\n${formatErrors(result.error)}`)
  }
  return result.data
}

function parseClient() {
  const result = clientSchema.safeParse(clientSource)
  if (!result.success) {
    throw new Error(`Invalid client environment variables:\n${formatErrors(result.error)}`)
  }
  return result.data
}

const serverEnv = isServer ? parseServer() : (null as unknown as z.infer<typeof serverSchema>)
const clientEnv = parseClient()

export const env = {
  ...(isServer ? serverEnv : {}),
  ...clientEnv,
} as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>

export type Env = typeof env
