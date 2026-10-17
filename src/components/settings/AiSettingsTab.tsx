import React, { useState } from 'react'
import { Settings } from '../../utils/groqParser'
import { ExternalLinkIcon, EyeIcon, EyeOffIcon } from '../Icons'

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
  onTestAi,
  onSave,
  saving,
  hasChanges
}) => {
  const [showAiKeys, setShowAiKeys] = useState(false)
  const activeProvider = settings.ai_provider || 'gemini'
  const activeMeta = PROVIDER_METADATA[activeProvider] || PROVIDER_METADATA.gemini

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
        
        {/* Unified Technical Provider Grid */}
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
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer active:scale-98 flex flex-col justify-between min-h-[76px] ${
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
                  className={`h-8 px-3 rounded-lg text-xs font-mono font-semibold transition cursor-pointer active:scale-95 ${
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
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
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

          <div className="relative">
            <input
              type={showAiKeys ? 'text' : 'password'}
              value={settings[`${activeProvider}_api_key` as keyof Settings] || ''}
              onChange={e => updateSetting(`${activeProvider}_api_key` as keyof Settings, e.target.value)}
              placeholder="Enter key or multiple keys separated by commas..."
              className="w-full h-9 px-3.5 pr-10 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowAiKeys(!showAiKeys)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              {showAiKeys ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTestAi}
                disabled={testingAi}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-98 transition disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <span>Test AI Connection</span>
              </button>
              {aiPingResult && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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
