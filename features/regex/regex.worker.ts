import { runRegex } from './lib'

export interface RegexRequest {
  pattern: string
  flags: string
  text: string
}

const scope = self as unknown as {
  postMessage(message: unknown): void
  onmessage: ((event: MessageEvent<RegexRequest>) => void) | null
}

scope.onmessage = (event) => {
  const { pattern, flags, text } = event.data
  scope.postMessage(runRegex(pattern, flags, text))
}
