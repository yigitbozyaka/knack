import { AbuseReportDialog } from '@/components/abuse-report-dialog'

export function Footer() {
  const year = new Date().getUTCFullYear()
  return (
    <footer className="text-muted-foreground border-t px-4 py-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>© {year} Knack — open source under MIT.</span>
        <AbuseReportDialog />
      </div>
    </footer>
  )
}
