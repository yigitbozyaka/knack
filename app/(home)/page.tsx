import { ToolGrid } from '@/components/home/tool-grid'
import { TOOLS } from '@/lib/tools/registry'

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-10 max-w-2xl space-y-2">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          Small tools, done well.
        </h1>
        <p className="text-muted-foreground text-base">
          Knack is an open-source utility belt for the web — converters, encoders, generators,
          paste, short links, and more. No accounts required for most tools.
        </p>
      </header>

      <ToolGrid tools={TOOLS} />
    </div>
  )
}
