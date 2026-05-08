'use client'

import dynamic from 'next/dynamic'

// ssr: false must live in a Client Component — not allowed in RSC pages.
// NotesApp reads localStorage on init, so we skip SSR entirely.
export const NotesAppNoSSR = dynamic(() => import('./NotesApp').then((m) => m.NotesApp), {
  ssr: false,
})
