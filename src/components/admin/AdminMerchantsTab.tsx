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
          {/* PostEx Token */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">PostEx Credentials</h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative">
              <p className="text-[10px] text-slate-400 font-bold uppercase">PostEx API Token</p>
              <p className="text-xs font-mono text-slate-800 dark:text-slate-100 break-all mt-1 pr-10">
                {selectedUser.settings?.settings?.postex_token ? (
                  showCredentials[`postex_${selectedUser.id}`] ? (
                    selectedUser.settings.settings.postex_token
                  ) : (
                    '••••••••••••••••••••••••'
                  )
                ) : (
                  <span className="text-slate-400 italic">Not configured</span>
                )}
              </p>
              {selectedUser.settings?.settings?.postex_token && (
                <button
                  onClick={() => toggleCreds(`postex_${selectedUser.id}`)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showCredentials[`postex_${selectedUser.id}`] ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          </div>

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
                  className={`w-full text-left p-3.5 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-500 pl-2.5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <UserAvatar email={u.email} avatarUrl={(u.settings as any)?.avatar_url || (u.settings as any)?.settings?.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{u.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Joined: {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!!(u.is_blocked || u.status === 'suspended' || (u.settings as any)?.settings?.is_blocked) ? (
                      <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">Paused</span>
                    ) : (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">Active</span>
                    )}
                    {!!(u.settings as any)?.settings?.postex_token ? (
                      <span className="text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-bold">API Live</span>
                    ) : (
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">No API</span>
                    )}
                    {u.role === 'admin' && (
                      <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>
                    )}
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
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

