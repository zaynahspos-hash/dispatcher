import React, { useState, useEffect } from 'react'
import { UserProfile, LogEntry } from './types'
import { UserAvatar } from '../common/UserAvatar'

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
  const [logsPage, setLogsPage] = useState(1)
  const LOGS_PER_PAGE = 10

  useEffect(() => {
    if (!selectedUser && users.length > 0) {
      onSelectUser(users[0])
    }
  }, [users, selectedUser, onSelectUser])

  const toggleCreds = (key: string) => {
    setShowCredentials(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(filterEmail.toLowerCase())
  )

  const selectedUserLogs = selectedUser ? logs.filter(l => l.user_id === selectedUser.id) : []
  const totalPages = Math.max(1, Math.ceil(selectedUserLogs.length / LOGS_PER_PAGE))
  const pagedLogs = selectedUserLogs.slice((logsPage - 1) * LOGS_PER_PAGE, logsPage * LOGS_PER_PAGE)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
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
                    {u.role === 'admin' && (
                      <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>
                    )}
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {userActionsCount}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Column: Selected Merchant Details */}
      <div className="lg:col-span-2 space-y-6">
        {selectedUser ? (
          <>
            <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
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
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-6 max-h-[600px] overflow-y-auto text-xs">
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
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Pickup Code</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        {selectedUser.settings?.settings?.postex_pickup || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Return Code</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        {selectedUser.settings?.settings?.postex_return || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Return City</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                        {selectedUser.settings?.settings?.postex_return_city || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Order Type</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        {selectedUser.settings?.settings?.postex_type || 'Normal'}
                      </p>
                    </div>
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

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                        disabled={logsPage === 1}
                        className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-slate-400">Page {logsPage} of {totalPages}</span>
                      <button
                        onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))}
                        disabled={logsPage === totalPages}
                        className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-[#0c121e] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl py-20 text-center">
            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Select a Merchant</h4>
            <p className="text-xs text-slate-400">Click any merchant on the left to inspect configurations and logs.</p>
          </div>
        )}
      </div>

    </div>
  )
}
