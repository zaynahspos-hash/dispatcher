import React from 'react'
import { CloseIcon } from '../Icons'

interface MobileInstallBannerProps {
  isStandalone: boolean
  showBanner: boolean
  isInstallable: boolean
  isIOS: boolean
  onInstall: () => void
  onOpenIOSGuide: () => void
  onDismiss: () => void
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  isStandalone,
  showBanner,
  isInstallable,
  isIOS,
  onInstall,
  onOpenIOSGuide,
  onDismiss,
}) => {
  if (isStandalone || !showBanner || (!isInstallable && !isIOS)) {
    return null
  }

  return (
    <div className="lg:hidden mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-gray-100 rounded-2xl shadow-sm flex items-center justify-between gap-3 transition-all duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <img 
          src="/favicon-96x96.png?v=20261014" 
          onError={(e) => { (e.target as HTMLImageElement).src = '/apple-touch-icon.png?v=20261014' }} 
          className="w-10 h-10 object-contain shrink-0" 
          alt="App Logo" 
        />
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300 leading-snug">
            Install Zaynahs Courier App
          </h4>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-emerald-100/70 leading-tight">
            Apne phone par full-screen use karne ke liye app install karein.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isInstallable ? (
          <button
            onClick={onInstall}
            className="text-[10px] sm:text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            Install
          </button>
        ) : isIOS ? (
          <button
            onClick={onOpenIOSGuide}
            className="text-[10px] sm:text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            iOS Guide
          </button>
        ) : null}
        <button
          onClick={onDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-gray-800 transition cursor-pointer flex items-center justify-center"
          title="Dismiss banner"
        >
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  )
}
