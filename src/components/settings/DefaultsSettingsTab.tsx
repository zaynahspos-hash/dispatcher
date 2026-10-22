import React from 'react'
import { Settings } from '../../utils/aiParser'
import { ORDER_TYPES } from '../ParcelTable'
import { SaveIcon } from '../Icons'

interface DefaultsSettingsTabProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
  onSave?: () => void
  saving?: boolean
  hasChanges?: boolean
}

export const DefaultsSettingsTab: React.FC<DefaultsSettingsTabProps> = ({
  settings,
  updateSetting,
  onSave,
  saving = false,
  hasChanges = false
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
            className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Default Item Count
            </label>
            <span
              className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded cursor-help"
              title="Applied only when item pieces count is omitted in order details. Preserved if specified in text."
            >
              Fallback
            </span>
          </div>
          <input
            type="number"
            min="1"
            value={settings.default_items || '1'}
            onChange={e => updateSetting('default_items', e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Applied automatically when item pieces count is omitted in pasted order details. If text specifies quantity, it is preserved.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Order Type
          </label>
          <select
            value={settings.default_order_type || 'Normal'}
            onChange={e => updateSetting('default_order_type', e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer transition"
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
            value={settings.default_product !== undefined ? settings.default_product : 'Kids Clothes'}
            onChange={e => updateSetting('default_product', e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Courier Note
          </label>
          <input
            value={settings.default_note || 'Call before delivery'}
            onChange={e => updateSetting('default_note', e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Auto-Serial Order ID Fallback Section */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Auto-Serial Order ID (Fallback)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Auto-increments when order ID is omitted in chat text. If an order ID already exists in text, it is preserved.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Order ID Prefix
            </label>
            <input
              type="text"
              placeholder="e.g. Ord-, tv-, ZN-"
              value={settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'Ord-'}
              onChange={e => updateSetting('order_id_prefix', e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Next Serial Number
            </label>
            <input
              type="number"
              placeholder="e.g. 1001 or 12345"
              value={settings.order_id_next_num || '1001'}
              onChange={e => updateSetting('order_id_next_num', e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono transition"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Auto-assigns and increments serial order ID when omitted in chat text. If an order ID exists in text, it is preserved.
            </p>
          </div>
        </div>

        {/* Live Fallback Preview */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Next Generated Fallback ID:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            {(settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'Ord-')}{(settings.order_id_next_num || '1001')}
          </span>
        </div>

        {/* Save Defaults Action Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">
            {hasChanges ? 'Unsaved changes in defaults' : 'All defaults are in sync'}
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={`h-9 px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
              hasChanges 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                : 'bg-emerald-600/90 hover:bg-emerald-600 text-white'
            }`}
          >
            <SaveIcon size={14} />
            <span>{saving ? 'Saving...' : 'Save Order Defaults'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
