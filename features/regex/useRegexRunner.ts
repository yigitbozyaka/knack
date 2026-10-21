import { useEffect, useRef, useState } from 'react'

import { type RegexResult } from './lib'
import { type RegexRequest, type WorkerReady } from './regex.worker'

export const DEBOUNCE_MS = 150
export const RUN_TIMEOUT_MS = 1500

interface RunnerState {
  result: RegexResult | null
  timedOut: boolean
  engineFailed: boolean
}

interface WorkerHandle {
  worker: Worker
  ready: boolean
}

function isReady(data: RegexResult | WorkerReady): data is WorkerReady {
  return 'ready' in data
}

function createHandle(): WorkerHandle {
  return { worker: new Worker(new URL('./regex.worker.ts', import.meta.url)), ready: false }
}

export function useRegexRunner(pattern: string, flags: string, text: string): RunnerState {
  const [state, setState] = useState<RunnerState>({
    result: null,
    timedOut: false,
    engineFailed: false,
  })
  const handleRef = useRef<WorkerHandle | null>(null)

  useEffect(
    () => () => {
      handleRef.current?.worker.terminate()
      handleRef.current = null
    },
    [],
  )

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    let inFlight = false

    const discardWorker = () => {
      handleRef.current?.worker.terminate()
      handleRef.current = null
    }

    const debounce = setTimeout(() => {
      const handle = handleRef.current ?? createHandle()
      handleRef.current = handle
      const request: RegexRequest = { pattern, flags, text }

      const dispatch = () => {
        inFlight = true
        timeout = setTimeout(() => {
          inFlight = false
          discardWorker()
          setState({ result: null, timedOut: true, engineFailed: false })
        }, RUN_TIMEOUT_MS)
        handle.worker.postMessage(request)
      }

      handle.worker.onerror = () => {
        inFlight = false
        clearTimeout(timeout)
        discardWorker()
        setState({ result: null, timedOut: false, engineFailed: true })
      }

      handle.worker.onmessage = (event: MessageEvent<RegexResult | WorkerReady>) => {
        if (isReady(event.data)) {
          handle.ready = true
          dispatch()
          return
        }
        inFlight = false
        clearTimeout(timeout)
        setState({ result: event.data, timedOut: false, engineFailed: false })
      }

      if (handle.ready) dispatch()
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(debounce)
      clearTimeout(timeout)
      if (inFlight) discardWorker()
    }
  }, [pattern, flags, text])

  return state
}
