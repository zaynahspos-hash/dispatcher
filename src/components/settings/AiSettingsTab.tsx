import React, { useState } from 'react'
import { Settings } from '../../utils/groqParser'
import { ExternalLinkIcon, LockIcon } from '../Icons'

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
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer active:scale-97 flex flex-col justify-between min-h-[78px] ${
                  isSelected
                    ? 'border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/20 text-slate-900 dark:text-white ring-1 ring-emerald-500/30 shadow-xs'
                    : 'border-slate-200/90 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <p className="text-xs font-semibold truncate">{meta.name}</p>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                  )}
                </div>
                <span className={`text-[10px] block mt-1 ${
                  isSelected
                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                    : 'font-medium text-slate-400 dark:text-slate-500'
                }`}>
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
                  className={`h-8 px-3.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 ${
                    isModelActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80'
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
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-[#070b12] border border-slate-200/90 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <LockIcon size={14} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold tracking-wider shrink-0">
                      •••• •••• ••••
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active & Configured
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Secured & locked. Plain text is hidden.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setTempKey(currentKey)
                    setIsEditingKey(true)
                  }}
                  className="h-8 px-3.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200/90 dark:border-slate-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
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
                  className="h-8 px-3.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder={`Paste your ${activeMeta.name} API Key...`}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSetting(`${activeProvider}_api_key` as keyof Settings, tempKey.trim())
                    setIsEditingKey(false)
                  }}
                  disabled={!tempKey.trim()}
                  className="h-8.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Save Key
                </button>
                {currentKey && (
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(false)}
                    className="h-8.5 px-3.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={onTestAi}
              disabled={testingAi || !currentKey}
              className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-97 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              {testingAi ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Testing Connection...
                </span>
              ) : (
                <span>Test AI Connection</span>
              )}
            </button>
            {aiPingResult && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                aiPingResult.startsWith('Live')
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {aiPingResult}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
