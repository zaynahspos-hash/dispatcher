import React, { useState } from 'react'
import { Settings } from '../../utils/aiParser'
import { isCorruptText } from '../history/types'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'
import { SaveIcon, WhatsAppIcon, ShieldCheckIcon, ClockIcon, PackageIcon, TruckIcon } from '../Icons'
import { DEFAULT_WHATSAPP_VARIANTS, WhatsAppTemplateCategory } from '../../utils/whatsappTemplates'

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
  // Category tab: 'greeting' | 'booking' | 'status'
  const [activeCategory, setActiveCategory] = useState<WhatsAppTemplateCategory>('greeting')

  // Variant index within the active category: 0, 1, 2, 3
  const [activeVariantIdx, setActiveVariantIdx] = useState<number>(0)

  // WhatsApp client target
  const [waClientTarget, setWaClientTarget] = useState<'web' | 'app'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred_wa_client')
      if (saved === 'app' || saved === 'web') return saved
    }
    return settings.whatsapp_client_target === 'app' ? 'app' : 'web'
  })

  const handleClientTargetChange = (target: 'web' | 'app') => {
    setWaClientTarget(target)
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_wa_client', target)
    }
    updateSetting('whatsapp_client_target', target)
  }

  // Anti-Ban Delay
  const currentAntibanDelay = settings.whatsapp_antiban_delay_sec || 120

  const handleAntibanDelayChange = (sec: number) => {
    updateSetting('whatsapp_antiban_delay_sec', sec)
  }

  // Get current variant array for category
  const getVariantsForCategory = (cat: WhatsAppTemplateCategory): string[] => {
    if (cat === 'greeting') {
      if (Array.isArray(settings.whatsapp_greeting_variants) && settings.whatsapp_greeting_variants.length > 0) {
        return settings.whatsapp_greeting_variants
      }
      return DEFAULT_WHATSAPP_VARIANTS.greeting
    }
    if (cat === 'booking') {
      if (Array.isArray(settings.whatsapp_booking_variants) && settings.whatsapp_booking_variants.length > 0) {
        return settings.whatsapp_booking_variants
      }
      return DEFAULT_WHATSAPP_VARIANTS.booking
    }
    if (cat === 'status') {
      if (Array.isArray(settings.whatsapp_status_variants) && settings.whatsapp_status_variants.length > 0) {
        return settings.whatsapp_status_variants
      }
      return DEFAULT_WHATSAPP_VARIANTS.status
    }
    return DEFAULT_WHATSAPP_VARIANTS.greeting
  }

  const currentVariants = getVariantsForCategory(activeCategory)
  const currentTemplateText = currentVariants[activeVariantIdx] || currentVariants[0] || ''

  const handleUpdateCurrentVariant = (newText: string) => {
    const updated = [...currentVariants]
    updated[activeVariantIdx] = newText

    if (activeCategory === 'greeting') {
      updateSetting({
        whatsapp_greeting_variants: updated,
        whatsapp_template_greeting: activeVariantIdx === 0 ? newText : settings.whatsapp_template_greeting
      })
    } else if (activeCategory === 'booking') {
      updateSetting({
        whatsapp_booking_variants: updated,
        whatsapp_template_booking: activeVariantIdx === 0 ? newText : settings.whatsapp_template_booking,
        whatsapp_template: activeVariantIdx === 0 ? newText : settings.whatsapp_template
      })
    } else if (activeCategory === 'status') {
      updateSetting({
        whatsapp_status_variants: updated
      })
    }
  }

  const handleResetCurrentVariant = () => {
    const defaultList = DEFAULT_WHATSAPP_VARIANTS[activeCategory]
    const defText = defaultList[activeVariantIdx] || defaultList[0]
    handleUpdateCurrentVariant(defText)
  }

  const handleResetAllVariants = () => {
    const defaultList = DEFAULT_WHATSAPP_VARIANTS[activeCategory]
    if (activeCategory === 'greeting') {
      updateSetting({
        whatsapp_greeting_variants: defaultList,
        whatsapp_template_greeting: defaultList[0]
      })
    } else if (activeCategory === 'booking') {
      updateSetting({
        whatsapp_booking_variants: defaultList,
        whatsapp_template_booking: defaultList[0],
        whatsapp_template: defaultList[0]
      })
    } else if (activeCategory === 'status') {
      updateSetting({
        whatsapp_status_variants: defaultList
      })
    }
  }

  const currentNote = (!settings.whatsapp_note || isCorruptText(settings.whatsapp_note)) ? DEFAULT_NOTE : settings.whatsapp_note

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        
        {/* Anti-Ban 100% Protection & Cooldown Settings Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShieldCheckIcon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  100% Anti-Ban Protection Engine
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated variant rotation, name personalization, and safe pacing delay.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              Safe Guard
            </span>
          </div>

          {/* Cooling Delay Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ClockIcon size={13} className="text-slate-400" />
                <span>Safe Delay Between Dispatches</span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {currentAntibanDelay}s ({Math.round(currentAntibanDelay / 60)} min)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { sec: 60, label: '1 Min (60s)', desc: 'Fast' },
                { sec: 90, label: '1.5 Min (90s)', desc: 'Balanced' },
                { sec: 120, label: '2 Min (120s)', desc: 'Recommended' }
              ].map(item => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => handleAntibanDelayChange(item.sec)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    currentAntibanDelay === item.sec
                      ? 'border-emerald-500/50 bg-emerald-500/[0.05] ring-1 ring-emerald-500/30'
                      : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {item.label}
                  </span>
                  <span className={`text-[10px] block mt-0.5 font-medium ${
                    currentAntibanDelay === item.sec ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'
                  }`}>
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Research Best Practices Note */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white block">
              Official WhatsApp Safety Guidelines:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400 text-[10.5px]">
              <li>Daily Volume: Send 50–100 messages/day initially on active numbers; 20–50 for new SIMs.</li>
              <li>Auto-Rotating Variants: 4 varied messages rotate 1-by-1 so Meta spam filters never detect duplicates.</li>
              <li>Customer Name & Honorific: Dynamic insertion of Sir, Ma'am, or Mohtaram establishes genuine 1-to-1 conversation.</li>
              <li>Number Save Request: Asking customer to save number and reply "OK" raises phone reputation score.</li>
            </ul>
          </div>
        </div>

        {/* WhatsApp Opening Mode Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              WhatsApp Opening Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control how customer chat links open when clicked from Results or History.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleClientTargetChange('web')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                waClientTarget === 'web'
                  ? 'border-emerald-500/40 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <WhatsAppIcon size={16} className="fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Web (Single Tab)</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Reuses your current WhatsApp tab. Zero duplicate tabs and eliminates "WhatsApp is open in another window" alerts.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleClientTargetChange('app')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                waClientTarget === 'app'
                  ? 'border-emerald-500/40 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <WhatsAppIcon size={16} className="fill-current" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Desktop App (Native)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Opens directly in the installed Mac/Windows WhatsApp desktop app with zero browser tabs.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 3 Core Template Categories Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Message Templates & Variants
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize 4 rotating variants for each template to avoid repetitive text triggers.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleResetCurrentVariant}
                className="text-[10px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition cursor-pointer"
              >
                Reset Variant
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={handleResetAllVariants}
                className="text-[10px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition cursor-pointer"
              >
                Reset All 4
              </button>
            </div>
          </div>

          {/* 3 Core Category Tabs */}
          <ScrollableChipsBar
            containerClassName="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar pb-1"
          >
            {[
              { id: 'greeting', label: '1. Greeting & Verification (Fresh Contact)', icon: WhatsAppIcon },
              { id: 'booking', label: '2. Booking Confirmation', icon: PackageIcon },
              { id: 'status', label: '3. Live Status Alert', icon: TruckIcon }
            ].map(tab => {
              const Icon = tab.icon
              const isActive = activeCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(tab.id as WhatsAppTemplateCategory)
                    setActiveVariantIdx(0)
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 border border-slate-900 dark:border-emerald-500/30 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </ScrollableChipsBar>

          {/* Variant Selector Tabs */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Rotating Variations:
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map(idx => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveVariantIdx(idx)}
                  className={`h-7 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeVariantIdx === idx
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  Variant {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Variant Template Textarea */}
          <div>
            <textarea
              rows={7}
              value={currentTemplateText}
              onChange={e => handleUpdateCurrentVariant(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono leading-relaxed transition"
            />
          </div>

          {/* Placeholder Tags Insertion */}
          <div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Click to Insert Smart Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                '{honorific_name}',
                '{customer_name}',
                '{greeting}',
                '{title}',
                '{order_amount}',
                '{portal_link}',
                '{tracking_number}',
                '{city}',
                '{live_status}',
                '{items}',
                '{note}'
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    handleUpdateCurrentVariant(`${currentTemplateText} ${tag}`)
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-medium transition-all active:scale-95 cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
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
              {hasChanges ? 'Unsaved changes in WhatsApp configuration' : 'All templates and anti-ban settings saved in database'}
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
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase font-mono">
              {activeCategory} • Var {activeVariantIdx + 1}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-emerald-500/20 text-xs shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                WhatsApp Outgoing Message
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Sample Customer
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-[11px] whitespace-pre-wrap font-sans">
              {currentTemplateText
                .replace(/{(?:honorific_name)}/gi, 'Javeria Khan Ma\'am')
                .replace(/{(?:greeting)}/gi, 'Assalam o Alaikum')
                .replace(/{(?:title|honorific)}/gi, 'Ma\'am')
                .replace(/{(?:name|customer_name)}/gi, 'Javeria Khan')
                .replace(/{(?:amount|order_amount|total)}/gi, '14,149')
                .replace(/{(?:tracking|tracking_number|cn)}/gi, '27261150101077')
                .replace(/{(?:url|portal_link)}/gi, 'https://postex.pk/tracking?cn=27261150101077')
                .replace(/{city}/gi, 'Mingora')
                .replace(/{(?:status|live_status)}/gi, 'In Transit')
                .replace(/{items}/gi, '3')
                .replace(/{note}/gi, currentNote)}
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-[10.5px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Target Customer:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Female (Ma'am)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Anti-Ban Rotation:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">4 Active Variants</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Safe Cooldown:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{currentAntibanDelay}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
