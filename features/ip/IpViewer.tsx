'use client'

import { useEffect, useState } from 'react'

import { GlobeIcon } from 'lucide-react'

import { CopyButton } from '@/components/tools/copy-button'
import { ToolPageHeader } from '@/components/tools/tool-page-header'

type State =
  | { status: 'loading' }
  | { status: 'ok'; ip: string }
  | { status: 'error'; message: string }

export function IpViewer() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/ip')
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `HTTP ${String(res.status)}`)
        }
        return res.json() as Promise<{ ip: string }>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', ip: data.ip })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to fetch IP.',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <ToolPageHeader
        title="What's my IP?"
        description="Your public IP address as seen by the server. Nothing is logged or stored."
        icon={GlobeIcon}
      />

      <div className="flex flex-col items-center justify-center gap-4 py-12">
        {state.status === 'loading' && (
          <p className="text-muted-foreground animate-pulse text-sm">Looking up your IP…</p>
        )}

        {state.status === 'ok' && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-semibold tracking-tight">{state.ip}</span>
            <CopyButton value={state.ip} label="Copy IP" size="sm" />
          </div>
        )}

        {state.status === 'error' && (
          <p className="text-destructive text-sm" role="alert">
            {state.message}
          </p>
        )}
      </div>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        This is your public IP address — the address your ISP assigns to your connection. It may be
        shared across multiple devices if you&apos;re behind NAT.
      </p>
    </>
  )
}
