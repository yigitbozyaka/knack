'use client'

import { useEffect, useMemo, useState } from 'react'

import { SearchIcon } from 'lucide-react'

import { ToolCard } from '@/components/home/tool-card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TOOL_CATEGORIES, type Tool, type ToolCategory } from '@/lib/tools/registry'

const ALL = 'All' as const
type TabValue = typeof ALL | ToolCategory

function useDebounce(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value)
    }, ms)
    return () => {
      clearTimeout(id)
    }
  }, [value, ms])
  return debounced
}

function sortLiveFirst(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'live' ? -1 : 1
  })
}

export function ToolGrid({ tools }: { tools: readonly Tool[] }) {
  const [rawQuery, setRawQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabValue>(ALL)
  const query = useDebounce(rawQuery, 150)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = q
      ? tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q),
        )
      : [...tools]
    if (activeTab !== ALL) {
      result = result.filter((tool) => tool.category === activeTab)
    }
    return sortLiveFirst(result)
  }, [tools, query, activeTab])

  const grouped = useMemo(() => {
    const map = new Map<string, Tool[]>()
    for (const category of TOOL_CATEGORIES) map.set(category, [])
    for (const tool of filtered) map.get(tool.category)?.push(tool)
    return map
  }, [filtered])

  const tabs: TabValue[] = [ALL, ...TOOL_CATEGORIES]

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <SearchIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search tools…"
          value={rawQuery}
          onChange={(event) => {
            setRawQuery(event.target.value)
          }}
          aria-label="Search tools"
          className="pl-9"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TabValue)
        }}
      >
        <TabsList className="h-auto flex-wrap gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tools match that search.</p>
            ) : tab === ALL ? (
              <div className="space-y-8">
                {TOOL_CATEGORIES.map((category) => {
                  const items = grouped.get(category) ?? []
                  if (items.length === 0) return null
                  return (
                    <section
                      key={category}
                      aria-labelledby={`cat-${category}`}
                      className="space-y-3"
                    >
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
                })}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
