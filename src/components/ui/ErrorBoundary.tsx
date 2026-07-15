'use client'

import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[XO Arena] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a1a] px-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 text-center max-w-sm w-full">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-400/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-white/50 mb-6">
              The game encountered an unexpected error. Your session is safe.
            </p>
            <button
              onClick={() => { window.location.href = '/' }}
              className="w-full h-11 rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-400/25 transition-all"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
