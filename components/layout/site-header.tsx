import Image from 'next/image'
import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-30 border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-foreground flex items-center gap-2 text-base font-semibold tracking-tight"
          aria-label="Knack — home"
        >
          <Image src="/icon-192.png" alt="" width={26} height={26} priority className="rounded-md" />
          Knack
        </Link>
        <nav className="flex items-center gap-4" aria-label="Primary">
          <Link href="/account" className="text-muted-foreground hover:text-foreground text-sm">
            Account
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
