'use client'

import { useMemo, useState } from 'react'

import { SearchIcon } from 'lucide-react'

import { ToolCard } from '@/components/home/tool-card'
import { Input } from '@/components/ui/input'
import { TOOL_CATEGORIES, type Tool } from '@/lib/tools/registry'

export function ToolGrid({ tools }: { tools: readonly Tool[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tools
    return tools.filter(
      (tool) => tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q),
    )
  }, [tools, query])

  const grouped = useMemo(() => {
    const map = new Map<string, Tool[]>()
    for (const category of TOOL_CATEGORIES) map.set(category, [])
    for (const tool of filtered) map.get(tool.category)?.push(tool)
    return map
  }, [filtered])

  return (
    <div className="space-y-8">
      <div className="relative max-w-md">
        <SearchIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search tools…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
          }}
          aria-label="Search tools"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tools match that search.</p>
      ) : (
        TOOL_CATEGORIES.map((category) => {
          const items = grouped.get(category) ?? []
          if (items.length === 0) return null
          return (
            <section key={category} aria-labelledby={`cat-${category}`} className="space-y-3">
              <h2
                id={`cat-${category}`}
                className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
