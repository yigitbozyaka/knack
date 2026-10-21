import { runRegex } from './lib'

export interface RegexRequest {
  pattern: string
  flags: string
  text: string
}

export interface WorkerReady {
  ready: true
}

const scope = self as unknown as {
  postMessage(message: unknown): void
  onmessage: ((event: MessageEvent<RegexRequest>) => void) | null
}

scope.onmessage = (event) => {
  const { pattern, flags, text } = event.data
  scope.postMessage(runRegex(pattern, flags, text))
}

scope.postMessage({ ready: true } satisfies WorkerReady)
