import React from 'react'

export interface LoadingProgress {
  title?: string
  step?: string
  current?: number
  total?: number
  done?: number
  remaining?: number
  percentage?: number
}

interface GlobalLoadingOverlayProps {
  loading: boolean
  message: string
  progress?: LoadingProgress | null
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  loading,
  message,
  progress
}) => {
  if (!loading) return null

  const title = progress?.title || 'Processing Orders'
  const step = progress?.step || message || 'AI engine is optimizing logistics data...'
  const total = progress?.total ?? 0
  const done = progress?.done ?? 0
  const remaining = progress?.remaining ?? (total > 0 ? Math.max(0, total - done) : 0)
  const percentage = progress?.percentage !== undefined 
    ? Math.min(100, Math.max(0, progress.percentage))
    : (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 45)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-none flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c121e] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-slate-800 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Top Header with Pulse Spinner */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <svg className="animate-spin h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0c121e] animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {percentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Automated logistics pipeline
            </p>
          </div>
        </div>

        {/* Dynamic Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              style={{ width: `${Math.max(8, percentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Progress Status</span>
            <span>{percentage}% Complete</span>
          </div>
        </div>

        {/* Done / Remaining / Total Metric Counters (Apple iOS App Cards) */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                Done
              </span>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                {done}
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                Remain
              </span>
              <p className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                {remaining}
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Total
              </span>
              <p className="text-lg font-black font-mono text-slate-800 dark:text-slate-200 leading-tight mt-0.5">
                {total}
              </p>
            </div>
          </div>
        )}

        {/* Real-time Status Micro-Message with Live Indicator */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
          <span className="truncate font-medium">{step}</span>
        </div>

      </div>
    </div>
  )
}
