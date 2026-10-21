import { useEffect, useRef, useState } from 'react'

import { type RegexResult } from './lib'
import { type RegexRequest } from './regex.worker'

export const DEBOUNCE_MS = 150
export const RUN_TIMEOUT_MS = 1500

interface RunnerState {
  result: RegexResult | null
  timedOut: boolean
}

function createWorker(): Worker {
  return new Worker(new URL('./regex.worker.ts', import.meta.url))
}

export function useRegexRunner(pattern: string, flags: string, text: string): RunnerState {
  const [state, setState] = useState<RunnerState>({ result: null, timedOut: false })
  const workerRef = useRef<Worker | null>(null)

  useEffect(
    () => () => {
      workerRef.current?.terminate()
      workerRef.current = null
    },
    [],
  )

  useEffect(() => {
    let inFlight = false
    let timeout: ReturnType<typeof setTimeout> | undefined

    const debounce = setTimeout(() => {
      const worker = workerRef.current ?? createWorker()
      workerRef.current = worker
      inFlight = true

      timeout = setTimeout(() => {
        inFlight = false
        worker.terminate()
        workerRef.current = null
        setState({ result: null, timedOut: true })
      }, RUN_TIMEOUT_MS)

      worker.onmessage = (event: MessageEvent<RegexResult>) => {
        inFlight = false
        clearTimeout(timeout)
        setState({ result: event.data, timedOut: false })
      }

      const request: RegexRequest = { pattern, flags, text }
      worker.postMessage(request)
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(debounce)
      clearTimeout(timeout)
      if (inFlight) {
        workerRef.current?.terminate()
        workerRef.current = null
      }
    }
  }, [pattern, flags, text])

  return state
}
