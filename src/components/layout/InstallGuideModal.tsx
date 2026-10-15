import React from 'react'
import { SmartphoneIcon } from '../Icons'

interface InstallGuideModalProps {
  isOpen: boolean
  onClose: () => void
  installGuideTab: 'ios' | 'android'
  setInstallGuideTab: (tab: 'ios' | 'android') => void
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
            onClick={() => setInstallGuideTab('android')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              installGuideTab === 'ios'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SmartphoneIcon size={14} /> iPhone / iPad
          </button>
        </div>

        {/* Instruction Steps */}
        <div className="space-y-4 text-sm text-slate-300">
          {installGuideTab === 'android' ? (
            <>
              <p className="leading-relaxed text-xs">Android phone par Zaynahs Courier app install karne ke liye ye steps follow karein:</p>
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-200">
                <li className="leading-relaxed">
                  Apne phone par <strong>Google Chrome</strong> ya default browser open karein.
                </li>
                <li className="leading-relaxed">
                  Top-right corner mein <strong>three-dots menu</strong> (⋮) par click karein.
                </li>
                <li className="leading-relaxed">
                  Menu list mein <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par tap karein.
                </li>
                <li className="leading-relaxed">
                  Screen par aane wale popup mein <strong>"Install"</strong> button par click karke confirm karein.
                </li>
              </ol>
            </>
          ) : (
            <>
              <p className="leading-relaxed text-xs">Apple iOS (Safari) par direct click se app install nahi hoti. Ise Home Screen par lane ke liye ye steps follow karein:</p>
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-200">
                <li className="leading-relaxed">
                  Apne iPhone/iPad par standard <strong>Safari</strong> browser open karein.
                </li>
                <li className="leading-relaxed">
                  Safari ke bottom menu bar mein <strong>Share</strong> button (box with an arrow up icon) par click karein.
                </li>
                <li className="leading-relaxed">
                  Options menu ko scroll down karein aur <strong>"Add to Home Screen"</strong> par tap karein.
                </li>
                <li className="leading-relaxed">
                  Top-right corner mein <strong>"Add"</strong> par click karke save karlein.
                </li>
              </ol>
            </>
          )}
          
          <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-xl text-[11px] text-emerald-300 leading-relaxed">
            Install hone ke baad, aap Zaynahs Courier app ko normal app ki tarah mobile home screen se fast aur full-screen chala sakenge.
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Samajh Gaya (Done)
        </button>
      </div>
    </div>
  )
}
