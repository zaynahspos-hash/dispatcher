import React, { useState } from 'react'
import { Settings } from '../../utils/groqParser'
import { ExternalLinkIcon } from '../Icons'

export const PROVIDER_METADATA: Record<string, {
  name: string
  keyUrl: string
  keyLabel: string
  defaultModel: string
  models: string[]
  badge: string
}> = {
  gemini: {
    name: 'Google Gemini',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyLabel: 'Get Free Gemini Key (1,500 req/day)',
    defaultModel: 'gemini-3.5-flash-lite',
    models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-lite-latest', 'gemini-3-flash-preview'],
    badge: '1,500 Free Req/Day'
  },
  groq: {
    name: 'Groq AI',
    keyUrl: 'https://console.groq.com/keys',
    keyLabel: 'Get Free Groq Key',
    defaultModel: 'llama-3.1-8b-instant',
    models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
    badge: 'Latency < 600ms'
  },
  openai: {
    name: 'OpenAI (GPT-4o)',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyLabel: 'Get OpenAI Key',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    badge: 'High Reasoning'
  },
  anthropic: {
    name: 'Anthropic Claude',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyLabel: 'Get Claude Key',
    defaultModel: 'claude-3-5-haiku-latest',
    models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
    badge: 'Claude 3.5'
  },
  deepseek: {
    name: 'DeepSeek',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    keyLabel: 'Get DeepSeek Key',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    badge: 'V3 / R1 Engine'
  }
}

interface AiSettingsTabProps {
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
  testingAi: boolean
  aiPingResult: string | null
  onTestAi: () => void
  onSave?: () => void
  saving?: boolean
  hasChanges?: boolean
}

export const AiSettingsTab: React.FC<AiSettingsTabProps> = ({
  settings,
  updateSetting,
  testingAi,
  aiPingResult,
  onTestAi
}) => {
  const [isEditingKey, setIsEditingKey] = useState(false)
  const [tempKey, setTempKey] = useState('')
  const activeProvider = settings.ai_provider || 'gemini'
  const activeMeta = PROVIDER_METADATA[activeProvider] || PROVIDER_METADATA.gemini
  const currentKey = settings[`${activeProvider}_api_key` as keyof Settings] || ''

  return (
    <div className="space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Active AI Neural Provider
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select an AI engine to extract recipient names, Pakistani phone numbers, and addresses from unstructured order text.
          </p>
        </div>
        
        {/* Unified Provider Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {Object.entries(PROVIDER_METADATA).map(([provKey, meta]) => {
            const isSelected = activeProvider === provKey
            return (
              <button
                key={provKey}
                type="button"
                onClick={() => {
                  updateSetting('ai_provider', provKey)
                  updateSetting('ai_model', meta.defaultModel)
                  setIsEditingKey(false)
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer active:scale-98 flex flex-col justify-between min-h-[76px] ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <p className="text-xs font-bold truncate">{meta.name}</p>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                  {meta.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* Model Selection */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Model Selection
          </label>
          <div className="flex flex-wrap gap-2">
            {activeMeta.models.map(m => {
              const isModelActive = (settings.ai_model || activeMeta.defaultModel) === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateSetting('ai_model', m)}
                  className={`h-8 px-3 rounded-xl text-xs font-mono font-semibold transition cursor-pointer active:scale-95 ${
                    isModelActive
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* API Key Pool */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {activeMeta.name} API Key
            </label>
            <a
              href={activeMeta.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>{activeMeta.keyLabel}</span>
              <ExternalLinkIcon size={12} />
            </a>
          </div>

          {currentKey && !isEditingKey ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold tracking-widest">
                    ••••••••••••••••••••••••••••••••
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active & Configured
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Secured & locked. Plain text is hidden for merchant safety.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTempKey(currentKey)
                    setIsEditingKey(true)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Change Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove your ${activeMeta.name} API Key?`)) {
                      updateSetting(`${activeProvider}_api_key` as keyof Settings, '')
                      setIsEditingKey(false)
                      setTempKey('')
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder={`Paste your ${activeMeta.name} API Key...`}
                className="w-full h-9 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSetting(`${activeProvider}_api_key` as keyof Settings, tempKey.trim())
                    setIsEditingKey(false)
                  }}
                  disabled={!tempKey.trim()}
                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Save Key
                </button>
                {currentKey && (
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(false)}
                    className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTestAi}
                disabled={testingAi || !currentKey}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                <span>Test AI Connection</span>
              </button>
              {aiPingResult && (
                <span className={`text-xs font-bold ${aiPingResult.startsWith('Live') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {aiPingResult}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
