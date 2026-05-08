import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16">
      <p className="text-muted-foreground font-mono text-xs">404</p>
      <h1 className="text-foreground text-2xl font-semibold">We couldn&apos;t find that page.</h1>
      <p className="text-muted-foreground text-sm">
        The link may be broken, or the resource may have expired.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}
