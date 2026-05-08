import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Minimal .env loader for tsx scripts. Next.js auto-loads .env / .env.local,
// but standalone tsx invocations do not — so the migrate / seed scripts use
// this helper to mirror the behaviour locally without adding a `dotenv`
// dependency. Reads in this order, with later files overriding earlier ones:
//   .env, .env.local, .env.<NODE_ENV>, .env.<NODE_ENV>.local
// process.env values that are already set are preserved (CLI / shell wins).
//
// Importing this module runs loadEnv() as a side effect — that way the
// values land in process.env BEFORE other imports trigger lib/env.ts
// validation. Always import this FIRST in scripts that need env.
function loadEnv(): void {
  const root = process.cwd()
  // Next.js's ambient types narrow NODE_ENV to a non-empty literal union,
  // so no fallback is needed.
  const nodeEnv = process.env.NODE_ENV
  const candidates = ['.env', '.env.local', `.env.${nodeEnv}`, `.env.${nodeEnv}.local`]

  for (const name of candidates) {
    const path = resolve(root, name)
    if (!existsSync(path)) continue
    const contents = readFileSync(path, 'utf8')
    for (const rawLine of contents.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] ??= value
    }
  }
}

loadEnv()
