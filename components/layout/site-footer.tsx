import Link from 'next/link'

import { AbuseReportDialog } from '@/components/abuse-report-dialog'

export function SiteFooter() {
  const year = new Date().getUTCFullYear()
  return (
    <footer className="text-muted-foreground border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs">
        <div className="flex items-center gap-3">
          <span>Knack — small tools, done well.</span>
          <a
            href="https://github.com/yigitbozyaka/knack"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/account" className="hover:text-foreground">
            Account
          </Link>
          <a href="mailto:abuse@knack.wtf" className="hover:text-foreground">
            Report abuse
          </a>
          <a
            href="https://github.com/yigitbozyaka/knack/blob/master/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Security
          </a>
          <span className="border-border rounded-md border px-1.5 py-0.5">MIT</span>
          <span className="hidden sm:inline">© {year}</span>
          <AbuseReportDialog />
        </div>
      </div>
    </footer>
  )
}
