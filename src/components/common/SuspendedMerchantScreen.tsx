import React from 'react'
import { WhatsAppIcon } from '../Icons'

interface SuspendedMerchantScreenProps {
  email: string
  onLogout: () => void
}

export const SuspendedMerchantScreen: React.FC<SuspendedMerchantScreenProps> = ({
  email,
  onLogout
}) => {
  const handleContactWhatsApp = () => {
    const adminPhone = '923027245937'
    const msg = `Assalam o Alaikum Admin! My merchant account (${email}) is currently paused. Please review and reactivate my access.`
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-950 text-white font-sans">
      <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight mb-2">
          Merchant Account Paused
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Your merchant account (<span className="text-slate-200 font-mono font-bold">{email}</span>) has been paused by the administrator. Parcel booking and API operations are currently disabled.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleContactWhatsApp}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
          >
            <WhatsAppIcon size={16} className="fill-current text-white shrink-0" />
            <span>Contact Admin on WhatsApp</span>
          </button>
          <button
            onClick={onLogout}
            className="h-11 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
