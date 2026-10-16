import React from 'react'
import { Settings } from '../../utils/groqParser'

interface WhatsAppSettingsTabProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
}

export const WhatsAppSettingsTab: React.FC<WhatsAppSettingsTabProps> = ({
  settings,
  updateSetting
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              WhatsApp Dispatch Alert Template
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Message sent to customers when you click the WhatsApp link button on booked parcels.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Message Template
            </label>
            <textarea
              rows={4}
              value={settings.whatsapp_template || 'Dear {customer_name}, your parcel of Rs. {order_amount} has been booked via PostEx! Tracking number: {tracking_number}. Track here: {portal_link}'}
              onChange={e => updateSetting('whatsapp_template', e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dynamic Tag Chips */}
          <div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Click to Insert Placeholder Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['{customer_name}', '{tracking_number}', '{order_amount}', '{portal_link}'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const current = settings.whatsapp_template || ''
                    updateSetting('whatsapp_template', `${current} ${tag}`)
                  }}
                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-600 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold transition cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Mobile WhatsApp Chat Preview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 h-fit">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Live Customer Preview
        </h4>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-emerald-500/20 text-xs shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
            Zaynahs Logistics
          </span>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-[11px]">
            {(settings.whatsapp_template || 'Dear {customer_name}, your parcel of Rs. {order_amount} has been booked via PostEx! Tracking number: {tracking_number}.')
              .replace('{customer_name}', 'Ahmed Khan')
              .replace('{order_amount}', '3,200')
              .replace('{tracking_number}', '26262800000748')
              .replace('{portal_link}', 'https://postex.pk')}
          </p>
        </div>
      </div>
    </div>
  )
}
