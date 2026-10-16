import React, { useState } from 'react'
import { Settings } from '../../utils/groqParser'

interface WhatsAppSettingsTabProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
}

const DEFAULT_TEMPLATE = 'Dear {customer_name}, your order has been booked.\n\nTotal COD: Rs. {order_amount}\nTracking: {portal_link}\n\n{note}'
const DEFAULT_NOTE = 'Meharbani farma kar apna local SIM phone number ON rakhain taake delivery rider asani se rabta kar sake.\n\nReview dejye ga lazmin is number pe or agar 2-5 din mein parcel receive nahi hota to is number pe rabta karna hai. Happy Shopping!'

export const WhatsAppSettingsTab: React.FC<WhatsAppSettingsTabProps> = ({
  settings,
  updateSetting
}) => {
  const [showSavedFeedback, setShowSavedFeedback] = useState(false)
  const currentTemplate = settings.whatsapp_template || DEFAULT_TEMPLATE
  const currentNote = settings.whatsapp_note || DEFAULT_NOTE

  const handleManualSave = () => {
    updateSetting({
      whatsapp_template: currentTemplate,
      whatsapp_note: currentNote
    })
    setShowSavedFeedback(true)
    setTimeout(() => setShowSavedFeedback(false), 2500)
  }

  const handleResetNote = () => {
    updateSetting('whatsapp_note', DEFAULT_NOTE)
    setShowSavedFeedback(true)
    setTimeout(() => setShowSavedFeedback(false), 2500)
  }

  const handleResetTemplate = () => {
    updateSetting({
      whatsapp_template: DEFAULT_TEMPLATE,
      whatsapp_note: DEFAULT_NOTE
    })
    setShowSavedFeedback(true)
    setTimeout(() => setShowSavedFeedback(false), 2500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                WhatsApp Dispatch Alert Template
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Message sent to customers when clicking the WhatsApp tracking button on booked parcels.
              </p>
            </div>
            {showSavedFeedback && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in duration-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Saved to Cloud
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Message Template
              </label>
              <button
                type="button"
                onClick={handleResetTemplate}
                className="text-[10px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition cursor-pointer"
              >
                Reset Template
              </button>
            </div>
            <textarea
              rows={4}
              value={settings.whatsapp_template || DEFAULT_TEMPLATE}
              onChange={e => updateSetting('whatsapp_template', e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
            />
          </div>

          {/* Dynamic Tag Chips */}
          <div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Click to Insert Placeholder Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['{customer_name}', '{order_amount}', '{portal_link}', '{tracking_number}', '{note}'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const current = settings.whatsapp_template || DEFAULT_TEMPLATE
                    updateSetting('whatsapp_template', `${current} ${tag}`)
                  }}
                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-600 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold transition cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Review & SIM Reminder Follow-Up Note */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Customer Follow-Up, SIM Reminder & Review Note ({'{note}'})
              </label>
              <button
                type="button"
                onClick={handleResetNote}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition cursor-pointer"
              >
                Reset to Recommended Note
              </button>
            </div>
            <textarea
              rows={4}
              value={settings.whatsapp_note || DEFAULT_NOTE}
              onChange={e => updateSetting('whatsapp_note', e.target.value)}
              placeholder="e.g. SIM active reminder + Review follow-up..."
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleManualSave}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>Save WhatsApp Alert Settings</span>
            </button>
            {showSavedFeedback && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Settings saved successfully
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Mobile WhatsApp Chat Preview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 h-fit">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Live Customer WhatsApp Preview
        </h4>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-emerald-500/20 text-xs shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
            postex.pk &bull; Tracking Alert
          </span>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-[11px] whitespace-pre-wrap">
            {currentTemplate
              .replace(/{(?:name|customer_name)}/g, 'Fizza Batool')
              .replace(/{(?:amount|order_amount|total)}/g, '2,500')
              .replace(/{(?:tracking|tracking_number)}/g, '22469620000361')
              .replace(/{(?:url|portal_link)}/g, 'https://postex.pk/tracking?cn=22469620000361')
              .replace(/{note}/g, currentNote)}
          </p>
        </div>
      </div>
    </div>
  )
}
