'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ToolErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ToolErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 text-xs opacity-80">{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
