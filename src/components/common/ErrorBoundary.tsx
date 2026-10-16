import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangleIcon, RefreshIcon } from '../Icons'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught runtime exception:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.hash = '#paste'
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c121e] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangleIcon size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {this.props.fallbackTitle || 'Component Rendering Interrupted'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A non-fatal interface glitch occurred. The application prevented a blank white screen crash.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 dark:bg-[#070b12] rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Diagnostic Log:</span>
                <code className="text-xs text-rose-600 dark:text-rose-400 font-mono break-all">
                  {this.state.error.message || String(this.state.error)}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <RefreshIcon size={14} />
              <span>Recover & Reload Section</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
