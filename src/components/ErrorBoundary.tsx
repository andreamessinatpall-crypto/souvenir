import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('errore imprevisto', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="text-lg font-medium text-slate-700">Qualcosa è andato storto.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-[#0b4468] px-6 py-3 font-semibold text-white"
          >
            Ricarica
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
