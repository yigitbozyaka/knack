import { notFound } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { type Metadata } from 'next'

import { OutputPanel } from '@/components/tools/output-panel'
import { ToolShell } from '@/components/tools/tool-shell'
import { db } from '@/lib/db/client'
import { pastes } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'Paste',
  robots: { index: false },
}

async function loadPaste(slug: string): Promise<{ content: string } | null> {
  const rows = await db
    .select({ content: pastes.content, expiresAt: pastes.expiresAt })
    .from(pastes)
    .where(eq(pastes.slug, slug))
    .limit(1)
  const paste = rows[0]
  if (!paste) return null
  if (paste.expiresAt && paste.expiresAt.getTime() <= Date.now()) return null
  return { content: paste.content }
}

export default async function PasteViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const paste = await loadPaste(slug)
  if (!paste) notFound()

  return (
    <ToolShell>
      <div className="space-y-4" data-testid="paste-output">
        <h1 className="text-2xl font-semibold tracking-tight">Paste</h1>
        <OutputPanel value={paste.content} />
      </div>
    </ToolShell>
  )
}
