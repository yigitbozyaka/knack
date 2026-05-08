import { type NextRequest, NextResponse } from 'next/server'

import { checkRateLimit, defaultLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request)
  const limit = await checkRateLimit(`ip:${ip}`, defaultLimiter)
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  return NextResponse.json({ ip })
}
