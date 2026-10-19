import React, { useState, useEffect } from 'react'
import { ZapIcon, ShieldIcon, ClockIcon } from '../Icons'

export interface LoadingProgress {
  title?: string
  step?: string
  current?: number
  total?: number
  done?: number
  remaining?: number
  percentage?: number
  latencyMs?: number
  estimatedSecondsRemaining?: number
  modelName?: string
  providerName?: string
  rateLimitInfo?: string
  batchIndex?: number
  totalBatches?: number
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
  const [countdown, setCountdown] = useState<number | null>(null)

  // Sync remaining seconds countdown from progress
  useEffect(() => {
    if (progress?.estimatedSecondsRemaining !== undefined) {
      setCountdown(progress.estimatedSecondsRemaining)
    } else {
      setCountdown(null)
    }
  }, [progress?.estimatedSecondsRemaining])

  // Live 1-second countdown ticker
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const interval = setInterval(() => {
      setCountdown(prev => (prev && prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [countdown])

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-none flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-[#0c121e] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-slate-800 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Top Header: Apple Activity Ring & Titles */}
        <div className="flex items-start gap-3.5">
          <div className="relative w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0c121e]" />
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

            {/* Apple Micro-chips for Model, Latency, and Safe Rate Limit (SVG icons, Zero Emojis) */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {progress?.modelName && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  {progress.modelName}
                </span>
              )}
              {progress?.latencyMs !== undefined && progress.latencyMs > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  <ZapIcon size={11} className="shrink-0" />
                  <span>{progress.latencyMs}ms</span>
                </span>
              )}
              {progress?.rateLimitInfo && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-mono">
                  <ShieldIcon size={11} className="shrink-0" />
                  <span>{progress.rateLimitInfo}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Clean Apple Progress Track */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(6, percentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>{percentage}% Complete</span>
            {countdown !== null && countdown > 0 ? (
              <span className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                <ClockIcon size={12} className="shrink-0" />
                <span>~{countdown}s remaining</span>
              </span>
            ) : (
              <span>Finalizing...</span>
            )}
          </div>
        </div>

        {/* Apple iOS Segmented Metric Strip (Clean Single-Border Container) */}
        {total > 0 && (
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800/80 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 overflow-hidden text-center py-2">
            <div className="px-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Orders
              </span>
              <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                {total}
              </p>
            </div>

            <div className="px-2">
              <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                Cleaned
              </span>
              <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {done}
              </p>
            </div>

            <div className="px-2">
              <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
                In Queue
              </span>
              <p className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {remaining}
              </p>
            </div>
          </div>
        )}

        {/* Live Step Log Activity */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
          <span className="truncate font-medium">{step}</span>
        </div>

      </div>
    </div>
  )
}
