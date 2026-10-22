import React, { useState, useEffect } from 'react'
import { UserProfile, LogEntry } from './types'
import { UserAvatar } from '../common/UserAvatar'
import { SharedPagination } from '../common/SharedPagination'
import { usePagination } from '../../hooks/usePagination'
import { supabase } from '../../utils/supabaseClient'
import { AdminDeleteMerchantModal } from './AdminDeleteMerchantModal'

interface AdminMerchantsTabProps {
  users: UserProfile[]
  logs: LogEntry[]
  selectedUser: UserProfile | null
  setSelectedUser: (u: UserProfile | null) => void
  onSelectUser: (u: UserProfile) => void
  onRefresh: () => void
}

export const AdminMerchantsTab: React.FC<AdminMerchantsTabProps> = ({
  users,
  logs,
  selectedUser,
  setSelectedUser,
  onSelectUser,
  onRefresh
}) => {
  const [filterEmail, setFilterEmail] = useState('')
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({})
  const [isActionBusy, setIsActionBusy] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null)

  useEffect(() => {
    if (!selectedUser && users.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      onSelectUser(users[0])
    }
  }, [users, selectedUser, onSelectUser])

  const toggleCreds = (key: string) => {
    setShowCredentials(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTogglePause = async (u: UserProfile) => {
    const isCurrentlyBlocked = !!(u.is_blocked || u.status === 'suspended' || (u.settings as any)?.settings?.is_blocked)
    const nextStatus = isCurrentlyBlocked ? 'active' : 'suspended'
    setIsActionBusy(true)
    setFeedbackMsg(null)

    try {
      const { error: rpcErr } = await supabase.rpc('admin_toggle_tenant_status', { target_user_id: u.id, new_status: nextStatus })
      if (rpcErr) {
        await supabase.from('users').update({ status: nextStatus, is_blocked: nextStatus === 'suspended' }).eq('id', u.id)
        const existingSettings = (u.settings as any)?.settings || {}
        await supabase.from('user_settings').upsert({
          user_id: u.id,
          settings: { ...existingSettings, is_blocked: nextStatus === 'suspended' },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }

      setFeedbackMsg({
        text: nextStatus === 'suspended'
          ? `Merchant ${u.email} has been PAUSED (access blocked).`
          : `Merchant ${u.email} has been ACTIVATED (access restored).`
      })

      if (selectedUser?.id === u.id) {
        setSelectedUser({ ...u, status: nextStatus, is_blocked: nextStatus === 'suspended' })
      }
      onRefresh()
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to update merchant status.', error: true })
    } finally {
      setIsActionBusy(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser || deleteConfirmText.trim() !== 'DELETE') return
    setIsActionBusy(true)
    setFeedbackMsg(null)

    try {
      const { error: rpcErr } = await supabase.rpc('admin_delete_tenant_cascade', { target_user_id: selectedUser.id })
      if (rpcErr) {
        console.error('admin_delete_tenant_cascade error:', rpcErr)
        await Promise.all(['booked_history', 'customers', 'usage_logs', 'user_settings'].map(t =>
          supabase.from(t).delete().eq('user_id', selectedUser.id)
        ))
        const { error: userDelErr } = await supabase.from('users').delete().eq('id', selectedUser.id)
        if (userDelErr) throw new Error(rpcErr.message || userDelErr.message || 'Failed to delete merchant.')
      }

      setIsDeleteDialogOpen(false)
      setDeleteConfirmText('')
      const deletedEmail = selectedUser.email
      setSelectedUser(null)
      onRefresh()
      setFeedbackMsg({ text: `Merchant ${deletedEmail} and all data cascade wiped.` })
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to delete merchant.', error: true })
    } finally {
      setIsActionBusy(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(filterEmail.toLowerCase())
  )

  const selectedUserLogs = selectedUser ? logs.filter(l => l.user_id === selectedUser.id) : []
  const {
    currentPage: logsPage, setCurrentPage: setLogsPage, pageSize: logsPageSize, setPageSize: setLogsPageSize,
    totalItems: totalLogs, paginatedItems: pagedLogs
  } = usePagination({ items: selectedUserLogs, initialPageSize: 10, storageKey: 'admin_logs' })

  const isUserBlocked = selectedUser
    ? !!(selectedUser.is_blocked || selectedUser.status === 'suspended' || (selectedUser.settings as any)?.settings?.is_blocked)
    : false

  const renderMerchantDetails = (isMobileModal = false) => {
    if (!selectedUser) return null
    return (
      <div className={`bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 ${isMobileModal ? 'border-0' : 'rounded-2xl shadow-2xs'} overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar email={selectedUser.email} avatarUrl={(selectedUser.settings as any)?.avatar_url || (selectedUser.settings as any)?.settings?.avatar_url} size="md" />
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Merchant Configuration</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{selectedUser.email}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedUser(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Bar: Pause / Activate & Delete */}
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-900/70 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isUserBlocked ? 'text-amber-500 bg-amber-500/10 border border-amber-500/30' : 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isUserBlocked ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isUserBlocked ? 'Paused' : 'Active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTogglePause(selectedUser)}
              disabled={isActionBusy}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                isUserBlocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs' : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {isUserBlocked ? 'Activate Account' : 'Pause Account'}
            </button>
            <button
              onClick={() => { setDeleteConfirmText(''); setIsDeleteDialogOpen(true) }}
              disabled={isActionBusy}
              className="h-7 px-2.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
              title="Delete Merchant & Wipe All Data"
            >
              Delete
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className={`px-4 py-2 text-xs font-medium ${feedbackMsg.error ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {feedbackMsg.text}
          </div>
        )}

        <div className={`p-4 sm:p-5 space-y-6 ${isMobileModal ? 'max-h-[70vh]' : 'max-h-[600px]'} overflow-y-auto text-xs`}>
          {/* Configured APIs List: PostEx & AI Model Providers */}
          {(() => {
            const userSettings = (selectedUser.settings as any)?.settings || {}
            const postexToken = userSettings.postex_token || ''
            const aiProvider = userSettings.ai_provider || 'gemini'
            const activeAiModel = aiProvider === 'gemini' 
              ? (userSettings.gemini_model || 'gemini-3.5-flash')
              : (userSettings.groq_model || 'llama-3.3-70b-versatile')

            // Gemini Keys list
            const geminiKeys: string[] = []
            if (userSettings.gemini_api_key) {
              const parts = String(userSettings.gemini_api_key).split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean)
              geminiKeys.push(...parts)
            }
            if (Array.isArray(userSettings.gemini_api_keys)) {
              userSettings.gemini_api_keys.forEach((k: string) => {
                if (k && !geminiKeys.includes(k.trim())) geminiKeys.push(k.trim())
              })
            }

            // Groq Keys list
            const groqKeys: string[] = []
            if (userSettings.groq_api_key) {
              const parts = String(userSettings.groq_api_key).split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean)
              groqKeys.push(...parts)
            }
            if (Array.isArray(userSettings.groq_api_keys)) {
              userSettings.groq_api_keys.forEach((k: string) => {
                if (k && !groqKeys.includes(k.trim())) groqKeys.push(k.trim())
              })
            }

            // Other AI Keys
            const otherAiKeys: { name: string; key: string; model?: string }[] = []
            if (userSettings.openrouter_api_key) otherAiKeys.push({ name: 'OpenRouter', key: userSettings.openrouter_api_key, model: userSettings.openrouter_model })
            if (userSettings.openai_api_key) otherAiKeys.push({ name: 'OpenAI', key: userSettings.openai_api_key, model: userSettings.openai_model })
            if (userSettings.deepseek_api_key) otherAiKeys.push({ name: 'DeepSeek', key: userSettings.deepseek_api_key, model: userSettings.deepseek_model })

            // Previous / Changed APIs Archive (Sorted NEW to OLD)
            const apiHistory: any[] = Array.isArray(userSettings.api_history)
              ? [...userSettings.api_history].sort((a, b) => (b.replaced_at || '').localeCompare(a.replaced_at || ''))
              : []

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Configured API Keys & Integrations
                  </h4>
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    Sync Real-time
                  </button>
                </div>

                {/* 1. PostEx V3 API Token */}
                {(() => {
                  const lastArchivedPostex = apiHistory.find((h: any) => h.provider === 'postex')
                  const effectiveToken = postexToken || lastArchivedPostex?.api_key || ''
                  const isUserRemoved = !postexToken && Boolean(lastArchivedPostex)

                  return (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">
                            PostEx API Token
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            postexToken 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : isUserRemoved 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {postexToken ? 'Active' : isUserRemoved ? 'Removed by User (Saved for Admin)' : 'Not Configured'}
                          </span>
                        </div>
                        {effectiveToken && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleCreds(`postex_${selectedUser.id}`)}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-medium"
                            >
                              {showCredentials[`postex_${selectedUser.id}`] ? 'Hide' : 'Show'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(effectiveToken)
                                setFeedbackMsg({ text: 'PostEx token copied to clipboard.' })
                                setTimeout(() => setFeedbackMsg(null), 2500)
                              }}
                              className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition cursor-pointer font-medium"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="p-2 bg-white dark:bg-slate-950/80 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                        {effectiveToken ? (
                          showCredentials[`postex_${selectedUser.id}`] ? effectiveToken : '••••••••••••••••••••••••••••••••••••••••'
                        ) : (
                          <span className="text-slate-400 italic">Not configured</span>
                        )}
                      </p>
                      {isUserRemoved && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                          Token was removed on merchant dashboard. Preserved in Admin Archive.
                        </p>
                      )}
                    </div>
                  )
                })()}

                {/* 2. AI Engine Summary */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Active AI Engine</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">
                      {aiProvider} <span className="text-slate-400 font-mono font-normal text-[11px] lowercase">({activeAiModel})</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    AI Active
                  </span>
                </div>

                {/* 3. Gemini API Keys (Current Active) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Google Gemini Keys ({geminiKeys.length})</span>
                    <span className="text-[9px] text-slate-400 font-mono">{userSettings.gemini_model || 'gemini-3.5-flash'}</span>
                  </div>
                  {geminiKeys.length === 0 ? (
                    (() => {
                      const archivedGemini = apiHistory.filter((h: any) => h.provider === 'gemini')
                      return archivedGemini.length > 0 ? (
                        <div className="p-2.5 bg-amber-500/[0.04] dark:bg-amber-950/[0.1] border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs">
                          {archivedGemini.length} previous Gemini key(s) removed on merchant side • Preserved in Admin Archive below
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs italic">
                          No active Gemini keys configured
                        </div>
                      )
                    })()
                  ) : (
                    geminiKeys.map((keyVal, idx) => {
                      const credKey = `gemini_${selectedUser.id}_${idx}`
                      const isShown = showCredentials[credKey]
                      return (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                                Gemini API Key #{idx + 1}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                                Active
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleCreds(credKey)}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-medium"
                              >
                                {isShown ? 'Hide' : 'Show'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(keyVal)
                                  setFeedbackMsg({ text: `Gemini Key #${idx + 1} copied.` })
                                  setTimeout(() => setFeedbackMsg(null), 2500)
                                }}
                                className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition cursor-pointer font-medium"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <p className="p-2 bg-white dark:bg-slate-950/80 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                            {isShown ? keyVal : '••••••••••••••••••••••••••••••••••••••••'}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* 4. Groq API Keys (Current Active) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Groq LLaMA Keys ({groqKeys.length})</span>
                    <span className="text-[9px] text-slate-400 font-mono">{userSettings.groq_model || 'llama-3.3-70b-versatile'}</span>
                  </div>
                  {groqKeys.length === 0 ? (
                    (() => {
                      const archivedGroq = apiHistory.filter((h: any) => h.provider === 'groq')
                      return archivedGroq.length > 0 ? (
                        <div className="p-2.5 bg-amber-500/[0.04] dark:bg-amber-950/[0.1] border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs">
                          {archivedGroq.length} previous Groq key(s) removed on merchant side • Preserved in Admin Archive below
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs italic">
                          No active Groq keys configured
                        </div>
                      )
                    })()
                  ) : (
                    groqKeys.map((keyVal, idx) => {
                      const credKey = `groq_${selectedUser.id}_${idx}`
                      const isShown = showCredentials[credKey]
                      return (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                                Groq API Key #{idx + 1}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-bold">
                                Active
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleCreds(credKey)}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-medium"
                              >
                                {isShown ? 'Hide' : 'Show'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(keyVal)
                                  setFeedbackMsg({ text: `Groq Key #${idx + 1} copied.` })
                                  setTimeout(() => setFeedbackMsg(null), 2500)
                                }}
                                className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition cursor-pointer font-medium"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <p className="p-2 bg-white dark:bg-slate-950/80 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                            {isShown ? keyVal : '••••••••••••••••••••••••••••••••••••••••'}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* 5. Additional AI Provider Keys */}
                {otherAiKeys.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Other AI Providers ({otherAiKeys.length})</span>
                    {otherAiKeys.map((item, idx) => {
                      const credKey = `other_${selectedUser.id}_${idx}`
                      const isShown = showCredentials[credKey]
                      return (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                              {item.name} API Key
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleCreds(credKey)}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-medium"
                              >
                                {isShown ? 'Hide' : 'Show'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.key)
                                  setFeedbackMsg({ text: `${item.name} key copied.` })
                                  setTimeout(() => setFeedbackMsg(null), 2500)
                                }}
                                className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition cursor-pointer font-medium"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <p className="p-2 bg-white dark:bg-slate-950/80 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                            {isShown ? item.key : '••••••••••••••••••••••••••••••••••••••••'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 6. Previous & Changed APIs Archive (Newest to Oldest) */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Previous & Changed APIs Archive ({apiHistory.length})
                      </h4>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                        Admin Vault
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Newest to Oldest</span>
                  </div>

                  {apiHistory.length === 0 ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs text-center">
                      No previous or replaced API keys recorded yet for this merchant.
                    </div>
                  ) : (
                    apiHistory.map((item: any, idx: number) => {
                      const credKey = `hist_${selectedUser.id}_${item.id || idx}`
                      const isShown = showCredentials[credKey]
                      const providerBadgeColor = 
                        item.provider === 'postex' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                        item.provider === 'gemini' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                        item.provider === 'groq' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'

                      return (
                        <div key={item.id || idx} className="p-3 bg-amber-500/[0.03] dark:bg-amber-950/[0.08] border border-amber-500/20 dark:border-amber-500/15 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${providerBadgeColor}`}>
                                {item.provider}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {item.key_label || 'API Key'}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                item.action === 'removed' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                                {item.action === 'removed' ? 'Removed' : 'Replaced'}
                              </span>
                              {item.old_model && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  model: {item.old_model}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleCreds(credKey)}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-medium"
                              >
                                {isShown ? 'Hide' : 'Show'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.api_key)
                                  setFeedbackMsg({ text: `Archived ${item.key_label} copied.` })
                                  setTimeout(() => setFeedbackMsg(null), 2500)
                                }}
                                className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition cursor-pointer font-medium"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-slate-950/80 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                            {isShown ? item.api_key : '••••••••••••••••••••••••••••••••••••••••'}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>Changed/Removed: {new Date(item.replaced_at).toLocaleString()}</span>
                            <span className="font-mono text-[9px] text-slate-400">Archived for Admin</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })()}

          {/* Courier Settings & Codes */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Courier Settings & Codes</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Pickup Code', val: selectedUser.settings?.settings?.postex_pickup || 'N/A' },
                { label: 'Return Code', val: selectedUser.settings?.settings?.postex_return || 'N/A' },
                { label: 'Return City', val: selectedUser.settings?.settings?.postex_return_city || 'N/A' },
                { label: 'Order Type', val: selectedUser.settings?.settings?.postex_type || 'Normal' }
              ].map(item => (
                <div key={item.label} className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{item.label}</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Merchant Activity ({selectedUserLogs.length})</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {selectedUserLogs.length === 0 ? (
                <p className="p-4 text-center text-slate-400 text-xs">No activity logs recorded.</p>
              ) : (
                pagedLogs.map(l => (
                  <div key={l.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                        {l.action.replace('_', ' ')}
                      </span>
                      {l.details && <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{l.details}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <SharedPagination
              currentPage={logsPage}
              totalItems={totalLogs}
              pageSize={logsPageSize}
              onPageChange={setLogsPage}
              onPageSizeChange={setLogsPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200, 300]}
              itemLabel="activity logs"
              className="mt-3"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full max-w-full min-w-0">
      
      {/* Left Column: Users List */}
      <div className="lg:col-span-1 bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Registered Merchants ({users.length})</h3>
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <input
              type="text"
              value={filterEmail}
              onChange={e => setFilterEmail(e.target.value)}
              placeholder="Search merchant email..."
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 absolute left-3 top-2.5">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[480px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-xs py-8 text-slate-400">No merchants found.</p>
          ) : (
            filteredUsers.map(u => {
              const isSelected = selectedUser?.id === u.id
              const userActionsCount = logs.filter(l => l.user_id === u.id).length
              
              return (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`w-full text-left p-3 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
                    isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-500 pl-2.5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Row 1: Avatar, Email, Admin badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar email={u.email} avatarUrl={(u.settings as any)?.avatar_url || (u.settings as any)?.settings?.avatar_url} size="sm" />
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {u.email}
                      </p>
                    </div>
                    {u.role === 'admin' && (
                      <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Row 2: Status, PostEx Live, AI Set, Actions count */}
                  <div className="flex flex-wrap items-center gap-1.5 pl-9 text-[10px]">
                    {!!(u.is_blocked || u.status === 'suspended' || (u.settings as any)?.settings?.is_blocked) ? (
                      <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.2 rounded font-bold">Paused</span>
                    ) : (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold">Active</span>
                    )}
                    {!!(u.settings as any)?.settings?.postex_token ? (
                      <span className="text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-1.5 py-0.2 rounded font-bold">PostEx Live</span>
                    ) : (
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium">No Courier</span>
                    )}
                    {!!((u.settings as any)?.settings?.gemini_api_key || (u.settings as any)?.settings?.groq_api_key) && (
                      <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.2 rounded font-bold">AI Set</span>
                    )}
                    <span className="text-[9px] text-slate-400 ml-auto font-mono">
                      {userActionsCount} actions
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Column: Selected Merchant Details (Desktop Split Screen) */}
      <div className="hidden lg:block lg:col-span-2 space-y-6">
        {selectedUser ? (
          renderMerchantDetails(false)
        ) : (
          <div className="bg-white dark:bg-[#0c121e] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl py-20 text-center">
            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Select a Merchant</h4>
            <p className="text-xs text-slate-400">Click any merchant on the left to inspect configurations and logs.</p>
          </div>
        )}
      </div>

      {/* Mobile Drawer Overlay: Bottom Sheet for Selected Merchant */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 lg:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0c121e] rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl z-10 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
            {renderMerchantDetails(true)}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminDeleteMerchantModal
        isOpen={isDeleteDialogOpen}
        merchant={selectedUser}
        confirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isBusy={isActionBusy}
      />

    </div>
  )
}

