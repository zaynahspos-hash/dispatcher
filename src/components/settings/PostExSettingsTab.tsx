import React, { useState } from 'react'
import { Settings } from '../../utils/groqParser'
import { ExternalLinkIcon } from '../Icons'

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
  onSave?: () => void
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
  saving,
  hasChanges
}) => {
  const [isEditingToken, setIsEditingToken] = useState(false)
  const [tempToken, setTempToken] = useState('')

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
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold tracking-widest">
                    ••••••••••••••••••••••••••••••••
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active & Configured
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Secured & locked. Plain text is hidden for merchant safety.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTempToken(settings.postex_token || '')
                    setIsEditingToken(true)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Change Token
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove your PostEx API Token?')) {
                      updateSetting('postex_token', '')
                      setIsEditingToken(false)
                      setTempToken('')
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                value={tempToken}
                onChange={e => setTempToken(e.target.value)}
                placeholder="Paste your PostEx V3 merchant API token..."
                className="w-full h-9 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSetting('postex_token', tempToken.trim())
                    setIsEditingToken(false)
                  }}
                  disabled={!tempToken.trim()}
                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Save Token
                </button>
                {settings.postex_token && (
                  <button
                    type="button"
                    onClick={() => setIsEditingToken(false)}
                    className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onTestPostEx}
              disabled={testingPostex || !settings.postex_token}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              {testingPostex ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Testing...
                </span>
              ) : (
                <span>Test PostEx Connection</span>
              )}
            </button>
            {postexPingResult && (
              <span className={`text-xs font-bold ${postexPingResult.startsWith('Connected') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
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
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
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
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Return Address Code (Optional)
              </label>
              <input
                value={settings.return_address_code || ''}
                onChange={e => updateSetting('return_address_code', e.target.value)}
                placeholder="Same as pickup if blank"
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
    </div>
  )
}
