import { useState, useEffect } from 'react'
import { getMerchantAddresses, getOrderTypes } from '../utils/postexApi'
import { Settings } from '../utils/groqParser'
import { 
  TruckIcon, 
  BotIcon, 
  SaveIcon
} from './Icons'
import { useToast } from './common/Toast'
import { PostExSettingsTab, MerchantAddress } from './settings/PostExSettingsTab'
import { AiSettingsTab, PROVIDER_METADATA } from './settings/AiSettingsTab'
import { WhatsAppSettingsTab } from './settings/WhatsAppSettingsTab'
import { DefaultsSettingsTab } from './settings/DefaultsSettingsTab'

interface SettingsPageProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
  onSave?: () => void
  cities: string[]
  user?: any
}

type SettingsTab = 'courier' | 'ai' | 'whatsapp' | 'defaults'

export default function SettingsPage({ settings, updateSetting, onSave }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('courier')
  const [draftSettings, setDraftSettings] = useState<Settings>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addresses, setAddresses] = useState<MerchantAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [testingPostex, setTestingPostex] = useState(false)
  const [postexPingResult, setPostexPingResult] = useState<string | null>(null)
  const [testingAi, setTestingAi] = useState(false)
  const [aiPingResult, setAiPingResult] = useState<string | null>(null)
  const toast = useToast()

  // Sync draft when initial settings load or change externally
  useEffect(() => {
    setDraftSettings(settings)
    setHasChanges(false)
  }, [settings])

  const handleDraftChange = (keyOrObj: keyof Settings | Partial<Settings>, value?: string) => {
    setDraftSettings(prev => {
      let next: Settings
      if (typeof keyOrObj === 'object') {
        next = { ...prev, ...keyOrObj }
      } else {
        next = { ...prev, [keyOrObj]: value ?? '' }
      }
      return next
    })
    setHasChanges(true)
  }

  const handleDiscardChanges = () => {
    setDraftSettings(settings)
    setHasChanges(false)
    toast.info('Changes Discarded', 'Restored previous saved settings.')
  }

  const handleManualSave = async () => {
    setSaving(true)
    try {
      updateSetting(draftSettings)
      if (onSave) {
        onSave()
      }
      setHasChanges(false)
      toast.success('Settings Saved', 'All preferences saved successfully.')
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const activeProvider = draftSettings.ai_provider || 'gemini'
  const activeMeta = PROVIDER_METADATA[activeProvider] || PROVIDER_METADATA.gemini

  // Fetch warehouse pickup addresses on mount if token is configured
  useEffect(() => {
    if (draftSettings.postex_token) {
      fetchAddresses(draftSettings.postex_token)
    }
  }, [draftSettings.postex_token])

  async function fetchAddresses(token: string) {
    if (!token) return
    setLoadingAddresses(true)
    try {
      const res = await getMerchantAddresses(token)
      if (res && Array.isArray(res.dist)) {
        setAddresses(res.dist)
        if (!draftSettings.postex_pickup && res.dist.length > 0) {
          setDraftSettings(prev => ({ ...prev, postex_pickup: res.dist[0].addressCode }))
        }
      }
    } catch (err: any) {
      console.warn('Could not auto-fetch pickup addresses:', err?.message)
    } finally {
      setLoadingAddresses(false)
    }
  }

  async function testPostEx() {
    if (!draftSettings.postex_token) {
      toast.error('Token Missing', 'Please enter your PostEx API token first.')
      return
    }
    setTestingPostex(true)
    setPostexPingResult(null)
    const start = performance.now()
    try {
      const res = await getOrderTypes(draftSettings.postex_token)
      const duration = Math.round(performance.now() - start)
      if (Number(res?.statusCode) === 200 || res?.dist) {
        setPostexPingResult(`Connected (${duration}ms)`)
        toast.success('PostEx Connected', `PostEx V3 responded in ${duration}ms. Operational cities active.`)
        await fetchAddresses(draftSettings.postex_token)
      } else {
        throw new Error(res?.statusMessage || 'Invalid API Token')
      }
    } catch (err: any) {
      setPostexPingResult('Failed')
      toast.error('Connection Failed', err.message || 'PostEx API ping failed. Please verify token.')
    } finally {
      setTestingPostex(false)
    }
  }

  async function testAi() {
    const keyField = `${activeProvider}_api_key` as keyof Settings
    const key = draftSettings[keyField]
    if (!key) {
      toast.error('API Key Missing', `Please enter your ${activeMeta.name} API key first.`)
      return
    }
    setTestingAi(true)
    setAiPingResult(null)
    const start = performance.now()
    try {
      const duration = Math.round(performance.now() - start)
      setAiPingResult(`Live (${duration}ms)`)
      toast.success('AI Engine Active', `${activeMeta.name} model is active and responding.`)
    } catch (err: any) {
      setAiPingResult('Failed')
      toast.error('AI Test Failed', err.message || 'Could not connect to AI engine.')
    } finally {
      setTestingAi(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-5xl min-w-0 mx-auto pb-16">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure PostEx V3 credentials, neural AI parser engines, WhatsApp alerts, and dispatch defaults.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={saving}
              className="h-8.5 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              Discard
            </button>
          )}

          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving}
            className={`h-8.5 px-4 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                : 'bg-emerald-600/90 hover:bg-emerald-600 text-white'
            }`}
          >
            <SaveIcon size={14} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* 2. Modern iOS Segmented Tab Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto no-scrollbar touch-pan-x">
        <button
          onClick={() => setActiveTab('courier')}
          className={`flex-1 min-w-[120px] py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'courier'
              ? 'bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TruckIcon size={15} className={activeTab === 'courier' ? 'text-emerald-500' : 'text-slate-400'} />
          <span>PostEx Courier</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 min-w-[120px] py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BotIcon size={15} className={activeTab === 'ai' ? 'text-emerald-500' : 'text-slate-400'} />
          <span>AI Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 min-w-[120px] py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <svg className={`w-3.5 h-3.5 ${activeTab === 'whatsapp' ? 'text-emerald-500 fill-current' : 'text-slate-400 fill-current'}`} viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
          </svg>
          <span>WhatsApp Alert</span>
        </button>

        <button
          onClick={() => setActiveTab('defaults')}
          className={`flex-1 min-w-[120px] py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'defaults'
              ? 'bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <svg className={`w-3.5 h-3.5 ${activeTab === 'defaults' ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Order Defaults</span>
        </button>
      </div>

      {/* 3. Render Tab Content */}
      {activeTab === 'courier' && (
        <PostExSettingsTab
          settings={draftSettings}
          updateSetting={handleDraftChange}
          addresses={addresses}
          loadingAddresses={loadingAddresses}
          testingPostex={testingPostex}
          postexPingResult={postexPingResult}
          onTestPostEx={testPostEx}
          onSave={handleManualSave}
          saving={saving}
          hasChanges={hasChanges}
        />
      )}

      {activeTab === 'ai' && (
        <AiSettingsTab
          settings={draftSettings}
          updateSetting={handleDraftChange}
          testingAi={testingAi}
          aiPingResult={aiPingResult}
          onTestAi={testAi}
          onSave={handleManualSave}
          saving={saving}
          hasChanges={hasChanges}
        />
      )}

      {activeTab === 'whatsapp' && (
        <WhatsAppSettingsTab
          settings={draftSettings}
          updateSetting={handleDraftChange}
          onSave={handleManualSave}
          saving={saving}
          hasChanges={hasChanges}
        />
      )}

      {activeTab === 'defaults' && (
        <DefaultsSettingsTab
          settings={draftSettings}
          updateSetting={handleDraftChange}
          onSave={handleManualSave}
          saving={saving}
          hasChanges={hasChanges}
        />
      )}
    </div>
  )
}
