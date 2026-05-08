'use client'

import { useSyncExternalStore } from 'react'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

function noopUnsubscribe() {
  // Hydration state never changes, so the subscribe callback never needs to fire.
}
function noopSubscribe() {
  return noopUnsubscribe
}
const trueOnClient = () => true
const falseOnServer = () => false

// Until React has hydrated, the resolved theme is unknown — render a stable
// theme-agnostic label that matches the server output, then swap in the
// theme-dependent label after mount. useSyncExternalStore is the React-blessed
// way to express this without tripping the set-state-in-effect lint rule.
function useIsHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, trueOnClient, falseOnServer)
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const hydrated = useIsHydrated()

  const isDark = hydrated && resolvedTheme === 'dark'
  const label = hydrated ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Toggle theme'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={() => {
        if (!hydrated) return
        setTheme(isDark ? 'light' : 'dark')
      }}
    >
      <SunIcon className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
