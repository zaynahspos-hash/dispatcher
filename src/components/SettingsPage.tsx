import React, { useState, useEffect } from 'react'
import { getMerchantAddresses, getOrderTypes } from '../utils/postexApi'
import { Settings } from '../utils/groqParser'
import { 
  SettingsIcon, 
  SyncIcon, 
  EyeIcon, 
  EyeOffIcon, 
  TruckIcon, 
  BotIcon, 
  LockIcon, 
  CheckIcon, 
  PlugIcon, 
  ExternalLinkIcon,
  AlertTriangleIcon,
  SaveIcon
} from './Icons'
import { SearchableDropdown } from './SearchableDropdown'
import { supabase } from '../utils/supabaseClient'
import { useToast } from './common/Toast'
import { UserAvatar } from './common/UserAvatar'

interface MerchantAddress {
  addressCode: string
  address: string
  cityName: string
  addressType: string
}

interface SettingsPageProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
  onSave?: () => void
  cities: string[]
  user?: any
}

type SettingsTab = 'courier' | 'ai' | 'security'

const PROVIDER_METADATA: Record<string, {
  name: string
  keyUrl: string
  keyLabel: string
  defaultModel: string
  models: string[]
  badge: string
}> = {
  groq: {
    name: 'Groq AI (Ultra Fast)',
    keyUrl: 'https://console.groq.com/keys',
    keyLabel: 'Get Free Groq API Key',
    defaultModel: 'llama-3.1-8b-instant',
    models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
    badge: 'Latency < 600ms'
  },
  gemini: {
    name: 'Google Gemini (Free Quota)',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyLabel: 'Get Free Gemini Key (1,500 req/day)',
    defaultModel: 'gemini-3-flash-preview',
    models: ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'],
    badge: '1,500 Free Req/Day'
  },
  openai: {
    name: 'OpenAI (GPT-4o)',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyLabel: 'Get OpenAI API Key',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    badge: 'High Reasoning'
  },
  anthropic: {
    name: 'Anthropic (Claude 3.5)',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyLabel: 'Get Anthropic API Key',
    defaultModel: 'claude-3-5-haiku-latest',
    models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
    badge: 'Claude 3.5'
  },
  deepseek: {
    name: 'DeepSeek (V3 / R1)',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    keyLabel: 'Get DeepSeek API Key',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    badge: 'V3 / R1 Engine'
  },
  openrouter: {
    name: 'OpenRouter (Unified)',
    keyUrl: 'https://openrouter.ai/keys',
    keyLabel: 'Get OpenRouter API Key',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    models: ['meta-llama/llama-3.1-8b-instruct:free', 'google/gemini-2.0-flash-exp:free'],
    badge: 'Unified Multi-Model'
  }
}

export default function SettingsPage({ settings, updateSetting, onSave, cities, user }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('courier')
  const [addresses, setAddresses] = useState<MerchantAddress[]>([])
  const [orderTypes, setOrderTypes] = useState<string[]>([])
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testingAi, setTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null)
  const [showPostexToken, setShowPostexToken] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const toast = useToast()

  // Derived state
  const activeProvider = (settings.ai_provider || 'gemini') as keyof typeof PROVIDER_METADATA
  const activeModelField = `${activeProvider}_model` as keyof Settings
  const activeKeyField = `${activeProvider}_api_key` as keyof Settings
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const pickupAddresses = addresses.filter(a => a.addressType !== 'Return Address')
  const returnAddresses = addresses.filter(a => a.addressType === 'Return Address')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  // Load addresses when PostEx token exists
  useEffect(() => {
    if (settings.postex_token) {
      getMerchantAddresses(settings.postex_token)
        .then(res => {
          if ((res.statusCode == 200 || res.statusCode == '0200') && res.dist) {
            setAddresses(res.dist)
            const pickupAddrs = res.dist.filter((a: MerchantAddress) => a.addressType !== 'Return Address')
            const updates: Partial<Settings> = {}
            if (pickupAddrs.length > 0 && !settings.postex_pickup) {
              const defaultPickup = pickupAddrs[0]
              updates.postex_pickup = defaultPickup.addressCode
              updates.postex_pickup_address = `${defaultPickup.address} — ${defaultPickup.cityName}`
            }
            if (Object.keys(updates).length > 0) {
              updateSetting(updates)
            }
          }
        })
        .catch(() => {})

      getOrderTypes(settings.postex_token)
        .then(res => {
          if ((res.statusCode == 200 || res.statusCode == '0200') && res.dist) {
            setOrderTypes(res.dist.map((d: any) => d.orderType || d))
          }
        })
        .catch(() => {})
    }
  }, [settings.postex_token])

  async function handleTestConnection() {
    if (!settings.postex_token) {
      toast.warning('Token Missing', 'Please enter your PostEx Merchant Token first.')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await getMerchantAddresses(settings.postex_token)
      if ((res.statusCode == 200 || res.statusCode == '0200') && res.dist) {
        setAddresses(res.dist)
        setTestResult({ ok: true, message: `Connected! Found ${res.dist.length} registered addresses.` })
        toast.success('PostEx V3 Connected', `Successfully verified token and loaded ${res.dist.length} pickup addresses.`)
      } else {
        const msg = res.statusMessage || 'Invalid token or unauthorized by PostEx.'
        setTestResult({ ok: false, message: msg })
        toast.error('PostEx Error', msg)
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Connection failed' })
      toast.error('Connection Failed', err.message || 'Network error reaching PostEx API.')
    } finally {
      setTesting(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')
    try {
      if (!user?.email) throw new Error('Session not found. Please log in again.')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (signInError) throw new Error('Current password is incorrect.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setPwSuccess('Password updated successfully!')
      toast.success('Password Updated', 'Your account credentials have been securely refreshed.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password.')
      toast.error('Password Update Failed', err.message)
    } finally {
      setPwLoading(false)
    }
  }

  async function handleTestAiConnection() {
    const rawKeys = String(settings[activeKeyField] || '').trim()
    const firstKey = rawKeys.split(/[\n,]+/)[0]?.trim()
    if (!firstKey) {
      toast.warning('API Key Missing', `Please enter your ${activeProvider.toUpperCase()} API key first.`)
      return
    }

    setTestingAi(true)
    setAiTestResult(null)
    const startTime = Date.now()

    try {
      if (activeProvider === 'gemini') {
        let model = String(settings.gemini_model || 'gemini-3-flash-preview').trim()
        if (!model || model.includes('2.0') || model.includes('1.5') || model.includes('1.0') || model === 'custom') {
          model = 'gemini-3-flash-preview'
        }
        const generationConfig: any = {
          responseMimeType: 'application/json'
        }
        if (model.startsWith('gemini-') && !model.includes('lite')) {
          generationConfig.thinkingConfig = { thinkingBudget: 0 }
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${firstKey}`
        let res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with valid JSON: {"status":"ok"}' }] }],
            generationConfig
          })
        })

        // Auto fallback if model discontinued or 404
        if (!res.ok) {
          const err = await res.clone().json().catch(() => ({}))
          const errMsg = err?.error?.message || ''
          if (errMsg.includes('no longer available') || errMsg.includes('not found') || res.status === 404) {
            model = 'gemini-3-flash-preview'
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${firstKey}`
            res = await fetch(fallbackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Respond with valid JSON: {"status":"ok"}' }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  thinkingConfig: { thinkingBudget: 0 }
                }
              })
            })
            updateSetting('gemini_model', 'gemini-3-flash-preview')
          }
        }

        const latency = Date.now() - startTime
        if (res.ok) {
          setAiTestResult({ ok: true, message: `Connected! Google Gemini responded in ${latency}ms (${model}).`, latency })
          toast.success('Gemini AI Connected', `Valid Key (${model}) • ${latency}ms`)
        } else {
          const err = await res.json().catch(() => ({}))
          const msg = err?.error?.message || `Google API Error: HTTP ${res.status}`
          setAiTestResult({ ok: false, message: msg })
          toast.error('Gemini Test Failed', msg)
        }
      } else if (activeProvider === 'groq') {
        const model = String(settings.groq_model || 'llama-3.1-8b-instant').trim()
        const url = 'https://api.groq.com/openai/v1/chat/completions'
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firstKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          })
        })
        const latency = Date.now() - startTime
        if (res.ok) {
          setAiTestResult({ ok: true, message: `Connected! Groq AI responded in ${latency}ms.`, latency })
          toast.success('Groq AI Connected', `Valid Key (${model}) • ${latency}ms`)
        } else {
          const err = await res.json().catch(() => ({}))
          const msg = err?.error?.message || `Groq API Error: HTTP ${res.status}`
          setAiTestResult({ ok: false, message: msg })
          toast.error('Groq Test Failed', msg)
        }
      } else {
        const endpoints: Record<string, string> = {
          openai: 'https://api.openai.com/v1/chat/completions',
          openrouter: 'https://openrouter.ai/api/v1/chat/completions',
          deepseek: 'https://api.deepseek.com/chat/completions',
          kimi: 'https://api.moonshot.cn/v1/chat/completions',
          mistral: 'https://api.mistral.ai/v1/chat/completions'
        }
        const testUrl = endpoints[activeProvider] || 'https://api.openai.com/v1/chat/completions'
        const model = String(settings[activeModelField] || 'gpt-4o-mini').trim()
        const res = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firstKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          })
        })
        const latency = Date.now() - startTime
        if (res.ok) {
          setAiTestResult({ ok: true, message: `Connected! ${activeProvider.toUpperCase()} responded in ${latency}ms.`, latency })
          toast.success(`${activeProvider.toUpperCase()} Connected`, `${latency}ms`)
        } else {
          const err = await res.json().catch(() => ({}))
          const msg = err?.error?.message || `API Error: HTTP ${res.status}`
          setAiTestResult({ ok: false, message: msg })
          toast.error('Test Failed', msg)
        }
      }
    } catch (err: any) {
      setAiTestResult({ ok: false, message: err.message || 'Connection timeout or network failure' })
      toast.error('AI Test Failed', err.message || 'Network error')
    } finally {
      setTestingAi(false)
    }
  }

  const handleManualSave = async () => {
    setSaveStatus('saving')
    try {
      await updateSetting(settings)
      setSaveStatus('saved')
      toast.success('Settings Saved', 'All configurations have been securely synchronized with the cloud.')
      if (onSave) onSave()
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (err: any) {
      setSaveStatus('error')
      toast.error('Save Failed', err?.message || 'Could not save settings.')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            System & Engine Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure PostEx V3 credentials, multi-engine AI parser, and account security.
          </p>
        </div>

        {/* Save indicator & Explicit Save Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {saveStatus === 'idle' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Save Active
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
              <SyncIcon size={13} className="animate-spin" /> Saving changes...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
              <CheckIcon size={13} /> Saved to Cloud
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl">
              <AlertTriangleIcon size={13} /> Cloud Sync Error
            </span>
          )}

          <button
            type="button"
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            title="Save settings immediately to cloud"
          >
            <SaveIcon size={14} />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs (Zero cut-off, responsive) */}
      <div className="flex p-1 bg-slate-200/70 dark:bg-slate-900/90 rounded-2xl max-w-xl border border-slate-200/80 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab('courier')}
          className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'courier'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TruckIcon size={15} className={activeTab === 'courier' ? 'text-emerald-500' : ''} />
          <span>PostEx Courier</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BotIcon size={15} className={activeTab === 'ai' ? 'text-emerald-500' : ''} />
          <span>AI Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LockIcon size={15} className={activeTab === 'security' ? 'text-emerald-500' : ''} />
          <span>Account Security</span>
        </button>
      </div>
      {activeTab === 'courier' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-6">
            
            {/* PostEx Token */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  PostEx Merchant API Token (V3)
                </label>
                <a
                  href="https://merchant.postex.pk"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  Open Merchant Portal &rarr;
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPostexToken ? 'text' : 'password'}
                  value={settings.postex_token || ''}
                  onChange={e => updateSetting('postex_token', e.target.value.trim())}
                  placeholder="Paste your PostEx merchant token here..."
                  className="w-full pr-24 pl-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPostexToken(!showPostexToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition"
                  title={showPostexToken ? 'Hide PostEx Token' : 'Show PostEx Token'}
                >
                  {showPostexToken ? <EyeOffIcon size={13} /> : <EyeIcon size={13} className="text-emerald-500" />}
                  <span>{showPostexToken ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !settings.postex_token}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  {testing ? (
                    <>
                      <SyncIcon size={14} className="animate-spin" />
                      <span>Verifying Token...</span>
                    </>
                  ) : (
                    <>
                      <PlugIcon size={14} className="text-emerald-400" />
                      <span>Test PostEx Connection</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <span className={`text-xs font-semibold ${testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {testResult.message}
                  </span>
                )}
              </div>
            </div>

            {/* Pickup & Return Address Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Default Pickup Warehouse Address
                </label>
                {pickupAddresses.length > 0 ? (
                  <select
                    value={settings.postex_pickup || ''}
                    onChange={e => {
                      const code = e.target.value
                      const match = pickupAddresses.find(a => a.addressCode === code)
                      updateSetting({
                        postex_pickup: code,
                        postex_pickup_address: match ? `${match.address} — ${match.cityName}` : ''
                      })
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="">Select Pickup Address...</option>
                    {pickupAddresses.map(a => (
                      <option key={a.addressCode} value={a.addressCode}>
                        {a.address} ({a.cityName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings.postex_pickup || ''}
                    onChange={e => updateSetting('postex_pickup', e.target.value)}
                    placeholder="e.g. 001"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Return Address (Optional)
                </label>
                {returnAddresses.length > 0 ? (
                  <select
                    value={settings.postex_return || ''}
                    onChange={e => {
                      const code = e.target.value
                      const match = returnAddresses.find(a => a.addressCode === code)
                      updateSetting({
                        postex_return: code,
                        postex_return_address: match ? `${match.address} — ${match.cityName}` : ''
                      })
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="">Same as Pickup Warehouse</option>
                    {returnAddresses.map(a => (
                      <option key={a.addressCode} value={a.addressCode}>
                        {a.address} ({a.cityName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings.postex_return || ''}
                    onChange={e => updateSetting('postex_return', e.target.value)}
                    placeholder="Return address code..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Defaults: Weight, Items, Order Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Default Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.default_weight || '0.5'}
                  onChange={e => updateSetting('default_weight', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Default Items Count
                </label>
                <input
                  type="number"
                  value={settings.default_items || '1'}
                  onChange={e => updateSetting('default_items', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Order Type
                </label>
                <select
                  value={settings.postex_type || 'Normal'}
                  onChange={e => updateSetting('postex_type', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="Reversed">Reversed</option>
                  <option value="Replacement">Replacement</option>
                  <option value="Overland">Overland</option>
                </select>
              </div>
            </div>

          </div>

          {/* Right Help Box */}
          <div className="lg:col-span-4 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              PostEx Integration Notes
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              PostEx V3 API tokens allow instant real-time parcel dispatch. All booked CN tracking numbers are automatically mapped to your PostEx merchant portal.
            </p>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
              <strong>Tip:</strong> Pickup address codes are fetched directly from your PostEx account. If not visible, click <em>Test PostEx Connection</em>.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: AI INTELLIGENCE ENGINE
          ======================================================== */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-6">
            
            {/* Active Provider Selector & Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
                  Active AI Engine
                </label>
                <select
                  value={activeProvider}
                  onChange={e => {
                    const newProvider = e.target.value
                    const meta = PROVIDER_METADATA[newProvider]
                    const updates: Partial<Settings> = { ai_provider: newProvider }
                    const modelKey = `${newProvider}_model` as keyof Settings
                    if (!settings[modelKey] || String(settings[modelKey]).includes('2.0') || String(settings[modelKey]).includes('1.5') || String(settings[modelKey]) === 'custom') {
                      updates[modelKey] = meta?.defaultModel || ''
                    }
                    updateSetting(updates)
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="groq">Groq AI (Ultra Fast)</option>
                  <option value="gemini">Google Gemini (Free Quota)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="anthropic">Anthropic (Claude 3.5)</option>
                  <option value="deepseek">DeepSeek (V3 / R1)</option>
                  <option value="openrouter">OpenRouter (Unified)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Model Selection
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    {PROVIDER_METADATA[activeProvider]?.badge}
                  </span>
                </div>
                <input
                  type="text"
                  value={String(settings[activeModelField] || PROVIDER_METADATA[activeProvider]?.defaultModel || '')}
                  onChange={e => updateSetting(activeModelField, e.target.value.trim())}
                  placeholder="e.g. gemini-3-flash-preview"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />

                {/* Quick Model Chips */}
                {PROVIDER_METADATA[activeProvider]?.models && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PROVIDER_METADATA[activeProvider].models.map(m => {
                      const isSelected = String(settings[activeModelField]) === m || (!settings[activeModelField] && m === PROVIDER_METADATA[activeProvider].defaultModel)
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateSetting(activeModelField, m)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {m}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* API Key Pool for Selected Provider */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {activeProvider.toUpperCase()} API Key(s) (Rotation Pool)
                </label>
                
                <div className="flex items-center gap-2.5">
                  {/* Direct API Key Acquisition Redirect Link */}
                  <a
                    href={PROVIDER_METADATA[activeProvider]?.keyUrl || 'https://aistudio.google.com/app/apikey'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 transition cursor-pointer"
                  >
                    <ExternalLinkIcon size={12} />
                    <span>{PROVIDER_METADATA[activeProvider]?.keyLabel || 'Get API Key'} &rarr;</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                    title={showApiKey ? 'Hide API Keys' : 'Show API Keys'}
                  >
                    {showApiKey ? (
                      <>
                        <EyeOffIcon size={13} className="text-slate-500" />
                        <span>Hide Keys</span>
                      </>
                    ) : (
                      <>
                        <EyeIcon size={13} className="text-emerald-500" />
                        <span>Show Keys</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={String(settings[activeKeyField] || '')}
                onChange={e => updateSetting(activeKeyField, e.target.value)}
                placeholder={`Paste your ${activeProvider.toUpperCase()} key here...\nEnter multiple keys (one per line) for auto-failover rotation.`}
                style={{
                  WebkitTextSecurity: showApiKey ? 'none' : 'disc',
                  fontFamily: 'monospace'
                }}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keys are securely encrypted and cached in your browser. Multi-key pool auto-switches on rate limits.
              </p>

              {/* Test AI Connection Button (PostEx Style) */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestAiConnection}
                  disabled={testingAi || !settings[activeKeyField]}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {testingAi ? (
                    <>
                      <SyncIcon size={14} className="animate-spin" />
                      <span>Testing {activeProvider.toUpperCase()}...</span>
                    </>
                  ) : (
                    <>
                      <PlugIcon size={14} className="text-emerald-400" />
                      <span>Test AI Connection</span>
                    </>
                  )}
                </button>

                {aiTestResult && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    aiTestResult.ok 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {aiTestResult.message}
                  </span>
                )}
              </div>
            </div>

          </div>

          <div className="lg:col-span-4 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              AI Engine Comparison
            </h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p><strong>Groq AI:</strong> Latency &lt; 600ms. Perfect for high-speed WhatsApp parsing without rate limits.</p>
              <p><strong>Google Gemini:</strong> 1,500 free requests per day on <code>gemini-3-flash-preview</code>.</p>
              <p><strong>DeepSeek / OpenAI:</strong> High reasoning accuracy on complex multi-line Pakistani addresses.</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
              <strong>Built-in SMTP Notice:</strong> Mail dispatch system is built directly into the core platform for all users and auth flows.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: ACCOUNT SECURITY & PASSWORD
          ======================================================== */}
      {activeTab === 'security' && (
        <div className="max-w-xl space-y-4">
          {/* User Account Profile Card with Avatar */}
          {user && (
            <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-5 shadow-sm flex items-center gap-3.5">
              <UserAvatar email={user.email} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {user.email?.split('@')[0]}
                  </h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 uppercase tracking-wider">
                    Merchant Account
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  {user.email}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Avatar synced with Gmail / Gravatar
                </p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Change Account Password
            </h3>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {pwError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-medium">
                {pwSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-40"
            >
              {pwLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    )}

    </div>
  )
}
