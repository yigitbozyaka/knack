import { timingSafeEqual } from 'node:crypto'

import { type NextRequest, NextResponse } from 'next/server'

import { eq, lt } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { expirableObjects, pastes, rateLimits } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { RATE_LIMIT_RETENTION_MS } from '@/lib/rate-limit'
import { deleteObject } from '@/lib/storage/upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BATCH_SIZE = 100

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  const token = header.slice('Bearer '.length).trim()
  return constantTimeEquals(token, env.CRON_SECRET)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let processed = 0
  const errors: string[] = []

  for (let pass = 0; pass < 10; pass++) {
    const due = await db
      .select()
      .from(expirableObjects)
      .where(lt(expirableObjects.expiresAt, new Date()))
      .limit(BATCH_SIZE)

    if (due.length === 0) break

    for (const row of due) {
      try {
        if (row.storageKey) {
          await deleteObject(row.storageKey)
        }
        if (row.kind === 'paste') {
          await db.delete(pastes).where(eq(pastes.id, row.resourceId))
        }
        // other kinds (note, short, upload) wired in their own PRs
        await db.delete(expirableObjects).where(eq(expirableObjects.id, row.id))
        processed++
      } catch (error) {
        errors.push(
          `${row.kind}:${row.resourceId} — ${error instanceof Error ? error.message : 'unknown'}`,
        )
      }
    }
  }

  await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, new Date(Date.now() - RATE_LIMIT_RETENTION_MS)))

  return NextResponse.json({ processed, errors })
}
