import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { UserProfile, LogEntry, CustomerEntry } from './admin/types'
import { AdminStatsBar } from './admin/AdminStatsBar'
import { AdminMerchantsTab } from './admin/AdminMerchantsTab'
import { AdminCustomerDirectoryTab } from './admin/AdminCustomerDirectoryTab'
import { ScrollableChipsBar } from './common/ScrollableChipsBar'

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [customers, setCustomers] = useState<CustomerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Tab state: restore from URL hash or localStorage so refresh lands on the exact same tab
  const [adminTab, setAdminTabState] = useState<'merchants' | 'customers'>(() => {
    try {
      const hash = (window.location.hash || '').toLowerCase()
      if (hash.includes('customer')) return 'customers'
      if (hash.includes('merchant')) return 'merchants'
      const saved = localStorage.getItem('admin_active_tab')
      if (saved === 'customers' || saved === 'merchants') return saved
    } catch {}
    return 'merchants'
  })

  const setAdminTab = (tab: 'merchants' | 'customers') => {
    setAdminTabState(tab)
    try {
      localStorage.setItem('admin_active_tab', tab)
      window.history.replaceState(null, '', `#admin/${tab}`)
    } catch {}
  }

  // Sync hash changes (back/forward)
  useEffect(() => {
    const handleHash = () => {
      const hash = (window.location.hash || '').toLowerCase()
      if (hash.includes('#admin/customer') || hash.includes('#admin?tab=customer')) {
        setAdminTabState('customers')
      } else if (hash.includes('#admin/merchant') || hash.includes('#admin?tab=merchant')) {
        setAdminTabState('merchants')
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Sync URL hash on mount if currently just #admin
  useEffect(() => {
    const hash = (window.location.hash || '').toLowerCase()
    if (hash === '#admin') {
      window.history.replaceState(null, '', `#admin/${adminTab}`)
    }
  }, [adminTab])

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  // Load all users and logs
  const fetchAdminData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch all users
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          role, 
          status,
          is_blocked,
          created_at,
          settings:user_settings (settings)
        `)
        .order('created_at', { ascending: false })

      if (usersErr) throw usersErr
      const mappedUsers = (usersData || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        is_blocked: !!(u.is_blocked || (u.settings as any)?.settings?.is_blocked),
        created_at: u.created_at,
        settings: u.settings
      }))
      setUsers(mappedUsers)
      setSelectedUser(prev => {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
        if (!isDesktop) {
          if (!prev) return null
          const found = mappedUsers.find(mu => mu.id === prev.id)
          return found || null
        }
        if (!prev) return mappedUsers[0] || null
        const found = mappedUsers.find(mu => mu.id === prev.id)
        return found || mappedUsers[0] || null
      })

      // 2. Fetch all usage logs
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

      // 3. Fetch all customers (permanent directory spanning years)
      const { data: customersData, error: customersErr } = await supabase
        .from('customers')
        .select(`
          id,
          user_id,
          phone,
          name,
          city,
          address,
          source,
          created_at,
          updated_at,
          user:users (email)
        `)
        .order('updated_at', { ascending: false })
        .limit(25000)

      if (customersErr) {
        console.error('Error fetching customers:', customersErr)
      }
      setCustomers((customersData || []).map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        phone: c.phone,
        name: c.name,
        city: c.city || '',
        address: c.address || '',
        source: c.source || 'app',
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

  const handleSelectUser = async (u: UserProfile) => {
    setSelectedUser(u)
    try {
      const { data, error: err } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', u.id)
        .maybeSingle()

      if (!err && data && data.settings) {
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

  // Deduplicate combined customers (DB customers + Cached Portal customers)
  const uniqueCustomers = (() => {
    const seenPhones = new Map<string, CustomerEntry>()
    for (const c of customers) {
      const clean = (c.phone || '').replace(/\D/g, '')
      if (clean && !seenPhones.has(clean)) seenPhones.set(clean, c)
    }
    try {
      const raw = localStorage.getItem('zaynah_admin_customers_portal_v2')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          for (const pc of parsed) {
            const clean = (pc.phone || '').replace(/\D/g, '')
            if (clean && !seenPhones.has(clean)) seenPhones.set(clean, pc)
          }
        }
      }
    } catch {}
    return Array.from(seenPhones.values())
  })()

  // Compute metrics
  const totalUsers = users.length
  const liveCouriers = users.filter(u => !!(u.settings as any)?.settings?.postex_token).length
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
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading admin control panel...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl max-w-xl mx-auto mt-8 text-center">
        <h3 className="text-base font-bold text-rose-800 dark:text-rose-300 mb-1">Authorization/Fetch Error</h3>
        <p className="text-xs text-rose-700 dark:text-rose-400 mb-4">{error}</p>
        <button
          onClick={fetchAdminData}
          className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
        >
          Try Reloading
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Overview Stats Bar */}
      <AdminStatsBar
        totalUsers={totalUsers}
        activeUsersTodayCount={activeUsersTodayCount}
        liveCouriers={liveCouriers}
        totalBookings={totalBookings}
        totalCustomers={totalCustomers}
      />

      {/* 2. Sub-tab Navigation (Segmented Control) */}
      <ScrollableChipsBar
        className="w-fit max-w-full"
        containerClassName="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-x-auto no-scrollbar"
        fadeColorClass={{
          left: 'from-slate-100 via-slate-100/90 to-transparent dark:from-slate-900 dark:via-slate-900/90',
          right: 'from-slate-100 via-slate-100/90 to-transparent dark:from-slate-900 dark:via-slate-900/90'
        }}
      >
        <button
          onClick={() => setAdminTab('merchants')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'merchants'
              ? 'bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Merchants ({users.length})
        </button>
        <button
          onClick={() => setAdminTab('customers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'customers'
              ? 'bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Customer Directory ({uniqueCustomers.length})
        </button>
      </ScrollableChipsBar>

      {/* 3. Render Tab Content */}
      {adminTab === 'merchants' ? (
        <AdminMerchantsTab
          users={users}
          logs={logs}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          onSelectUser={handleSelectUser}
          onRefresh={fetchAdminData}
        />
      ) : (
        <AdminCustomerDirectoryTab
          customers={uniqueCustomers}
          users={users}
        />
      )}
    </div>
  )
}
