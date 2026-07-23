import { Component } from 'react'

/**
 * Catches rendering errors (including lazy-loaded chunk download failures)
 * and shows a recovery UI instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" /></svg>
          </div>
          <p className="text-2xl font-black text-slate-950">Something went wrong</p>
          <p className="max-w-sm text-sm text-slate-600">The page failed to load. This is often a network issue — check your connection and try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-teal-700 px-6 py-3 font-bold text-white transition hover:bg-teal-800">
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
