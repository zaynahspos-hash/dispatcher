import { useState, useEffect } from 'react'
import { getMerchantAddresses, getOrderTypes } from '../utils/postexApi'
import { Settings } from '../utils/groqParser'
import { SettingsIcon, SparklesIcon, SyncIcon, InfoIcon, EyeIcon, EyeOffIcon } from './Icons'
import { SearchableDropdown } from './SearchableDropdown'
import { supabase } from '../utils/supabaseClient'

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

export default function SettingsPage({ settings, updateSetting, onSave, cities, user }: SettingsPageProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.")
      return
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.")
      return
    }
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')
    try {
      const userEmail = user?.email
      if (!userEmail) {
        throw new Error("User session not found. Please log in again.")
      }
      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      })
      if (signInError) {
        throw new Error("Current password is incorrect.")
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (updateError) throw updateError

      setPwSuccess("Password updated successfully!")
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwError(err.message || "Failed to update password.")
    } finally {
      setPwLoading(false)
    }
  }
  const [addresses, setAddresses] = useState<MerchantAddress[]>([])
  const [orderTypes, setOrderTypes] = useState<string[]>([])
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [showPostexToken, setShowPostexToken] = useState(false)

  // Auto-load addresses and order types if token already saved
  useEffect(() => {
    if (settings.postex_token) {
      getMerchantAddresses(settings.postex_token)
        .then(res => {
          if ((res.statusCode == 200 || res.statusCode == '0200') && res.dist) {
            setAddresses(res.dist)
            const pickupAddrs = res.dist.filter((a: MerchantAddress) => a.addressType !== 'Return Address')
            const returnAddrs = res.dist.filter((a: MerchantAddress) => a.addressType === 'Return Address')
            
            // Auto-select first if not set
            const updates: Partial<Settings> = {}
            if (pickupAddrs.length > 0 && !settings.postex_pickup) {
              const defaultPickup = pickupAddrs[0]
              updates.postex_pickup = defaultPickup.addressCode
              updates.postex_pickup_address = `${defaultPickup.address} — ${defaultPickup.cityName}`
            } else if (settings.postex_pickup && !settings.postex_pickup_address) {
              const match = pickupAddrs.find(a => a.addressCode === settings.postex_pickup)
              if (match) {
                updates.postex_pickup_address = `${match.address} — ${match.cityName}`
              }
            }

            if (!settings.postex_return) {
              const defaultReturn = returnAddrs.length > 0 ? returnAddrs[0] : (res.dist.length > 0 ? res.dist[0] : null)
              if (defaultReturn) {
                updates.postex_return = defaultReturn.addressCode
                updates.postex_return_city = (defaultReturn.cityName || '').toUpperCase()
                updates.postex_return_address = `${defaultReturn.address} — ${defaultReturn.cityName}`
              }
            } else {
              if (!settings.postex_return_address) {
                const match = returnAddrs.find(a => a.addressCode === settings.postex_return)
                if (match) {
                  updates.postex_return_address = `${match.address} — ${match.cityName}`
                }
              }
              if (!settings.postex_return_city) {
                const matchingAddress = res.dist.find((a: MerchantAddress) => a.addressCode === settings.postex_return)
                if (matchingAddress && matchingAddress.cityName) {
                  updates.postex_return_city = matchingAddress.cityName.toUpperCase()
                }
              }
            }

            if (Object.keys(updates).length > 0) {
              updateSetting(updates)
            }
          }
        })
        .catch(() => {})

      getOrderTypes(settings.postex_token)
        .then(res => {
          if (res.dist) {
            setOrderTypes(res.dist)
          }
        })
        .catch(() => {})
    }
  }, [])

  async function testPostexToken() {
    if (!settings.postex_token) {
      setTestResult({ ok: false, message: 'Please enter a PostEx token first.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await getMerchantAddresses(settings.postex_token)
      if ((res.statusCode == 200 || res.statusCode == '0200') && res.dist) {
        setAddresses(res.dist)
        const pickupAddrs = res.dist.filter((a: MerchantAddress) => a.addressType !== 'Return Address')
        const returnAddrs = res.dist.filter((a: MerchantAddress) => a.addressType === 'Return Address')
        
        const updates: Partial<Settings> = {}
        if (pickupAddrs.length > 0 && !settings.postex_pickup) {
          const defaultPickup = pickupAddrs[0]
          updates.postex_pickup = defaultPickup.addressCode
          updates.postex_pickup_address = `${defaultPickup.address} — ${defaultPickup.cityName}`
        } else if (settings.postex_pickup && !settings.postex_pickup_address) {
          const match = pickupAddrs.find(a => a.addressCode === settings.postex_pickup)
          if (match) {
            updates.postex_pickup_address = `${match.address} — ${match.cityName}`
          }
        }

        if (!settings.postex_return) {
          const defaultReturn = returnAddrs.length > 0 ? returnAddrs[0] : (res.dist.length > 0 ? res.dist[0] : null)
          if (defaultReturn) {
            updates.postex_return = defaultReturn.addressCode
            updates.postex_return_city = (defaultReturn.cityName || '').toUpperCase()
            updates.postex_return_address = `${defaultReturn.address} — ${defaultReturn.cityName}`
          }
        } else {
          if (!settings.postex_return_address) {
            const match = returnAddrs.find(a => a.addressCode === settings.postex_return)
            if (match) {
              updates.postex_return_address = `${match.address} — ${match.cityName}`
            }
          }
          if (!settings.postex_return_city) {
            const matchingAddress = res.dist.find((a: MerchantAddress) => a.addressCode === settings.postex_return)
            if (matchingAddress && matchingAddress.cityName) {
              updates.postex_return_city = matchingAddress.cityName.toUpperCase()
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          updateSetting(updates)
        }

        // Fetch Order Types
        try {
          const typesRes = await getOrderTypes(settings.postex_token)
          if (typesRes.dist) {
            setOrderTypes(typesRes.dist)
          }
        } catch (typesErr) {
          console.error("Order types load failed:", typesErr)
        }

        setTestResult({ ok: true, message: `Token valid! ${res.dist.length} address(es) found.` })
      } else {
        setTestResult({ ok: false, message: `Invalid token: ${res.message || 'Unknown error'}` })
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Connection error'
      setTestResult({ ok: false, message: `${msg}` })
    }
    setTesting(false)
  }

  const pickupAddresses = addresses.filter(a => a.addressType !== 'Return Address')
  const returnAddresses = addresses

  const defaultFields = [
    { label: 'Default Weight (kg)', key: 'default_weight' as keyof Settings, placeholder: '0.5', type: 'number' },
    { label: 'Default Items Per Parcel', key: 'default_items' as keyof Settings, placeholder: '3', type: 'number' },
    { label: 'Default Product / Detail', key: 'default_product' as keyof Settings, placeholder: 'Kids Clothes', type: 'text' },
    { label: 'Default Delivery Note', key: 'default_note' as keyof Settings, placeholder: 'Call before delivery', type: 'text' },
  ]

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          <SettingsIcon size={20} className="text-blue-600 dark:text-blue-400 animate-pulse" />
          <span>Settings</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Keys saved in browser localStorage only</p>
      </div>

      {/* Form Body */}
      <div className="p-4 sm:p-6 space-y-8">
        {/* AI Settings Section */}
        <div className="bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">AI Engine Settings</h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">AI Provider</label>
            <select
              value={settings.ai_provider || 'groq'}
              onChange={e => updateSetting('ai_provider', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 font-medium text-gray-700 dark:text-gray-200"
            >
              <option value="groq">Groq AI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="deepseek">DeepSeek (Direct)</option>
              <option value="kimi">Kimi / Moonshot</option>
              <option value="mistral">Mistral AI</option>
            </select>
          </div>

          {/* Provider Specific Settings */}
          {(() => {
            const provider = settings.ai_provider || 'groq'
            let modelField: keyof Settings = 'groq_model'
            let defaultModel = 'llama-3.3-70b-versatile'
            let options: { value: string; label: string }[] = []

            if (provider === 'groq') {
              modelField = 'groq_model'
              defaultModel = 'llama-3.1-8b-instant'
              options = [
                { value: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant ★ Recommended — Sab se Sasta & Fast' },
                { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile — High Quality' },
                { value: 'gemma2-9b-it', label: 'gemma2-9b-it — Google Gemma 2 9B' },
                { value: 'llama-3.3-70b-specdec', label: 'llama-3.3-70b-specdec — Speculative Decoding' },
                { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'meta-llama/llama-4-scout-17b-16e-instruct — Llama 4 Scout' },
                { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'meta-llama/llama-4-maverick-17b-128e-instruct — Llama 4 Maverick' },
                { value: 'qwen-qwq-32b', label: 'qwen-qwq-32b — Reasoning' },
                { value: 'deepseek-r1-distill-llama-70b', label: 'deepseek-r1-distill-llama-70b — R1 Reasoning' },
                { value: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768 — Mixtral MoE' }
              ]
            } else if (provider === 'openrouter') {
              modelField = 'openrouter_model'
              defaultModel = 'meta-llama/llama-3.1-8b-instruct:free'
              options = [
                { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'meta-llama/llama-3.1-8b-instruct:free ★ Recommended — Sab se Sasta (Free)' },
                { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'meta-llama/llama-3.3-70b-instruct:free — High Quality (Free)' },
                { value: 'google/gemini-2.0-flash-exp:free', label: 'google/gemini-2.0-flash-exp:free — Gemini 2.0 Flash (Free)' },
                { value: 'deepseek/deepseek-r1-distill-llama-70b:free', label: 'deepseek/deepseek-r1-distill-llama-70b:free — R1 Distill (Free)' },
                { value: 'qwen/qwen-2.5-coder-32b-instruct:free', label: 'qwen/qwen-2.5-coder-32b-instruct:free — Qwen Coder (Free)' },
                { value: 'deepseek/deepseek-r1:free', label: 'deepseek/deepseek-r1:free — R1 Reasoning (Free, Congested)' },
                { value: 'google/gemini-2.5-flash', label: 'google/gemini-2.5-flash — Gemini 2.5 Flash (Paid)' },
                { value: 'google/gemini-2.5-pro', label: 'google/gemini-2.5-pro — Gemini 2.5 Pro (Paid)' },
                { value: 'meta-llama/llama-3.3-70b-instruct', label: 'meta-llama/llama-3.3-70b-instruct — Llama 3.3 70B (Paid)' },
                { value: 'deepseek/deepseek-r1', label: 'deepseek/deepseek-r1 — R1 Reasoning (Paid)' }
              ]
            } else if (provider === 'gemini') {
              modelField = 'gemini_model'
              defaultModel = 'gemini-2.0-flash-lite'
              options = [
                { value: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite ★ Recommended — Sab se Sasta & Fast' },
                { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash — Standard Flash' },
                { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash — Fast' },
                { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash — Older Flash' },
                { value: 'gemini-1.5-flash-8b', label: 'gemini-1.5-flash-8b — Smallest & Cheapest' },
                { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro — Pro' }
              ]
            } else if (provider === 'openai') {
              modelField = 'openai_model'
              defaultModel = 'gpt-4o-mini'
              options = [
                { value: 'gpt-4o-mini', label: 'gpt-4o-mini ★ Recommended — Sab se Sasta & Fast' },
                { value: 'gpt-4.1-nano', label: 'gpt-4.1-nano — Sab se Chota & Sasta' },
                { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini — Newer Mini' },
                { value: 'gpt-4o', label: 'gpt-4o — Standard' },
                { value: 'gpt-4.1', label: 'gpt-4.1 — Latest' },
                { value: 'o4-mini', label: 'o4-mini — Cheap Reasoning' },
                { value: 'o3-mini', label: 'o3-mini — Reasoning' },
                { value: 'o1-mini', label: 'o1-mini — o1 Reasoning' }
              ]
            } else if (provider === 'anthropic') {
              modelField = 'anthropic_model'
              defaultModel = 'claude-3-haiku-20240307'
              options = [
                { value: 'claude-3-haiku-20240307', label: 'claude-3-haiku-20240307 ★ Recommended — Sab se Sasta (Older Haiku)' },
                { value: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest — Haiku Fast' },
                { value: 'claude-haiku-4-5', label: 'claude-haiku-4-5 — Sab se Sasta & Fast' },
                { value: 'claude-sonnet-4-5', label: 'claude-sonnet-4-5 — Sonnet Latest' },
                { value: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest — Sonnet Advanced' },
                { value: 'claude-opus-4-5', label: 'claude-opus-4-5 — Opus (Most Powerful)' }
              ]
            } else if (provider === 'deepseek') {
              modelField = 'deepseek_model'
              defaultModel = 'deepseek-chat'
              options = [
                { value: 'deepseek-chat', label: 'deepseek-chat ★ Recommended — V4 Flash Non-Thinking (Sab se Sasta)' },
                { value: 'deepseek-v4-flash', label: 'deepseek-v4-flash — V4 Flash Thinking (Default ON ⚠︎)' },
                { value: 'deepseek-reasoner', label: 'deepseek-reasoner — V4 Flash Thinking Alias (Legacy)' },
                { value: 'deepseek-v4-pro', label: 'deepseek-v4-pro — Pro, High Quality ($0.435/1M)' }
              ]
            } else if (provider === 'kimi') {
              modelField = 'kimi_model'
              defaultModel = 'moonshot-v1-8k'
              options = [
                { value: 'moonshot-v1-8k', label: 'moonshot-v1-8k — Sab se Sasta (8K Context)' },
                { value: 'moonshot-v1-32k', label: 'moonshot-v1-32k — 32K Context' },
                { value: 'moonshot-v1-128k', label: 'moonshot-v1-128k — 128K Context (Long Docs)' }
              ]
            } else if (provider === 'mistral') {
              modelField = 'mistral_model'
              defaultModel = 'ministral-3b-2512'
              options = [
                { value: 'ministral-3b-2512', label: 'ministral-3b-2512 ★ Recommended — Sab se Sasta & Fast' },
                { value: 'mistral-small-2506', label: 'mistral-small-2506 — Quality + Speed Balance' },
                { value: 'open-mistral-nemo', label: 'open-mistral-nemo — Reasoning / Chat' },
                { value: 'codestral-2508', label: 'codestral-2508 — Coding' },
                { value: 'mistral-small-latest', label: 'mistral-small-latest' },
                { value: 'mistral-large-latest', label: 'mistral-large-latest — High Quality' },
                { value: 'codestral-latest', label: 'codestral-latest' }
              ]
            }

            const isCustom = settings[modelField] === 'custom' || 
              (settings[modelField] !== undefined && 
               settings[modelField] !== '' && 
               !options.some(opt => opt.value === settings[modelField]))

            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Model Selection ({provider.toUpperCase()})</label>
                  <select
                    value={isCustom ? 'custom' : (settings[modelField] || defaultModel)}
                    onChange={e => {
                      const val = e.target.value
                      if (val === 'custom') {
                        updateSetting(modelField, 'custom')
                      } else {
                        updateSetting(modelField, val)
                      }
                    }}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 font-medium text-gray-700 dark:text-gray-200"
                  >
                    {options.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="custom">Custom Model ID...</option>
                  </select>
                </div>

                {isCustom && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Custom Model ID</label>
                    <input
                      type="text"
                      value={settings[modelField] === 'custom' ? '' : (settings[modelField] || '')}
                      onChange={e => updateSetting(modelField, e.target.value || 'custom')}
                      placeholder={defaultModel}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900"
                    />
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* API Keys configuration for all providers */}
        <div className="bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">API Keys (All Providers)</h3>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded font-semibold self-start sm:self-auto">
              Enter one key per line for Fallback rotation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'groq', label: 'Groq AI Key(s)', keyField: 'groq_api_key' as keyof Settings, consoleUrl: 'https://console.groq.com' },
              { id: 'gemini', label: 'Google Gemini Key(s)', keyField: 'gemini_api_key' as keyof Settings, consoleUrl: 'https://aistudio.google.com' },
              { id: 'openai', label: 'OpenAI Key(s)', keyField: 'openai_api_key' as keyof Settings, consoleUrl: 'https://platform.openai.com/api-keys' },
              { id: 'openrouter', label: 'OpenRouter Key(s)', keyField: 'openrouter_api_key' as keyof Settings, consoleUrl: 'https://openrouter.ai/keys' },
              { id: 'anthropic', label: 'Anthropic Key(s)', keyField: 'anthropic_api_key' as keyof Settings, consoleUrl: 'https://console.anthropic.com' },
              { id: 'deepseek', label: 'DeepSeek Key(s)', keyField: 'deepseek_api_key' as keyof Settings, consoleUrl: 'https://platform.deepseek.com' },
              { id: 'kimi', label: 'Kimi / Moonshot Key(s)', keyField: 'kimi_api_key' as keyof Settings, consoleUrl: 'https://platform.moonshot.cn' },
              { id: 'mistral', label: 'Mistral AI Key(s)', keyField: 'mistral_api_key' as keyof Settings, consoleUrl: 'https://console.mistral.ai' }
            ].map(({ id, label, keyField, consoleUrl }) => {
              const currentKeys = settings[keyField] || ''
              const isVisible = !!showKeys[id]
              return (
                <div key={id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200">{label}</label>
                    <a
                      href={consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      Get Key ↗
                    </a>
                  </div>
                  <div className="relative">
                    <textarea
                      value={currentKeys}
                      onChange={e => updateSetting(keyField, e.target.value)}
                      placeholder={`Paste ${id.toUpperCase()} key(s) here (one per line)...`}
                      rows={2}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-y bg-white dark:bg-gray-800"
                      style={{
                        WebkitTextSecurity: isVisible ? 'none' : 'disc',
                      } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))}
                      className="absolute right-2 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-650 cursor-pointer p-1"
                    >
                      {isVisible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM10.89 12.012l-1.9-1.9A2.002 2.002 0 009 11v.5a.5.5 0 00.5.5h.5c.345 0 .662-.087.94-.238l-.05-.05z" /><path d="M11.968 11.968c.324-.324.532-.767.532-1.258V10a2.5 2.5 0 00-2.5-2.5h-.71c-.49 0-.934.208-1.258.532l1.414 1.414a1 1 0 011.054 1.054l1.414 1.414z" /><path fillRule="evenodd" d="M1.636 10.566a.75.75 0 010-1.132 11.233 11.233 0 0116.728 0 .75.75 0 010 1.132 11.233 11.233 0 01-16.728 0zm1.758-1.047a9.733 9.733 0 0013.212 0 9.733 9.733 0 00-13.212 0z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 9.505a.75.75 0 000 1.01 11.24 11.24 0 0018.672 0 .75.75 0 000-1.01A11.24 11.24 0 00.664 9.505zM10 14a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* PostEx Section */}
        <div className="bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">PostEx Courier Settings</h3>
            <a
              href="https://merchant.postex.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
            >
              Merchant Portal →
            </a>
          </div>

          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">API Token</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPostexToken ? 'text' : 'password'}
                value={settings.postex_token || ''}
                onChange={e => updateSetting('postex_token', e.target.value)}
                placeholder="PostEx API token..."
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 font-mono bg-white dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPostexToken(!showPostexToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 flex items-center justify-center cursor-pointer"
              >
                {showPostexToken ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            <button
              type="button"
              onClick={testPostexToken}
              disabled={testing}
              className="px-5 py-3 bg-blue-600 text-[#ffffff] rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap flex items-center gap-2 cursor-pointer"
            >
              {testing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Testing...
                </>
              ) : (
                <>
                  <SyncIcon size={16} />
                  <span>Test & Load</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div className={`mt-3 text-xs px-3 py-2.5 rounded-lg font-medium border ${testResult.ok ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50'}`}>
              {testResult.message}
            </div>
          )}

          {/* Pickup Address */}
          {pickupAddresses.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Pickup Address</label>
              <select
                value={settings.postex_pickup || ''}
                onChange={e => {
                  const code = e.target.value
                  const selected = pickupAddresses.find(a => a.addressCode === code)
                  updateSetting({
                    postex_pickup: code,
                    postex_pickup_address: selected ? `${selected.address} — ${selected.cityName}` : ''
                  })
                }}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 font-medium text-gray-700 dark:text-gray-200"
              >
                <option value="">— Select Pickup Address —</option>
                {pickupAddresses.map(a => (
                  <option key={a.addressCode} value={a.addressCode}>
                    {a.address} — {a.cityName} [Code: {a.addressCode}] ({a.addressType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Return Address */}
          {returnAddresses.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Return Address</label>
              <select
                value={settings.postex_return || ''}
                onChange={e => {
                  const code = e.target.value
                  const selected = returnAddresses.find(a => a.addressCode === code)
                  updateSetting({
                    postex_return: code,
                    postex_return_city: selected ? (selected.cityName || '').toUpperCase() : '',
                    postex_return_address: selected ? `${selected.address} — ${selected.cityName}` : ''
                  })
                }}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 font-medium text-gray-700 dark:text-gray-200"
              >
                <option value="">— Select Return Address —</option>
                {returnAddresses.map(a => (
                  <option key={a.addressCode} value={a.addressCode}>
                    {a.address} — {a.cityName} [Code: {a.addressCode}] ({a.addressType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {addresses.length === 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Pickup Address Code</label>
                <input
                  value={settings.postex_pickup || ''}
                  onChange={e => updateSetting('postex_pickup', e.target.value)}
                  placeholder="ABC123"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Return Address Code</label>
                <input
                  value={settings.postex_return || ''}
                  onChange={e => updateSetting('postex_return', e.target.value)}
                  placeholder="DEF456"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          )}

          {/* Return City */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Return City</label>
            <SearchableDropdown
              value={(settings.postex_return_city || '').toUpperCase()}
              onChange={val => updateSetting('postex_return_city', val.toUpperCase())}
              options={cities}
              placeholder="— Select Return City —"
            />
          </div>

          {/* Shipment Type */}
          {orderTypes.length > 0 ? (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Shipment Type</label>
              <select
                value={settings.postex_type || 'Normal'}
                onChange={e => updateSetting('postex_type', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 font-medium text-gray-700 dark:text-gray-200"
              >
                {orderTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Shipment Type</label>
              <input
                value={settings.postex_type || 'Normal'}
                onChange={e => updateSetting('postex_type', e.target.value)}
                placeholder="Normal"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              />
            </div>
          )}

          {/* Special Handling */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Special Handling</label>
            <select
              value={settings.postex_handling || 'No'}
              onChange={e => updateSetting('postex_handling', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 font-medium text-gray-700 dark:text-gray-200"
            >
              <option value="No">Normal (Standard)</option>
              <option value="Yes">Fragile (Careful Handling)</option>
            </select>
          </div>

          {/* Sync & Print Rules */}
          <div className="mt-6 pt-5 border-t border-gray-150 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Sync & Print Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                <input
                  type="checkbox"
                  checked={settings.postex_product_check === '1'}
                  onChange={e => updateSetting('postex_product_check', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Print Item Name in Label</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Include parsed details on shipment invoice</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                <input
                  type="checkbox"
                  checked={settings.postex_sku_check === '1'}
                  onChange={e => updateSetting('postex_sku_check', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Print SKU Name in Label</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Append items' unique code to shipping labels</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                <input
                  type="checkbox"
                  checked={settings.postex_weight_check === '1'}
                  onChange={e => updateSetting('postex_weight_check', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Auto Calculate Weight</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Use AI extracted weight or fall back to default weight</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                <input
                  type="checkbox"
                  checked={settings.postex_pieces_check === '1'}
                  onChange={e => updateSetting('postex_pieces_check', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Auto Calculate Pieces</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Extract quantity automatically or use defaults</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                <input
                  type="checkbox"
                  checked={settings.postex_cod_check === '1'}
                  onChange={e => updateSetting('postex_cod_check', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Calculate Non-COD (Prepaid) as Zero</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Set booking amount to 0 for prepaid/advance paid orders</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                <input
                  type="checkbox"
                  checked={settings.postex_notes_check === '1'}
                  onChange={e => updateSetting('postex_notes_check', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Print Order Notes in Remarks</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Combine custom customer notes with default remarks</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Defaults Section */}
        <div className="bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Parcel Defaults</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultFields.map(({ label, key, placeholder, type }) => {
              const isDefaultItems = key === 'default_items'
              const tooltipText = isDefaultItems
                ? 'Default number of pieces per parcel. If left empty, it will default to 1 piece.'
                : undefined

              return (
                <div key={key} title={tooltipText} className={isDefaultItems ? 'cursor-help' : ''}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 flex items-center justify-between">
                    <span>{label}</span>
                    {isDefaultItems && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 font-normal">
                        Defaults to 1 if empty
                      </span>
                    )}
                  </label>
                  <input
                    type={type}
                    value={settings[key] || ''}
                    placeholder={placeholder}
                    onChange={e => updateSetting(key, e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                />
              </div>
            )
          })}
          </div>
        </div>

        {/* WhatsApp Notification Settings */}
        <div className="bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <InfoIcon size={18} className="text-green-600 dark:text-green-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">WhatsApp Senders & Templates</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">WhatsApp Message Template</label>
              <textarea
                value={settings.whatsapp_template || ''}
                onChange={e => updateSetting('whatsapp_template', e.target.value)}
                rows={3}
                placeholder="Template text..."
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-gray-800"
              />
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 leading-relaxed bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-150 dark:border-gray-700">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Placeholder Format Guide:</span> Use 
                <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-blue-600 dark:text-blue-400 font-semibold">{`{name}`}</code> for customer name, 
                <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-blue-600 dark:text-blue-400 font-semibold">{`{url}`}</code> for PostEx tracking link, and 
                <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-blue-600 dark:text-blue-400 font-semibold">{`{note}`}</code> for custom remarks note.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Default Suffix Note</label>
              <input
                type="text"
                value={settings.whatsapp_note || ''}
                onChange={e => updateSetting('whatsapp_note', e.target.value)}
                placeholder="e.g. Thank you for shopping with us!"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        {user && (
          <div className="bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px] text-red-500 dark:text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Security & Password</h3>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              {pwError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-xl font-medium">
                  {pwSuccess}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-250 mb-1.5 pl-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-850 font-mono text-gray-700 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-250 mb-1.5 pl-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-850 font-mono text-gray-700 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-250 mb-1.5 pl-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-850 font-mono text-gray-700 dark:text-gray-200"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-[#ffffff] rounded-xl text-xs font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {pwLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Info box */}
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3">
          <InfoIcon size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-0.5">CORS Note</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              PostEx API may block direct browser requests. If you see CORS errors, use the app from a Vercel deployment with a proxy, or try a CORS browser extension during development.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900 rounded-b-2xl">
        <button
          onClick={onSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-[#ffffff] font-bold py-3.5 rounded-xl transition shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <SettingsIcon size={16} />
          <span>Save & Continue</span>
        </button>
      </div>
    </div>
  )
}
