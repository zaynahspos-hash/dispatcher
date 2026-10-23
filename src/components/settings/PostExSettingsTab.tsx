import React, { useState } from 'react'
import { Settings } from '../../utils/aiParser'
import { ExternalLinkIcon, LockIcon } from '../Icons'

export interface MerchantAddress {
  addressCode: string
  address: string
  cityName: string
  addressType: string
}

interface PostExSettingsTabProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
  addresses: MerchantAddress[]
  loadingAddresses: boolean
  testingPostex: boolean
  postexPingResult: string | null
  onTestPostEx: () => void
  onSave?: (override?: Partial<Settings>) => Promise<any> | void
  saving?: boolean
  hasChanges?: boolean
}

export const PostExSettingsTab: React.FC<PostExSettingsTabProps> = ({
  settings,
  updateSetting,
  addresses,
  loadingAddresses,
  testingPostex,
  postexPingResult,
  onTestPostEx,
  onSave,
  saving = false
}) => {
  const [isEditingToken, setIsEditingToken] = useState(false)
  const [isConfirmingRemoveToken, setIsConfirmingRemoveToken] = useState(false)
  const [tempToken, setTempToken] = useState(settings.postex_token || '')

  React.useEffect(() => {
    if (settings.postex_token && !isEditingToken) {
      setTempToken(settings.postex_token)
    }
  }, [settings.postex_token, isEditingToken])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        
        {/* Token Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                PostEx Merchant API Token (V3)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Production token used to book orders and generate live airway bills.
              </p>
            </div>
            <a
              href="https://merchant.postex.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Merchant Portal</span>
              <ExternalLinkIcon size={12} />
            </a>
          </div>

          {settings.postex_token && !isEditingToken ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-[#070b12] border border-slate-200/90 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <LockIcon size={14} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold tracking-wider shrink-0">
                      •••• •••• ••••
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active & Configured
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Secured & locked. Plain text is hidden.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setTempToken(settings.postex_token || '')
                    setIsEditingToken(true)
                  }}
                  className="h-8 px-3.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200/90 dark:border-slate-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  Change Token
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingRemoveToken(true)}
                  className="h-8 px-3.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Remove PostEx token"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={tempToken}
                onChange={e => {
                  const val = e.target.value
                  setTempToken(val)
                  updateSetting('postex_token', val)
                }}
                placeholder="Paste your PostEx V3 merchant API token..."
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const val = tempToken.trim()
                    if (!val) return
                    setIsEditingToken(false)
                    if (onSave) {
                      await onSave({ postex_token: val })
                    } else {
                      updateSetting('postex_token', val)
                    }
                  }}
                  disabled={!tempToken.trim() || saving}
                  className="h-8.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>{saving ? 'Saving...' : 'Save Token'}</span>
                </button>
                {settings.postex_token && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempToken(settings.postex_token || '')
                      setIsEditingToken(false)
                    }}
                    className="h-8.5 px-3.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={onTestPostEx}
              disabled={testingPostex || !settings.postex_token}
              className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-97 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              {testingPostex ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Testing Connection...
                </span>
              ) : (
                <span>Test PostEx Connection</span>
              )}
            </button>
            {postexPingResult && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                postexPingResult.startsWith('Connected')
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {postexPingResult}
              </span>
            )}
          </div>
        </div>

        {/* Warehouse Configuration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Warehouse Pickup Locations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Default Pickup Warehouse
              </label>
              {addresses.length > 0 ? (
                <select
                  value={settings.postex_pickup || ''}
                  onChange={e => updateSetting('postex_pickup', e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" disabled>Select Pickup Warehouse</option>
                  {addresses.map(a => (
                    <option key={a.addressCode} value={a.addressCode}>
                      {a.cityName} — {a.address} ({a.addressCode})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={settings.postex_pickup || ''}
                  onChange={e => updateSetting('postex_pickup', e.target.value)}
                  placeholder="e.g. malik center, karim block..."
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Return Address Warehouse (Optional)
              </label>
              {addresses.length > 0 ? (
                <select
                  value={settings.postex_return || (settings as any).return_address_code || ''}
                  onChange={e => {
                    const val = e.target.value
                    updateSetting({
                      postex_return: val,
                      return_address_code: val
                    } as any)
                  }}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Same as Pickup Warehouse (Default)</option>
                  {addresses.map(a => (
                    <option key={a.addressCode} value={a.addressCode}>
                      {a.cityName} — {a.address} ({a.addressCode})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={settings.postex_return || (settings as any).return_address_code || ''}
                  onChange={e => {
                    const val = e.target.value
                    updateSetting({
                      postex_return: val,
                      return_address_code: val
                    } as any)
                  }}
                  placeholder="Same as pickup if blank"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Technical Logistics Engine Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 h-fit">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            PostEx V3 Gateway
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Protocol</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-[11px]">REST / JSON V3</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Pickup Locations</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              {loadingAddresses ? 'Syncing...' : `${addresses.length} Active`}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Airway Bill Engine</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Direct Thermal PDF</span>
          </div>
        </div>
      </div>

      {/* 1-Click Warning Confirmation Modal on PostEx Token Removal */}
      {isConfirmingRemoveToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Remove PostEx API Token?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to remove your PostEx V3 merchant token? Order dispatching, airway bills, and live portal sync will be paused until re-configured.
                </p>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium mt-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Admin Record: This token is safely preserved in your Admin audit archive.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmingRemoveToken(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsEditingToken(false)
                  setTempToken('')
                  setIsConfirmingRemoveToken(false)
                  if (onSave) {
                    await onSave({ postex_token: '' })
                  } else {
                    await updateSetting({ postex_token: '' })
                  }
                }}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
              >
                Yes, Remove Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
