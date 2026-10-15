import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { UserAvatar } from './common/UserAvatar'

interface UserProfile {
  id: string
  email: string
  role: string
  created_at: string
  settings?: {
    settings: any
  } | null
}

interface LogEntry {
  id: string
  user_id: string
  action: string
  details: string | null
  created_at: string
}

interface CustomerEntry {
  id: string
  user_id: string
  phone: string
  name: string
  created_at: string
  updated_at?: string
  user?: {
    email: string
  } | null
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [selectedUserLogs, setSelectedUserLogs] = useState<LogEntry[]>([])
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({})
  const [filterEmail, setFilterEmail] = useState('')
  const [logsPage, setLogsPage] = useState(1)
  const LOGS_PER_PAGE = 10

  const [adminTab, setAdminTab] = useState<'merchants' | 'customers'>('merchants')
  const [customers, setCustomers] = useState<CustomerEntry[]>([])
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterMerchant, setFilterMerchant] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Load all users and logs
  const fetchAdminData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch all users (RULE D13: snake_case 'users' table)
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          role, 
          created_at,
          settings:user_settings (settings)
        `)
        .order('created_at', { ascending: false })

      if (usersErr) throw usersErr
      // Map to UI shape
      setUsers((usersData || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        settings: u.settings
      })))

      // 2. Fetch all usage logs (RULE D13: snake_case 'usage_logs', 'user_id', 'created_at')
      const { data: logsData, error: logsErr } = await supabase
        .from('usage_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (logsErr) throw logsErr
      setLogs((logsData || []).map((l: any) => ({
        id: l.id,
        user_id: l.user_id,
        action: l.action,
        details: l.details,
        created_at: l.created_at
      })))

      // 3. Fetch all customers (RULE D13: snake_case 'customers', 'user_id')
      const { data: customersData, error: customersErr } = await supabase
        .from('customers')
        .select(`
          id,
          user_id,
          phone,
          name,
          created_at,
          updated_at,
          user:users (email)
        `)
        .order('updated_at', { ascending: false })

      if (customersErr) {
        console.error('Error fetching customers:', customersErr)
      }
      setCustomers((customersData || []).map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        phone: c.phone,
        name: c.name,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user: c.user
      })) as CustomerEntry[])

    } catch (err: any) {
      console.error('Error fetching admin dashboard data:', err)
      setError(err.message || 'Failed to fetch admin statistics. Make sure your account has admin privileges.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  // Auto-update user logs if selected user changes; reset pagination
  useEffect(() => {
    if (selectedUser) {
      const filtered = logs.filter(l => l.user_id === selectedUser.id)
      setSelectedUserLogs(filtered)
      setLogsPage(1)
    } else {
      setSelectedUserLogs([])
      setLogsPage(1)
    }
  }, [selectedUser, logs])

  // Toggle credential showing
  const toggleCreds = (key: string) => {
    setShowCredentials(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSelectUser = async (u: UserProfile) => {
    setSelectedUser(u)
    try {
      // RULE D13: snake_case 'user_settings', 'user_id'
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', u.id)
        .maybeSingle()

      if (!error && data && data.settings) {
        const freshSettings = data.settings
        setSelectedUser(prev => prev && prev.id === u.id ? {
          ...prev,
          settings: {
            settings: freshSettings
          }
        } : prev)

        setUsers(prevUsers => prevUsers.map(user => user.id === u.id ? {
          ...user,
          settings: {
            settings: freshSettings
          }
        } : user))
      }
    } catch (err) {
      console.error('Error loading fresh settings for merchant:', err)
    }
  }

  // Filter users by email search
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(filterEmail.toLowerCase())
  )

  // Deduplicate customers by phone — keep newest entry per phone number
  const uniqueCustomers = (() => {
    const seenPhones = new Map<string, CustomerEntry>()
    for (const c of customers) {
      if (!seenPhones.has(c.phone)) seenPhones.set(c.phone, c)
    }
    return Array.from(seenPhones.values())
  })()

  // Compute overall stats
  const totalUsers = users.length
  const totalAIparses = logs.filter(l => l.action === 'order_parsed').length
  const totalBookings = logs.filter(l => l.action === 'order_booked').length
  const totalCustomers = uniqueCustomers.length
  const activeUsersTodayCount = new Set(
    logs
      .filter(l => new Date(l.created_at).toDateString() === new Date().toDateString())
      .map(l => l.user_id)
  ).size



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">Loading admin control panel...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-2xl max-w-xl mx-auto mt-8 text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-1">Authorization/Fetch Error</h3>
        <p className="text-sm text-red-700 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-red-650 dark:bg-red-700 hover:bg-red-750 dark:hover:bg-red-800 text-[#ffffff] font-semibold rounded-xl text-xs transition"
        >
          Try Reloading
        </button>
      </div>
    )
  }

  // Filter customers by search term, merchant, and date range
  const filteredCustomers = uniqueCustomers.filter(c => {
    const matchesSearch = !filterCustomer ||
      (c.name || '').toLowerCase().includes(filterCustomer.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(filterCustomer.toLowerCase()) ||
      (c.user?.email || '').toLowerCase().includes(filterCustomer.toLowerCase())

    const matchesMerchant = filterMerchant === 'all' || c.user_id === filterMerchant

    let matchesDate = true
    const effectiveDate = c.updated_at || c.created_at
    if (startDate) {
      const sDate = new Date(startDate)
      sDate.setHours(0, 0, 0, 0)
      const cDate = new Date(effectiveDate)
      if (cDate < sDate) matchesDate = false
    }
    if (endDate) {
      const eDate = new Date(endDate)
      eDate.setHours(23, 59, 59, 999)
      const cDate = new Date(effectiveDate)
      if (cDate > eDate) matchesDate = false
    }

    return matchesSearch && matchesMerchant && matchesDate
  })

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return
    const headers = ['Customer Name', 'Customer Phone', 'WhatsApp Link', 'Date Added']
    const rows = filteredCustomers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"https://wa.me/${c.phone.replace(/\D/g,'').replace(/^0/, '92')}"`,
      new Date(c.created_at).toLocaleString()
    ])
    
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_directory_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Merchants</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1.5">{totalUsers}</span>
        </div>
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Active Today</span>
          <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">{activeUsersTodayCount}</span>
        </div>
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">Total AI Parses</span>
          <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1.5">{totalAIparses}</span>
        </div>
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Total Booked</span>
          <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">{totalBookings}</span>
        </div>
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">Total Customers</span>
          <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1.5">{totalCustomers}</span>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setAdminTab('merchants')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            adminTab === 'merchants'
              ? 'border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-650 dark:hover:text-gray-300'
          }`}
        >
          Merchants
        </button>
        <button
          onClick={() => setAdminTab('customers')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            adminTab === 'customers'
              ? 'border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-650 dark:hover:text-gray-300'
          }`}
        >
          Customer Directory ({uniqueCustomers.length})
        </button>
      </div>

      {adminTab === 'merchants' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Users List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Registered Users ({totalUsers})</h3>
              <button
                onClick={fetchAdminData}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
                title="Refresh Data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>

            <div className="p-3 border-b border-gray-150 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={filterEmail}
                  onChange={e => setFilterEmail(e.target.value)}
                  placeholder="Search email address..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-800"
                />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[480px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-xs py-8 text-slate-400 dark:text-gray-500">No users found.</p>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selectedUser?.id === u.id
                  const userActionsCount = logs.filter(l => l.user_id === u.id).length
                  
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`w-full text-left p-3.5 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50/70 dark:bg-emerald-900/30 border-l-4 border-emerald-500 dark:border-emerald-400 pl-2.5' : 'hover:bg-slate-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <UserAvatar email={u.email} avatarUrl={u.settings?.avatar_url || u.settings?.settings?.avatar_url} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{u.email}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            Joined: {new Date(u.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {u.role === 'admin' && (
                          <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">Admin</span>
                        )}
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {userActionsCount} logs
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Expanded User Details & Usage logs */}
          <div className="lg:col-span-2 space-y-6">
            {selectedUser ? (
              <>
                {/* Credentials & Settings Details */}
              <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar email={selectedUser.email} avatarUrl={selectedUser.settings?.avatar_url || selectedUser.settings?.settings?.avatar_url} size="md" />
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Merchant Configuration</h3>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{selectedUser.email}</p>
                        </div>
                      </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-6 max-h-[600px] overflow-y-auto">
                    {/* API Credentials */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">API Keys & Tokens</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* PostEx Token */}
                        <div className="p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl relative">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">PostEx API Token</p>
                          <p className="text-xs font-mono text-gray-800 dark:text-gray-100 break-all mt-1 pr-10">
                            {selectedUser.settings?.settings?.postex_token ? (
                              showCredentials[`postex_${selectedUser.id}`] ? (
                                selectedUser.settings.settings.postex_token
                              ) : (
                                '••••••••••••••••••••••••'
                              )
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 font-sans italic">Not configured</span>
                            )}
                          </p>
                          {selectedUser.settings?.settings?.postex_token && (
                            <button
                              onClick={() => toggleCreds(`postex_${selectedUser.id}`)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-655 cursor-pointer p-1"
                            >
                              {showCredentials[`postex_${selectedUser.id}`] ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM10.89 12.012l-1.9-1.9A2.002 2.002 0 009 11v.5a.5.5 0 00.5.5h.5c.345 0 .662-.087.94-.238l-.05-.05z" /><path d="M11.968 11.968c.324-.324.532-.767.532-1.258V10a2.5 2.5 0 00-2.5-2.5h-.71c-.49 0-.934.208-1.258.532l1.414 1.414a1 1 0 011.054 1.054l1.414 1.414z" /><path fillRule="evenodd" d="M1.636 10.566a.75.75 0 010-1.132 11.233 11.233 0 0116.728 0 .75.75 0 010 1.132 11.233 11.233 0 01-16.728 0zm1.758-1.047a9.733 9.733 0 0013.212 0 9.733 9.733 0 00-13.212 0z" clipRule="evenodd" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 9.505a.75.75 0 000 1.01 11.24 11.24 0 0018.672 0 .75.75 0 000-1.01A11.24 11.24 0 00.664 9.505zM10 14a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" /></svg>
                              )}
                            </button>
                          )}
                        </div>

                        {/* All AI Providers Keys */}
                        {[
                          { id: 'groq', label: 'Groq API Key(s)', field: 'groq_api_key' },
                          { id: 'gemini', label: 'Gemini API Key(s)', field: 'gemini_api_key' },
                          { id: 'openai', label: 'OpenAI API Key(s)', field: 'openai_api_key' },
                          { id: 'openrouter', label: 'OpenRouter API Key(s)', field: 'openrouter_api_key' },
                          { id: 'anthropic', label: 'Anthropic API Key(s)', field: 'anthropic_api_key' },
                          { id: 'deepseek', label: 'DeepSeek API Key(s)', field: 'deepseek_api_key' },
                          { id: 'kimi', label: 'Kimi API Key(s)', field: 'kimi_api_key' },
                          { id: 'mistral', label: 'Mistral API Key(s)', field: 'mistral_api_key' }
                        ].map(({ id, label, field }) => {
                          const val = selectedUser.settings?.settings?.[field]
                          const credentialId = `${id}_${selectedUser.id}`
                          return (
                            <div key={id} className="p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl relative">
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{label}</p>
                              <p className="text-xs font-mono text-gray-800 dark:text-gray-100 break-all mt-1 pr-10 whitespace-pre-wrap">
                                {val ? (
                                  showCredentials[credentialId] ? (
                                    val
                                  ) : (
                                    '••••••••••••••••••••••••'
                                  )
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500 font-sans italic">Not configured</span>
                                )}
                              </p>
                              {val && (
                                <button
                                  onClick={() => toggleCreds(credentialId)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-655 cursor-pointer p-1"
                                >
                                  {showCredentials[credentialId] ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM10.89 12.012l-1.9-1.9A2.002 2.002 0 009 11v.5a.5.5 0 00.5.5h.5c.345 0 .662-.087.94-.238l-.05-.05z" /><path d="M11.968 11.968c.324-.324.532-.767.532-1.258V10a2.5 2.5 0 00-2.5-2.5h-.71c-.49 0-.934.208-1.258.532l1.414 1.414a1 1 0 011.054 1.054l1.414 1.414z" /><path fillRule="evenodd" d="M1.636 10.566a.75.75 0 010-1.132 11.233 11.233 0 0116.728 0 .75.75 0 010 1.132 11.233 11.233 0 01-16.728 0zm1.758-1.047a9.733 9.733 0 0013.212 0 9.733 9.733 0 00-13.212 0z" clipRule="evenodd" /></svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 9.505a.75.75 0 000 1.01 11.24 11.24 0 0018.672 0 .75.75 0 000-1.01A11.24 11.24 0 00.664 9.505zM10 14a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" /></svg>
                                  )}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Active Provider & Model Info */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Active AI Configuration</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Active Provider</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5 uppercase">
                            {selectedUser.settings?.settings?.ai_provider || 'Groq'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Active Model ID</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5 truncate">
                            {(() => {
                              const provider = selectedUser.settings?.settings?.ai_provider || 'groq'
                              const modelField = `${provider}_model`
                              return selectedUser.settings?.settings?.[modelField] || 'Default'
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Courier details & codes */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Courier Settings & Codes</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Pickup Code</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                            {selectedUser.settings?.settings?.postex_pickup || 'N/A'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Return Code</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                            {selectedUser.settings?.settings?.postex_return || 'N/A'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Return City</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5 truncate">
                            {selectedUser.settings?.settings?.postex_return_city || 'N/A'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Shipment Type</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                            {selectedUser.settings?.settings?.postex_type || 'Normal'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Special Handling</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                            {selectedUser.settings?.settings?.postex_handling || 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pickup & Return Addresses */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">📍 Pickup & Return Addresses</h4>
                      <div className="space-y-2.5">
                        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Pickup Address</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                            {selectedUser.settings?.settings?.postex_pickup
                              ? `Code: ${selectedUser.settings.settings.postex_pickup}`
                              : <span className="italic text-gray-400 dark:text-gray-500 font-normal">Not configured</span>}
                          </p>
                          {(selectedUser.settings?.settings?.postex_pickup_address || selectedUser.settings?.settings?.senderAddress) && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 font-mono bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/20">
                              {selectedUser.settings.settings.postex_pickup_address || selectedUser.settings.settings.senderAddress}
                            </p>
                          )}
                        </div>
                        <div className="p-3 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">Return Address</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                            {selectedUser.settings?.settings?.postex_return
                              ? `Code: ${selectedUser.settings.settings.postex_return}`
                              : <span className="italic text-gray-400 dark:text-gray-500 font-normal">Not configured</span>}
                          </p>
                          {selectedUser.settings?.settings?.postex_return_address && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 font-mono bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/20">
                              {selectedUser.settings.settings.postex_return_address}
                            </p>
                          )}
                          {selectedUser.settings?.settings?.postex_return_city && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                              Return City: <span className="font-bold">{selectedUser.settings.settings.postex_return_city}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Parcel Defaults */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Parcel Defaults</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Weight (kg)</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                            {selectedUser.settings?.settings?.default_weight || '0.5'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Items count</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                            {selectedUser.settings?.settings?.default_items || '3'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg col-span-2 sm:col-span-2">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Product Detail</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5 truncate">
                            {selectedUser.settings?.settings?.default_product || 'N/A'}
                          </p>
                        </div>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg col-span-2 sm:col-span-4">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Delivery Note</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                            {selectedUser.settings?.settings?.default_note || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sync & Print Rules */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Sync & Print Rules</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: 'Print Item Name', val: selectedUser.settings?.settings?.postex_product_check },
                          { label: 'Print SKU Name', val: selectedUser.settings?.settings?.postex_sku_check },
                          { label: 'Auto Calc Weight', val: selectedUser.settings?.settings?.postex_weight_check },
                          { label: 'Auto Calc Pieces', val: selectedUser.settings?.settings?.postex_pieces_check },
                          { label: 'Non-COD COD as 0', val: selectedUser.settings?.settings?.postex_cod_check },
                          { label: 'Print Note Remarks', val: selectedUser.settings?.settings?.postex_notes_check }
                        ].map((rule, idx) => (
                          <div key={idx} className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg flex items-center justify-between">
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">{rule.label}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.25 rounded ${rule.val === '1' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                              {rule.val === '1' ? 'YES' : 'NO'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* WhatsApp Template & Suffix Note */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">WhatsApp Templates & Notes</h4>
                      <div className="space-y-2.5">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">WhatsApp Template</p>
                          <p className="text-[11px] font-mono text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 rounded whitespace-pre-wrap">
                            {selectedUser.settings?.settings?.whatsapp_template || 'N/A'}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Suffix Note</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                            {selectedUser.settings?.settings?.whatsapp_note || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Logs — Paginated */}
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(selectedUserLogs.length / LOGS_PER_PAGE))
                  const pagedLogs = selectedUserLogs.slice((logsPage - 1) * LOGS_PER_PAGE, logsPage * LOGS_PER_PAGE)
                  return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-2xl shadow-xs overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                          Merchant Activity Logs
                          <span className="ml-2 text-[10px] font-normal text-gray-400 dark:text-gray-500">({selectedUserLogs.length} total)</span>
                        </h3>
                        {selectedUserLogs.length > 0 && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            Page {logsPage} / {totalPages}
                          </span>
                        )}
                      </div>

                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {selectedUserLogs.length === 0 ? (
                          <p className="text-center text-xs py-8 text-slate-400 dark:text-gray-500">No activity logs recorded for this merchant.</p>
                        ) : (
                          pagedLogs.map(l => (
                            <div key={l.id} className="p-3.5 text-xs">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`px-2 py-0.5 rounded font-semibold text-[10px] tracking-wide uppercase ${
                                  l.action === 'order_booked'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                    : l.action === 'order_parsed'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                    : l.action === 'order_cancelled'
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  {l.action.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                                  {new Date(l.created_at).toLocaleString()}
                                </span>
                              </div>
                              {l.details && (
                                <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-mono text-[11px] bg-slate-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2 rounded-lg break-all">
                                  {l.details}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                            disabled={logsPage === 1}
                            className="px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                          >
                            ← Prev
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                              <button
                                key={p}
                                onClick={() => setLogsPage(p)}
                                className={`w-6 h-6 text-[10px] font-bold rounded-md transition cursor-pointer ${
                                  p === logsPage
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))}
                            disabled={logsPage === totalPages}
                            className="px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="bg-slate-50/50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl py-24 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 dark:text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">Select a Merchant</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500">Choose a merchant from the list on the left to inspect configurations and logs.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Customer Database ({filteredCustomers.length})</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Globally unique customers — each phone number appears only once across all merchants</p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={filteredCustomers.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="p-4 border-b border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={filterCustomer}
                onChange={e => setFilterCustomer(e.target.value)}
                placeholder="Search by customer name or phone number..."
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-800"
              />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3.5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Merchant and Date Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              {/* Merchant Dropdown */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Merchant / User</label>
                <select
                  value={filterMerchant}
                  onChange={e => setFilterMerchant(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 h-9"
                >
                  <option value="all">All Merchants</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 h-9"
                />
              </div>

              {/* End Date */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 h-9"
                />
              </div>

              {/* Clear Filters Button */}
              {(filterMerchant !== 'all' || startDate || endDate || filterCustomer) && (
                <button
                  onClick={() => {
                    setFilterMerchant('all')
                    setStartDate('')
                    setEndDate('')
                    setFilterCustomer('')
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer h-9 shrink-0 flex items-center justify-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile responsive card list */}
          <div className="block sm:hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800">
            {filteredCustomers.length === 0 ? (
              <p className="text-center text-xs py-12 text-slate-400 dark:text-gray-500">No customers found in database.</p>
            ) : (
              filteredCustomers.map(c => {
                const rawPhone = (c.phone || '').replace(/\D/g, '')
                const waPhone = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone
                return (
                  <div key={c.id} className="p-4 space-y-2 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100">{c.name}</h4>
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition shrink-0"
                      >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{c.phone}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop/Tablet table view */}
          <div className="hidden sm:block overflow-x-auto bg-white dark:bg-gray-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-150 dark:border-gray-700">
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Date Added</th>
                  <th className="px-4 py-3 text-center">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-xs">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400 dark:text-gray-500">No customers found in database.</td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => {
                    const rawPhone = (c.phone || '').replace(/\D/g, '')
                    const waPhone = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3.5 font-bold text-gray-800 dark:text-gray-100">{c.name}</td>
                        <td className="px-4 py-3.5 font-mono text-gray-600 dark:text-gray-300">{c.phone}</td>
                        <td className="px-4 py-3.5 text-gray-400 dark:text-gray-500">
                          {new Date(c.created_at).toLocaleDateString()} at {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition shadow-sm shadow-emerald-500/20"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                            </svg>
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
