import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  title: string
  message?: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback(({ title, message, type = 'info', duration = 3500 }: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newToast: ToastItem = { id, title, message, type, duration }
    
    // Max 3 toasts at once
    setToasts(prev => [...prev.slice(-2), newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const success = useCallback((title: string, message?: string) => {
    showToast({ title, message, type: 'success' })
  }, [showToast])

  const error = useCallback((title: string, message?: string) => {
    showToast({ title, message, type: 'error', duration: 4500 })
  }, [showToast])

  const info = useCallback((title: string, message?: string) => {
    showToast({ title, message, type: 'info' })
  }, [showToast])

  const warning = useCallback((title: string, message?: string) => {
    showToast({ title, message, type: 'warning', duration: 4000 })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Floating Island Toast Notification — Placed safely below the header bar */}
      <div 
        aria-live="polite" 
        className="fixed top-[calc(max(env(safe-area-inset-top),0.75rem)+3.85rem)] sm:top-6 sm:right-6 sm:left-auto sm:translate-x-0 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center sm:items-end gap-2.5 pointer-events-none w-full max-w-[92vw] sm:max-w-sm px-2"
      >
        {toasts.map(toast => {
          const typeStyles = {
            success: {
              badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              icon: (
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ),
              border: 'border-emerald-500/40'
            },
            error: {
              badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
              icon: (
                <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ),
              border: 'border-rose-500/40'
            },
            warning: {
              badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              icon: (
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              border: 'border-amber-500/40'
            },
            info: {
              badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              icon: (
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              border: 'border-emerald-500/40'
            }
          }[toast.type]

          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className={`pointer-events-auto cursor-pointer select-none transform transition-all duration-300 ease-out animate-in slide-in-from-top-4 fade-in active:scale-98
                flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#090d16]/95 text-white border ${typeStyles.border} shadow-[0_12px_32px_rgba(0,0,0,0.6)] min-w-[280px] max-w-full`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${typeStyles.badge}`}>
                {typeStyles.icon}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-bold text-white tracking-tight leading-snug truncate">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-[11px] text-slate-400 font-normal leading-tight truncate mt-0.5">
                    {toast.message}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-500 hover:text-slate-300 shrink-0">✕</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      showToast: () => {},
      success: (title: string) => console.log('[Toast Success]', title),
      error: (title: string) => console.error('[Toast Error]', title),
      info: (title: string) => console.log('[Toast Info]', title),
      warning: (title: string) => console.warn('[Toast Warning]', title),
    }
  }
  return context
}
