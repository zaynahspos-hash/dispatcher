import React, { useState } from 'react'
import { Settings } from '../../utils/groqParser'
import { ExternalLinkIcon, EyeIcon, EyeOffIcon } from '../Icons'

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
}

export const PostExSettingsTab: React.FC<PostExSettingsTabProps> = ({
  settings,
  updateSetting,
  addresses,
  loadingAddresses,
  testingPostex,
  postexPingResult,
  onTestPostEx
}) => {
  const [showToken, setShowToken] = useState(false)

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

          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={settings.postex_token || ''}
              onChange={e => updateSetting('postex_token', e.target.value)}
              placeholder="Paste your PostEx V3 merchant API token..."
              className="w-full h-9 px-3.5 pr-10 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              {showToken ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onTestPostEx}
              disabled={testingPostex || !settings.postex_token}
              className="h-9 px-4 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 active:scale-98 transition disabled:opacity-40 cursor-pointer shadow-xs"
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
