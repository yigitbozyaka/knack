export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-10 max-w-2xl space-y-3">
        <div className="bg-muted h-9 w-2/3 animate-pulse rounded-md" />
        <div className="bg-muted h-4 w-full animate-pulse rounded-md" />
        <div className="bg-muted h-4 w-5/6 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted mb-8 h-9 w-full max-w-md animate-pulse rounded-md" />
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, sectionIdx) => (
          <section key={sectionIdx} className="space-y-3">
            <div className="bg-muted h-3 w-32 animate-pulse rounded-md" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="bg-muted/40 border-border h-28 animate-pulse rounded-xl border"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
