import React from 'react'
import { SmartphoneIcon } from '../Icons'

interface InstallGuideModalProps {
  isOpen: boolean
  onClose: () => void
  installGuideTab: 'desktop' | 'ios' | 'android'
  setInstallGuideTab: (tab: 'desktop' | 'ios' | 'android') => void
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  installGuideTab,
  setInstallGuideTab,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in text-left">
      <div className="relative w-full max-w-sm p-6 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glassmorphism transform transition-all duration-300 scale-100 text-white">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <img 
              src="/favicon-96x96.png?v=20261014" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/apple-touch-icon.png?v=20261014' }} 
              className="w-8 h-8 object-contain shrink-0" 
              alt="App Logo" 
            />
            <h3 className="text-base font-bold tracking-tight">App Installation Guide</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => setInstallGuideTab('desktop')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              installGuideTab === 'desktop'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PC / Laptop
          </button>
          <button
            type="button"
            onClick={() => setInstallGuideTab('android')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              installGuideTab === 'android'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SmartphoneIcon size={14} /> Android
          </button>
          <button
            type="button"
            onClick={() => setInstallGuideTab('ios')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              installGuideTab === 'ios'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SmartphoneIcon size={14} /> iOS
          </button>
        </div>

        {/* Instruction Steps */}
        <div className="space-y-4 text-sm text-slate-300">
          {installGuideTab === 'desktop' ? (
            <>
              <p className="leading-relaxed text-xs">Steps to install Zaynahs Courier app on Windows, Mac, or PC:</p>
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-200">
                <li className="leading-relaxed">
                  Click the <strong>Install icon (⊕)</strong> in the right corner of Chrome or Edge address bar.
                </li>
                <li className="leading-relaxed">
                  Or click the <strong>three dots menu (⋮)</strong> &rarr; <strong>"Save and share"</strong> &rarr; select <strong>"Install Zaynahs Courier"</strong>.
                </li>
                <li className="leading-relaxed">
                  Click <strong>"Install"</strong> in the prompt. The app launches immediately in a clean, standalone desktop window.
                </li>
              </ol>
            </>
          ) : installGuideTab === 'android' ? (
            <>
              <p className="leading-relaxed text-xs">Follow these steps to install Zaynahs Courier app on Android:</p>
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-200">
                <li className="leading-relaxed">
                  Open <strong>Google Chrome</strong> or your default browser on your phone.
                </li>
                <li className="leading-relaxed">
                  Tap the <strong>three-dots menu</strong> (⋮) in the top-right corner.
                </li>
                <li className="leading-relaxed">
                  Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </li>
                <li className="leading-relaxed">
                  Tap <strong>"Install"</strong> in the confirmation popup.
                </li>
              </ol>
            </>
          ) : (
            <>
              <p className="leading-relaxed text-xs">Follow these steps to add Zaynahs Courier to your iPhone or iPad Home Screen:</p>
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-200">
                <li className="leading-relaxed">
                  Open the app in standard <strong>Safari</strong> browser on your iPhone/iPad.
                </li>
                <li className="leading-relaxed">
                  Tap the <strong>Share</strong> button (box with an arrow up icon) in Safari's bottom toolbar.
                </li>
                <li className="leading-relaxed">
                  Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.
                </li>
                <li className="leading-relaxed">
                  Tap <strong>"Add"</strong> in the top-right corner to save.
                </li>
              </ol>
            </>
          )}
          
          <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-xl text-[11px] text-emerald-300 leading-relaxed">
            Once installed, you can launch Zaynahs Courier directly from your home screen as a fast, full-screen standalone application.
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  )
}
