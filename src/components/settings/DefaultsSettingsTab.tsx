import React from 'react'
import { Settings } from '../../utils/groqParser'
import { ORDER_TYPES } from '../ParcelTable'

interface DefaultsSettingsTabProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
}

export const DefaultsSettingsTab: React.FC<DefaultsSettingsTabProps> = ({
  settings,
  updateSetting
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Dispatch & Order Defaults
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Default values automatically applied when generating parcels from raw text or Excel sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={settings.default_weight || '0.5'}
            onChange={e => updateSetting('default_weight', e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Item Count
          </label>
          <input
            type="number"
            value={settings.default_items || '1'}
            onChange={e => updateSetting('default_items', e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Order Type
          </label>
          <select
            value={settings.default_order_type || 'Normal'}
            onChange={e => updateSetting('default_order_type', e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {ORDER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Product Description
          </label>
          <input
            value={settings.default_product || 'Apparel & Goods'}
            onChange={e => updateSetting('default_product', e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Courier Note
          </label>
          <input
            value={settings.default_note || 'Call before delivery'}
            onChange={e => updateSetting('default_note', e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}
