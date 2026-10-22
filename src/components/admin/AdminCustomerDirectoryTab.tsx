import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { CustomerEntry, UserProfile } from './types'
import { SharedPagination } from '../common/SharedPagination'
import { usePagination } from '../../hooks/usePagination'
import { WhatsAppIcon, RefreshIcon, CalendarIcon, SearchIcon, CloseIcon, AlertIcon } from '../Icons'
import { SearchableDropdown } from '../SearchableDropdown'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'
import { fetchAllMerchantOrders } from '../../utils/postexApi'
import { transformPostExOrders, isMobileDevice, getParcelDateStr, parsePortalDate, getDatePresetsInfo, DatePresetType } from '../history/types'
import { readExternalParcels, writeExternalParcels } from '../../utils/portalParcelStore'
import { idbSaveCustomers, idbGetCustomers } from '../../utils/indexedDbStore'
import { useWhatsAppSentTracker } from '../../hooks/useWhatsAppSentTracker'

interface AdminCustomerDirectoryTabProps {
  customers: CustomerEntry[]
  users: UserProfile[]
}

const ADMIN_PORTAL_CACHE_KEY = 'zaynah_admin_customers_portal_v2'

const loadCachedPortalCustomers = (): CustomerEntry[] => {
  try {
    const raw = localStorage.getItem(ADMIN_PORTAL_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

const saveCachedPortalCustomers = (items: CustomerEntry[]): void => {
  try {
    localStorage.setItem(ADMIN_PORTAL_CACHE_KEY, JSON.stringify(items))
  } catch {}
}

const getMerchantPostExToken = (u: UserProfile): string => {
  const raw: any = u.settings
  if (!raw) return ''
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return (parsed.postex_token || parsed.settings?.postex_token || parsed.postex_api_token || parsed.api_token || '').trim()
    } catch {
      return ''
    }
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const tok = (item?.settings?.postex_token || item?.postex_token || item?.settings?.postex_api_token || item?.postex_api_token || '').trim()
      if (tok) return tok
    }
  }
  if (typeof raw === 'object') {
    return (raw.settings?.postex_token || raw.postex_token || raw.settings?.postex_api_token || raw.postex_api_token || raw.api_token || '').trim()
  }
  return ''
}

const formatDisplayDate = (dateVal?: string): string => {
  if (!dateVal) return '—'
  const ymd = getParcelDateStr(dateVal)
  if (ymd) {
    const parts = ymd.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  }
  const dt = new Date(dateVal)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString()
}

export const AdminCustomerDirectoryTab: React.FC<AdminCustomerDirectoryTabProps> = ({
  customers,
  users
}) => {
  // Date calculation helpers matching Booked History (Single Source of Truth)
  const presetsInfo = getDatePresetsInfo()
  const todayStr = presetsInfo.todayStr
  const last7Str = presetsInfo.last7Str

  // Default to Last 7 Days (exact same as Booked History presets)
  const [startDate, setStartDate] = useState(last7Str)
  const [endDate, setEndDate] = useState(todayStr)
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterMerchant, setFilterMerchant] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [filterSource, setFilterSource] = useState<'all' | 'app' | 'postex_portal'>('all')
  const [filterWhatsapp, setFilterWhatsapp] = useState<'all' | 'pending' | 'sent'>('all')

  // Live PostEx Sync state with matching elapsed seconds timer
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState('')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [portalCustomers, setPortalCustomers] = useState<CustomerEntry[]>(loadCachedPortalCustomers)
  const timerRef = React.useRef<any>(null)

  // Timer increments every second while syncing
  useEffect(() => {
    if (isSyncing) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isSyncing])

  // Load persisted customers from quota-free IndexedDB on mount
  useEffect(() => {
    let isSubscribed = true
    idbGetCustomers().then(cached => {
      if (isSubscribed && cached && cached.length > 0) {
        setPortalCustomers(prev => {
          const map = new Map<string, CustomerEntry>()
          prev.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
          cached.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
          return Array.from(map.values())
        })
      }
    })
    return () => { isSubscribed = false }
  }, [])

  // Listen to cross-tab PostEx sync events from Booked History tab
  useEffect(() => {
    const handleSyncEvent = () => {
      idbGetCustomers().then(cached => {
        if (cached && cached.length > 0) {
          setPortalCustomers(prev => {
            const map = new Map<string, CustomerEntry>()
            prev.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
            cached.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
            return Array.from(map.values())
          })
        }
      })
    }
    window.addEventListener('portal_parcels_synced', handleSyncEvent)
    return () => window.removeEventListener('portal_parcels_synced', handleSyncEvent)
  }, [])

  // WhatsApp Sent Tracker
  const waTracker = useWhatsAppSentTracker('admin_directory')

  const activePreset = presetsInfo.detectPreset(startDate, endDate)

  const handleQuickDate = (type: DatePresetType) => {
    const range = presetsInfo.getRangeForPreset(type)
    setStartDate(range.fromDate)
    setEndDate(range.toDate)
  }

  // Load cached external parcels from portalParcelStore on mount or filter change
  useEffect(() => {
    const rangeStart = startDate || last7Str
    const rangeEnd = endDate || todayStr

    const targetMerchants = filterMerchant === 'all'
      ? users
      : users.filter(u => u.id === filterMerchant)

    const cachedCustomers: CustomerEntry[] = []
    targetMerchants.forEach(m => {
      const parcels = readExternalParcels(m.id, rangeStart, rangeEnd)
      if (parcels.length > 0) {
        parcels.forEach((p, idx) => {
          const rawPhone = (p.phone || '').trim()
          if (!rawPhone) return
          const validDate = parsePortalDate(p.bookingDate)
          cachedCustomers.push({
            id: `portal_cache_${m.id}_${p.tracking || p.id || idx}`,
            user_id: m.id,
            name: p.name || 'Valued Customer',
            phone: rawPhone,
            city: p.city || '',
            address: p.address || '',
            source: 'postex_portal',
            created_at: validDate,
            updated_at: validDate,
            user: { email: m.email }
          })
        })
      }
    })

    if (cachedCustomers.length > 0) {
      setPortalCustomers(prev => {
        const map = new Map<string, CustomerEntry>()
        prev.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
        cachedCustomers.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
        const merged = Array.from(map.values())
        saveCachedPortalCustomers(merged)
        return merged
      })
    }
  }, [filterMerchant, startDate, endDate, users, last7Str, todayStr])

  // PostEx Live Sync handler (called strictly on manual button click to prevent infinite re-render loops)
  const handleSyncPostEx = useCallback(async () => {
    const targetMerchants: UserProfile[] = filterMerchant === 'all'
      ? users.filter(u => !!getMerchantPostExToken(u))
      : users.filter(u => u.id === filterMerchant && !!getMerchantPostExToken(u))

    if (targetMerchants.length === 0) {
      if (filterMerchant !== 'all') {
        const u = users.find(user => user.id === filterMerchant)
        setSyncError(`Merchant ${u?.email || 'selected'} has no PostEx API token configured.`)
      } else {
        setSyncError('No registered merchants currently have a PostEx API token configured.')
      }
      return
    }

    const rangeStart = startDate || last7Str
    const rangeEnd = endDate || todayStr

    setIsSyncing(true)
    setSyncError(null)
    setSyncProgress('Connecting to PostEx API...')

    const newExtracted: CustomerEntry[] = []

    try {
      for (let i = 0; i < targetMerchants.length; i++) {
        const merchant = targetMerchants[i]
        const token = getMerchantPostExToken(merchant)
        setSyncProgress(`Fetching PostEx orders for ${merchant.email} (${i + 1}/${targetMerchants.length})...`)

        try {
          const orders = await fetchAllMerchantOrders(token, rangeStart, rangeEnd, {
            on_progress: msg => setSyncProgress(`${merchant.email}: ${msg}`)
          })

          if (Array.isArray(orders) && orders.length > 0) {
            // Save parcels into portalParcelStore
            const transformedParcels = transformPostExOrders(orders)
            writeExternalParcels(merchant.id, rangeStart, rangeEnd, transformedParcels)

            // Extract customer directory entries with accurate normalized booking dates
            orders.forEach((order, idx) => {
              const rawPhone = (order.customerPhone || '').trim()
              if (!rawPhone) return
              const rawDate = order.transactionDate || order.orderDate || order.bookingDate || order.createdDatetime || order.modifiedDatetime
              const validIsoDate = parsePortalDate(rawDate)

              newExtracted.push({
                id: `portal_${merchant.id}_${order.trackingNumber || order.orderRefNumber || idx}`,
                user_id: merchant.id,
                name: order.customerName || 'Valued Customer',
                phone: rawPhone,
                city: order.cityName || '',
                address: order.deliveryAddress || '',
                source: 'postex_portal',
                created_at: validIsoDate,
                updated_at: validIsoDate,
                user: { email: merchant.email }
              })
            })
          }
        } catch (merchantErr: any) {
          console.warn(`[AdminCustomerDirectory] Failed syncing merchant ${merchant.email}:`, merchantErr)
        }
      }

      setPortalCustomers(prev => {
        const map = new Map<string, CustomerEntry>()
        prev.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
        newExtracted.forEach(c => map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c))
        const merged = Array.from(map.values())
        void idbSaveCustomers(merged)
        saveCachedPortalCustomers(merged.slice(0, 1000))
        return merged
      })

    } catch (err: any) {
      setSyncError(err.message || 'Error syncing with PostEx.')
    } finally {
      setIsSyncing(false)
      setSyncProgress('')
    }
  }, [filterMerchant, users, startDate, endDate, last7Str, todayStr])

  // Combine DB Customers with External Portal Customers
  const allCombinedCustomers = useMemo(() => {
    const map = new Map<string, CustomerEntry>()
    // 1. Add DB customers first
    customers.forEach(c => {
      const cleanPhone = (c.phone || '').replace(/\D/g, '')
      const key = `${c.user_id}_${cleanPhone}`
      map.set(key, c)
    })
    // 2. Add or merge Portal customers
    portalCustomers.forEach(pc => {
      const cleanPhone = (pc.phone || '').replace(/\D/g, '')
      const key = `${pc.user_id}_${cleanPhone}`
      if (!map.has(key)) {
        map.set(key, pc)
      } else {
        // Enrich existing DB customer with city if missing
        const existing = map.get(key)!
        if (!existing.city && pc.city) {
          map.set(key, { ...existing, city: pc.city, address: pc.address || existing.address })
        }
      }
    })
    return Array.from(map.values())
  }, [customers, portalCustomers])

  // Extract unique cities (cleaned and uppercase for unified searchable dropdown)
  const uniqueCities = useMemo(() => {
    const citySet = new Set<string>()
    allCombinedCustomers.forEach(c => {
      if (c.city && c.city.trim()) {
        citySet.add(c.city.trim().toUpperCase())
      }
    })
    return Array.from(citySet).sort()
  }, [allCombinedCustomers])

  // STEP 1: Date and Merchant Filtered Customers
  // Uses identical string date comparison as Booked History (prevents timezone shifts and leaking other dates)
  const dateAndMerchantFiltered = useMemo(() => {
    return allCombinedCustomers.filter(c => {
      // 1. Merchant Filter
      if (filterMerchant !== 'all' && c.user_id !== filterMerchant) {
        return false
      }

      // 2. Date Filter
      if (startDate || endDate) {
        const itemDate = getParcelDateStr(c.created_at || c.updated_at)
        if (startDate && (!itemDate || itemDate < startDate)) return false
        if (endDate && (!itemDate || itemDate > endDate)) return false
      }

      return true
    })
  }, [allCombinedCustomers, filterMerchant, startDate, endDate])

  // STEP 2: Dynamic Source Counts strictly matching the active Date & Merchant filters
  const sourceCounts = useMemo(() => {
    return {
      all: dateAndMerchantFiltered.length,
      app: dateAndMerchantFiltered.filter(c => c.source === 'app' || !c.source).length,
      portal: dateAndMerchantFiltered.filter(c => c.source === 'postex_portal').length
    }
  }, [dateAndMerchantFiltered])

  // STEP 3: Dynamic WhatsApp Counts strictly matching the active Date & Merchant filters
  const whatsappCounts = useMemo(() => {
    let sent = 0
    let pending = 0
    dateAndMerchantFiltered.forEach(c => {
      const phoneDigits = (c.phone || '').replace(/\D/g, '')
      if (waTracker.isSent(c.id) || waTracker.isSent(phoneDigits) || waTracker.isSent(c.phone)) {
        sent++
      } else {
        pending++
      }
    })
    return { all: dateAndMerchantFiltered.length, sent, pending }
  }, [dateAndMerchantFiltered, waTracker.sentSet])

  // STEP 4: Final Filtered Customers (applying Source, City, WhatsApp status, and Search query)
  const filteredCustomers = useMemo(() => {
    return dateAndMerchantFiltered.filter(c => {
      // Source filter
      if (filterSource === 'app' && c.source === 'postex_portal') return false
      if (filterSource === 'postex_portal' && c.source !== 'postex_portal') return false

      // City filter (case-insensitive)
      if (filterCity !== 'all' && (c.city || '').trim().toLowerCase() !== filterCity.trim().toLowerCase()) return false

      // WhatsApp filter
      const phoneDigits = (c.phone || '').replace(/\D/g, '')
      const isSent = waTracker.isSent(c.id) || waTracker.isSent(phoneDigits) || waTracker.isSent(c.phone)
      if (filterWhatsapp === 'sent' && !isSent) return false
      if (filterWhatsapp === 'pending' && isSent) return false

      // Search query
      if (filterCustomer && filterCustomer.trim()) {
        const q = filterCustomer.toLowerCase().trim()
        const matches =
          (c.name || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.user?.email || '').toLowerCase().includes(q)
        if (!matches) return false
      }

      return true
    })
  }, [dateAndMerchantFiltered, filterSource, filterCity, filterWhatsapp, filterCustomer, waTracker.sentSet])

  // Shared Pagination
  const {
    currentPage, setCurrentPage, pageSize, setPageSize,
    totalItems, paginatedItems: paginatedCustomers
  } = usePagination({ items: filteredCustomers, initialPageSize: 25, storageKey: 'admin_customers' })

  const handleClearFilters = () => {
    setFilterMerchant('all')
    setFilterCity('all')
    setFilterSource('all')
    setFilterWhatsapp('all')
    setStartDate(last7Str)
    setEndDate(todayStr)
    setFilterCustomer('')
    setSyncError(null)
  }

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return
    const headers = ['Customer Name', 'Customer Phone', 'City', 'Source', 'Date Added / Order Date', 'Merchant Store', 'WhatsApp Link']
    const isMobile = isMobileDevice()
    const rows = filteredCustomers.map(c => {
      const rawPhone = (c.phone || '').replace(/\D/g, '')
      const cleanPhone = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone
      const waUrl = isMobile
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}`
        : `https://web.whatsapp.com/send/?phone=${cleanPhone}`
      return [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.phone || ''}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        `"${c.source === 'postex_portal' ? 'External / Portal' : 'Booked in App'}"`,
        `"${formatDisplayDate(c.created_at || c.updated_at)}"`,
        `"${(c.user?.email || 'N/A').replace(/"/g, '""')}"`,
        `"${waUrl}"`
      ]
    })
    
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    const sourceSuffix = filterSource === 'all' ? 'all' : filterSource === 'app' ? 'app' : 'external'
    link.setAttribute('download', `customers_directory_${sourceSuffix}_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isCustomFilterActive = Boolean(
    filterMerchant !== 'all' ||
    filterCity !== 'all' ||
    filterSource !== 'all' ||
    filterWhatsapp !== 'all' ||
    filterCustomer ||
    (startDate && startDate !== last7Str) ||
    (endDate && endDate !== todayStr)
  )

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden w-full max-w-full min-w-0">
      
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Customer Database ({filteredCustomers.length})
            </h3>
            {isSyncing && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live PostEx Sync
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Globally unique customer contacts across all registered merchant stores & PostEx portal
          </p>
        </div>

        {/* Action Buttons: Sync PostEx & Export CSV */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncPostEx}
            disabled={isSyncing}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            title="Fetch latest customer contacts directly from PostEx for selected merchant & date range"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <RefreshIcon size={13} />
                <span>Sync PostEx</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className="h-9 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Export CSV {filterSource !== 'all' ? `(${filterSource === 'app' ? 'App' : 'External'})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Filter and Configuration Section */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0c121e] space-y-3.5">
        
        {/* Live PostEx sync feedback banner */}
        {isSyncing && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/90 dark:bg-emerald-900/25 px-3.5 py-2.5 animate-in fade-in duration-150">
            <svg className="animate-spin h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex-1 min-w-0 truncate">
              {syncProgress || 'Loading customer contacts directly from PostEx...'}
            </p>
            {typeof elapsedSeconds === 'number' && elapsedSeconds >= 0 && (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-600/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}s
              </span>
            )}
          </div>
        )}

        {/* Sync error alert banner */}
        {syncError && !isSyncing && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-900/25 px-3.5 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <AlertIcon size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">{syncError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Search Input */}
        <div className="relative flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
          <span className="pl-3 text-slate-400 dark:text-slate-500 shrink-0">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            value={filterCustomer}
            onChange={e => setFilterCustomer(e.target.value)}
            placeholder="Search by customer name, phone number, merchant store, or city..."
            className="w-full pl-2 pr-3 py-2 text-xs sm:text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-800 dark:text-slate-100"
          />
          {filterCustomer && (
            <button
              type="button"
              onClick={() => setFilterCustomer('')}
              className="pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        {/* Date Presets (Exact Apple Segmented Control from Booked History with Last 3 Months) */}
        <div className="p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Date Presets</span>
            </span>
            {activePreset ? (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {activePreset === 'today' && 'Today'}
                {activePreset === 'yesterday' && 'Yesterday'}
                {activePreset === 'last7' && 'Last 7 Days'}
                {activePreset === 'thisMonth' && 'This Month'}
                {activePreset === 'last3Months' && 'Last 3 Months'}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 px-2 py-0.5 rounded-full">
                Custom Range
              </span>
            )}
          </div>

          {/* Quick Date Segmented Control */}
          <ScrollableChipsBar
            className="w-full sm:w-auto inline-flex"
            containerClassName="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-inner w-full sm:w-auto overflow-x-auto no-scrollbar gap-1"
          >
            <button
              type="button"
              onClick={() => handleQuickDate('today')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'today'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('yesterday')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'yesterday'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('last7')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'last7'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('thisMonth')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'thisMonth'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('last3Months')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'last3Months'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Last 3 Months
            </button>
          </ScrollableChipsBar>
        </div>

        {/* Merchant, Date, and Searchable City Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Merchant Store
            </label>
            <select
              value={filterMerchant}
              onChange={e => setFilterMerchant(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Merchants ({users.length})</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              City / Destination
            </label>
            <SearchableDropdown
              value={filterCity}
              onChange={setFilterCity}
              options={uniqueCities}
              placeholder="All Cities"
              allOptionLabel={`All Cities (${uniqueCities.length})`}
              allOptionValue="all"
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {isCustomFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-9 w-full px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs transition active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                title="Reset all filters to defaults"
              >
                <CloseIcon size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Source Pills (All Sources, Booked in App, External / Portal) - Strictly Dynamic per Active Filters */}
        <ScrollableChipsBar
          className="w-full"
          containerClassName="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x"
        >
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 shrink-0">
            Source:
          </span>
          <button
            type="button"
            onClick={() => setFilterSource('all')}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
              filterSource === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
            }`}
          >
            <span>All Sources</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
              filterSource === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {sourceCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSource('app')}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
              filterSource === 'app'
                ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
            }`}
          >
            <span>Booked in App</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
              filterSource === 'app' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {sourceCounts.app}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSource('postex_portal')}
            className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
              filterSource === 'postex_portal'
                ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
            }`}
          >
            <span>External / Portal</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
              filterSource === 'postex_portal' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {sourceCounts.portal}
            </span>
          </button>
        </ScrollableChipsBar>

        {/* WhatsApp Notification Filter Chips - Strictly Dynamic per Active Filters */}
        <ScrollableChipsBar
          className="w-full"
          containerClassName="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x"
        >
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 shrink-0 flex items-center gap-1">
            <WhatsAppIcon size={12} className="fill-current text-[#25D366]" />
            <span>WA Status:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterWhatsapp('all')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
              filterWhatsapp === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 font-bold'
                : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <span>All</span>
            <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
              filterWhatsapp === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {whatsappCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterWhatsapp('pending')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
              filterWhatsapp === 'pending'
                ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                : 'bg-white dark:bg-[#0c121e] hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
            }`}
          >
            <span>Pending</span>
            <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
              filterWhatsapp === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            }`}>
              {whatsappCounts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterWhatsapp('sent')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
              filterWhatsapp === 'sent'
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                : 'bg-white dark:bg-[#0c121e] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            <span>Sent</span>
            <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
              filterWhatsapp === 'sent' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}>
              {whatsappCounts.sent}
            </span>
          </button>
        </ScrollableChipsBar>
      </div>

      {/* Mobile Card List View (< sm) */}
      <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isSyncing ? 'Loading contacts directly from PostEx...' : 'No customers match the active filters.'}
          </div>
        ) : (
          paginatedCustomers.map(c => {
            const rawPhone = (c.phone || '').replace(/\D/g, '')
            const waPhone = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone
            const isExternal = c.source === 'postex_portal'
            const phoneDigits = rawPhone
            const isSent = waTracker.isSent(c.id) || waTracker.isSent(phoneDigits) || waTracker.isSent(c.phone)
            const waLink = isMobileDevice()
              ? `https://api.whatsapp.com/send?phone=${waPhone}`
              : `https://web.whatsapp.com/send/?phone=${waPhone}`

            return (
              <div key={c.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {c.name || 'Valued Customer'}
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.phone} {c.city ? `• ${c.city}` : ''}
                    </p>
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => waTracker.markSent(phoneDigits, 'both', c.id)}
                    className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95 cursor-pointer ${
                      isSent
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <WhatsAppIcon size={14} className="fill-current text-[#25D366]" />
                    <span>{isSent ? 'Sent' : 'WhatsApp'}</span>
                  </a>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
                      isExternal
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${isExternal ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                      {isExternal ? 'Portal / External' : 'Booked in App'}
                    </span>
                    <span>Date: {formatDisplayDate(c.created_at || c.updated_at)}</span>
                  </div>
                  {c.user?.email && (
                    <span className="truncate max-w-[130px] font-medium text-slate-500 dark:text-slate-400">
                      {c.user.email}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 dark:bg-[#070b12] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Customer Name</th>
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Phone Number</th>
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">City / Destination</th>
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Source</th>
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Date Added</th>
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Merchant Store</th>
              <th className="px-4 py-3 text-center">WhatsApp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-medium">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  {isSyncing ? 'Loading contacts directly from PostEx...' : 'No customers match the active filters.'}
                </td>
              </tr>
            ) : (
              paginatedCustomers.map(c => {
                const rawPhone = (c.phone || '').replace(/\D/g, '')
                const waPhone = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone
                const isExternal = c.source === 'postex_portal'
                const phoneDigits = rawPhone
                const isSent = waTracker.isSent(c.id) || waTracker.isSent(phoneDigits) || waTracker.isSent(c.phone)
                const waLink = isMobileDevice()
                  ? `https://api.whatsapp.com/send?phone=${waPhone}`
                  : `https://web.whatsapp.com/send/?phone=${waPhone}`

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {c.name || 'Valued Customer'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {c.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate">
                      {c.city || '—'}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isExternal
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isExternal ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                        {isExternal ? 'Portal / External' : 'Booked in App'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {formatDisplayDate(c.created_at || c.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px] truncate">
                      {c.user?.email || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => waTracker.markSent(phoneDigits, 'both', c.id)}
                        className={`inline-flex items-center justify-center w-7.5 h-7.5 rounded-xl border transition shadow-2xs cursor-pointer active:scale-95 ${
                          isSent
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-800/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                        }`}
                        title={isSent ? 'WhatsApp message already sent • Click to re-send' : `Chat with ${c.name} on WhatsApp`}
                      >
                        <WhatsAppIcon size={14} className="fill-current text-[#25D366]" />
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Shared Unified Pagination */}
      <SharedPagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100, 200, 300]}
        itemLabel="customers"
        className="mt-4"
      />
    </div>
  )
}
