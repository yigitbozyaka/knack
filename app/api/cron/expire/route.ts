import { timingSafeEqual } from 'node:crypto'

import { type NextRequest, NextResponse } from 'next/server'

import { eq, lt } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { expirableObjects } from '@/lib/db/schema'
import { env } from '@/lib/env'
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

  // Loop until either the batch is empty or we've drained everything available
  // in this run. The cron runs frequently enough that we don't try to process
  // unbounded backlogs in a single invocation.
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
        // Resource-row deletion (paste, note, short, upload) is wired in each
        // tool's PR. For now the expirable_objects row is the source of truth
        // and gets removed; tools that haven't migrated yet just leak their
        // resource row, which is acceptable until those tools land.
        await db.delete(expirableObjects).where(eq(expirableObjects.id, row.id))
        processed++
      } catch (error) {
        errors.push(
          `${row.kind}:${row.resourceId} — ${error instanceof Error ? error.message : 'unknown'}`,
        )
      }
    }
  }

  return NextResponse.json({ processed, errors })
}
