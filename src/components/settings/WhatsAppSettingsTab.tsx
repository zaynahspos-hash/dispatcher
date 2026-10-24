import React, { useState } from 'react'
import { Settings } from '../../utils/aiParser'
import { WhatsAppMilestone, DEFAULT_MILESTONE_TEMPLATES, isCorruptText } from '../history/types'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'
import { SaveIcon } from '../Icons'

interface WhatsAppSettingsTabProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: any) => void
  onSave?: () => void
  saving?: boolean
  hasChanges?: boolean
}

const DEFAULT_NOTE = 'Meharbani farma kar apna local SIM phone number ON rakhain 📱🔔 taake delivery rider asani se rabta kar sake 🚚💨\n\nReview dejye ga lazmi is number pe ⭐📝 aur agar 2-5 din mein parcel receive nahi hota ⏳ to is number pe rabta karna hai 📞\n\nHappy Shopping! 🛍️😊🎉'

export const WhatsAppSettingsTab: React.FC<WhatsAppSettingsTabProps> = ({
  settings,
  updateSetting,
  onSave,
  saving = false,
  hasChanges = false
}) => {
  const [activeMilestoneTab, setActiveMilestoneTab] = useState<WhatsAppMilestone>('out_for_delivery')

  const getTemplateForMilestone = (ms: WhatsAppMilestone): string => {
    let t = ''
    if (ms === 'booking') t = settings.whatsapp_template_booking || settings.whatsapp_template || ''
    else if (ms === 'out_for_delivery') t = settings.whatsapp_template_out_for_delivery || ''
    else if (ms === 'action_required') t = settings.whatsapp_template_action_required || ''
    else if (ms === 'delivered') t = settings.whatsapp_template_delivered || ''
    
    if (!t || isCorruptText(t)) return DEFAULT_MILESTONE_TEMPLATES[ms] || DEFAULT_MILESTONE_TEMPLATES.booking
    return t
  }

  const setTemplateForMilestone = (ms: WhatsAppMilestone, text: string) => {
    if (ms === 'booking') updateSetting({ whatsapp_template_booking: text, whatsapp_template: text })
    else if (ms === 'out_for_delivery') updateSetting('whatsapp_template_out_for_delivery', text)
    else if (ms === 'action_required') updateSetting('whatsapp_template_action_required', text)
    else if (ms === 'delivered') updateSetting('whatsapp_template_delivered', text)
  }

  const handleResetCurrentTemplate = () => {
    const def = DEFAULT_MILESTONE_TEMPLATES[activeMilestoneTab]
    setTemplateForMilestone(activeMilestoneTab, def)
  }

  const currentTemplate = getTemplateForMilestone(activeMilestoneTab)
  const currentNote = (!settings.whatsapp_note || isCorruptText(settings.whatsapp_note)) ? DEFAULT_NOTE : settings.whatsapp_note

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        {/* Milestone Dispatch Toggles Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Selective WhatsApp Alert Automation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose which operational courier milestones trigger automated customer notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Out for Delivery Toggle */}
            {(() => {
              const isEnabled = settings.whatsapp_enable_out_for_delivery_alert !== false
              return (
                <label className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isEnabled 
                    ? 'border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]' 
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Out for Delivery</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Cuts Returns 40%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Alerts customer when rider leaves hub with package.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={e => updateSetting('whatsapp_enable_out_for_delivery_alert', e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 accent-emerald-600 cursor-pointer"
                  />
                </label>
              )
            })()}

            {/* Action Required Toggle */}
            {(() => {
              const isEnabled = settings.whatsapp_enable_action_required_alert !== false
              return (
                <label className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isEnabled 
                    ? 'border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]' 
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Action Required</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Delivery Issue
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Alerts customer on failed attempt or unreachable phone.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={e => updateSetting('whatsapp_enable_action_required_alert', e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 accent-emerald-600 cursor-pointer"
                  />
                </label>
              )
            })()}
          </div>
        </div>

        {/* Milestone Template Editor Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Message Templates by Milestone
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize the copy dispatched for each specific delivery milestone.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetCurrentTemplate}
              className="text-[10px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition cursor-pointer self-start sm:self-auto"
            >
              Reset Current Template
            </button>
          </div>

          {/* Milestone Tabs */}
          <ScrollableChipsBar
            containerClassName="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar pb-1"
          >
            {[
              { id: 'out_for_delivery', label: 'Out for Delivery' },
              { id: 'action_required', label: 'Action Required' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMilestoneTab(tab.id as WhatsAppMilestone)}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeMilestoneTab === tab.id
                    ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 border border-slate-900 dark:border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </ScrollableChipsBar>

          <div>
            <textarea
              rows={5}
              value={currentTemplate}
              onChange={e => setTemplateForMilestone(activeMilestoneTab, e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono leading-relaxed transition"
            />
          </div>

          {/* Placeholder Tags */}
          <div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Click to Insert Placeholder Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['{customer_name}', '{order_amount}', '{portal_link}', '{tracking_number}', '{city}', '{items}', '{note}'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setTemplateForMilestone(activeMilestoneTab, `${currentTemplate} ${tag}`)
                  }}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-medium transition-all active:scale-95 cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* SIM Reminder / Follow-up Note */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Default Review & SIM Reminder Note ({'{note}'})
              </label>
              <button
                type="button"
                onClick={() => updateSetting('whatsapp_note', DEFAULT_NOTE)}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition cursor-pointer"
              >
                Reset Note
              </button>
            </div>
            <textarea
              rows={3}
              value={currentNote}
              onChange={e => updateSetting('whatsapp_note', e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Save WhatsApp Settings Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              {hasChanges ? 'Unsaved changes in WhatsApp alerts' : 'WhatsApp templates are in sync'}
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
              <span>{saving ? 'Saving...' : 'Save WhatsApp Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Column */}
      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 sticky top-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Live Preview
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 uppercase font-mono">
              {activeMilestoneTab.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-emerald-500/20 text-xs shadow-2xs space-y-2">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block pb-1 border-b border-emerald-500/10">
              WhatsApp Outgoing Message
            </span>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-[11px] whitespace-pre-wrap font-sans">
              {currentTemplate
                .replace(/{(?:name|customer_name)}/g, 'Fizza Batool')
                .replace(/{(?:amount|order_amount|total)}/g, '2,500')
                .replace(/{(?:tracking|tracking_number)}/g, '22469620000361')
                .replace(/{(?:url|portal_link)}/g, 'https://postex.pk/tracking?cn=22469620000361')
                .replace(/{city}/g, 'Lahore')
                .replace(/{items}/g, '2')
                .replace(/{note}/g, currentNote)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
