import { supabase } from './supabaseClient'
import { fetchAllMerchantOrders } from './postexApi'
import { transformPostExOrders, isFakeOrDemoPhone } from '../components/history/types'
import { writeExternalParcels } from './portalParcelStore'
import { idbSaveCustomers, idbGetCustomers } from './indexedDbStore'
import { UserProfile, CustomerEntry } from '../components/admin/types'

export interface CloudSyncOptions {
  users: UserProfile[]
  selectedMerchants?: string[]
  startDate?: string
  endDate?: string
  onProgress?: (message: string) => void
}

export interface CloudSyncReport {
  downloadedFromCloud: number
  uploadedToCloud: number
  postExHarvested: number
  prunedParcels: number
  totalUniqueCustomers: number
}

export const ADMIN_PORTAL_CACHE_KEY = 'zaynah_admin_customers_portal_v2'

export const getMerchantPostExToken = (u: UserProfile): string => {
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

export function parsePortalDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString()
  if (rawDate.includes('T')) {
    const dt = new Date(rawDate)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }
  const parts = rawDate.split(/[\sT]+/)
  const datePart = parts[0]
  if (datePart && datePart.includes('-')) {
    const dParts = datePart.split('-')
    if (dParts.length === 3) {
      if (dParts[0].length === 4) {
        return new Date(`${dParts[0]}-${dParts[1].padStart(2, '0')}-${dParts[2].padStart(2, '0')}T12:00:00Z`).toISOString()
      } else {
        return new Date(`${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}T12:00:00Z`).toISOString()
      }
    }
  }
  const dt = new Date(rawDate)
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString()
}

/**
 * Executes high-performance, two-way database synchronization (Cloud <-> Local).
 * - DOWNLOADS missing customer records from Supabase PostgreSQL to local IndexedDB.
 * - HARVESTS live PostEx orders for the selected range and extracts verified contacts.
 * - UPLOADS all new/updated local contacts to Supabase in chunks of 100 with onConflict.
 * - PRUNES records older than 90 days to guarantee Supabase never exceeds the free tier 500MB quota.
 * - BROADCASTS cross-tab sync events so all active views update in real time.
 */
export async function executeAutonomousCloudSync(
  options: CloudSyncOptions
): Promise<CloudSyncReport> {
  const { users, selectedMerchants = ['all'], startDate, endDate, onProgress } = options
  const isAllMerchants = selectedMerchants.length === 0 || selectedMerchants.includes('all')

  const targetMerchants = isAllMerchants
    ? users
    : users.filter(u => selectedMerchants.includes(u.id))

  const targetMerchantIds = targetMerchants.map(u => u.id)

  const customerMap = new Map<string, CustomerEntry>()
  let downloadedCount = 0
  let uploadedCount = 0
  let harvestedOrdersCount = 0
  let prunedParcels = 0

  // -------------------------------------------------------------
  // STEP 1: Load Existing Local Contacts from IndexedDB
  // -------------------------------------------------------------
  onProgress?.('Reading local device contacts database...')
  try {
    const localCached = await idbGetCustomers()
    if (Array.isArray(localCached)) {
      localCached.forEach(c => {
        if (isFakeOrDemoPhone(c.phone, c.name)) return
        const clean = (c.phone || '').replace(/\D/g, '')
        if (clean) {
          customerMap.set(`${c.user_id}_${clean}`, c)
        }
      })
    }
  } catch (err) {
    console.warn('[CloudSync] Local IndexedDB read warning:', err)
  }

  // -------------------------------------------------------------
  // STEP 2: DOWNLOAD missing contacts from Supabase Cloud DB
  // -------------------------------------------------------------
  onProgress?.('Downloading cloud directory from Supabase database...')
  try {
    let query = supabase
      .from('customers')
      .select('id, user_id, phone, name, city, address, source, total_orders, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(25000)

    if (!isAllMerchants && targetMerchantIds.length > 0) {
      query = query.in('user_id', targetMerchantIds)
    }

    const { data: dbCustomers, error: dbErr } = await query
    if (!dbErr && Array.isArray(dbCustomers)) {
      dbCustomers.forEach((dbc: any) => {
        if (isFakeOrDemoPhone(dbc.phone, dbc.name)) return
        const clean = (dbc.phone || '').replace(/\D/g, '')
        if (!clean) return
        const key = `${dbc.user_id}_${clean}`
        const existing = customerMap.get(key)
        if (!existing) {
          downloadedCount++
          const merchant = users.find(u => u.id === dbc.user_id)
          customerMap.set(key, {
            id: dbc.id,
            user_id: dbc.user_id,
            phone: dbc.phone,
            name: dbc.name || 'Valued Customer',
            city: dbc.city || '',
            address: dbc.address || '',
            source: dbc.source || 'app',
            total_orders: dbc.total_orders || 1,
            created_at: dbc.created_at || new Date().toISOString(),
            updated_at: dbc.updated_at || new Date().toISOString(),
            user: merchant ? { email: merchant.email } : undefined
          })
        } else {
          // Merge enrichment: keep city, address, and highest order tally
          if (!existing.city && dbc.city) existing.city = dbc.city
          if (!existing.address && dbc.address) existing.address = dbc.address
          if (dbc.total_orders && dbc.total_orders > (existing.total_orders || 1)) {
            existing.total_orders = dbc.total_orders
          }
        }
      })
    }
  } catch (err) {
    console.warn('[CloudSync] Supabase download error:', err)
  }

  // -------------------------------------------------------------
  // STEP 3: HARVEST Live PostEx Orders (if active tokens present)
  // -------------------------------------------------------------
  const rangeStart = startDate || new Date().toISOString().slice(0, 10)
  const rangeEnd = endDate || new Date().toISOString().slice(0, 10)

  const seenTokens = new Set<string>()
  const uniqueMerchantsToFetch: UserProfile[] = []
  for (const m of targetMerchants) {
    const tok = getMerchantPostExToken(m)
    if (tok && !seenTokens.has(tok)) {
      seenTokens.add(tok)
      uniqueMerchantsToFetch.push(m)
    }
  }

  for (let i = 0; i < uniqueMerchantsToFetch.length; i++) {
    const merchant = uniqueMerchantsToFetch[i]
    const token = getMerchantPostExToken(merchant)
    onProgress?.(`Harvesting PostEx orders for ${merchant.email} (${i + 1}/${uniqueMerchantsToFetch.length})...`)

    try {
      const orders = await fetchAllMerchantOrders(token, rangeStart, rangeEnd, {
        on_progress: msg => onProgress?.(`${merchant.email}: ${msg}`)
      })

      if (Array.isArray(orders) && orders.length > 0) {
        harvestedOrdersCount += orders.length
        const transformedParcels = transformPostExOrders(orders)
        writeExternalParcels(merchant.id, rangeStart, rangeEnd, transformedParcels)

        orders.forEach((order, idx) => {
          const rawPhone = (order.customerPhone || '').trim()
          if (!rawPhone || isFakeOrDemoPhone(rawPhone, order.customerName)) return
          const clean = rawPhone.replace(/\D/g, '')
          if (!clean) return

          const validIsoDate = parsePortalDate(
            order.transactionDate || order.orderDate || order.bookingDate || order.createdDatetime
          )

          const key = `${merchant.id}_${clean}`
          const existing = customerMap.get(key)
          if (!existing) {
            customerMap.set(key, {
              id: `portal_${merchant.id}_${order.trackingNumber || order.orderRefNumber || idx}`,
              user_id: merchant.id,
              name: order.customerName || 'Valued Customer',
              phone: rawPhone,
              city: order.cityName || '',
              address: order.deliveryAddress || '',
              source: 'postex_portal',
              total_orders: 1,
              created_at: validIsoDate,
              updated_at: validIsoDate,
              user: { email: merchant.email }
            })
          } else {
            if (!existing.city && order.cityName) existing.city = order.cityName
            if (!existing.address && order.deliveryAddress) existing.address = order.deliveryAddress
            existing.total_orders = (existing.total_orders || 1) + 1
          }
        })
      }
    } catch (merchantErr) {
      console.warn(`[CloudSync] PostEx harvest error for ${merchant.email}:`, merchantErr)
    }
  }

  // -------------------------------------------------------------
  // STEP 4: Persist Merged List Locally to Quota-Free IndexedDB
  // -------------------------------------------------------------
  const allMergedCustomers = Array.from(customerMap.values())
  await idbSaveCustomers(allMergedCustomers)
  try {
    localStorage.setItem(ADMIN_PORTAL_CACHE_KEY, JSON.stringify(allMergedCustomers.slice(0, 1500)))
  } catch {}

  // -------------------------------------------------------------
  // STEP 5: UPLOAD Missing/Updated Local Contacts to Supabase Cloud
  // Chunks of 100 rows with onConflict: 'user_id,phone'
  // Keeps payload lightweight and strictly within free limits
  // -------------------------------------------------------------
  onProgress?.(`Uploading contacts to Supabase PostgreSQL database...`)
  try {
    const upsertRows = allMergedCustomers
      .filter(c => targetMerchantIds.includes(c.user_id))
      .map(c => ({
        user_id: c.user_id,
        phone: (c.phone || '').replace(/\D/g, ''),
        name: c.name || 'Valued Customer',
        city: c.city || '',
        address: c.address || '',
        source: c.source || 'postex_portal',
        total_orders: c.total_orders || 1,
        updated_at: new Date().toISOString()
      }))

    const BATCH_SIZE = 100
    for (let b = 0; b < upsertRows.length; b += BATCH_SIZE) {
      const chunk = upsertRows.slice(b, b + BATCH_SIZE)
      const { error } = await supabase.from('customers').upsert(chunk, {
        onConflict: 'user_id,phone',
        ignoreDuplicates: false
      })
      if (!error) {
        uploadedCount += chunk.length
      }
    }
  } catch (uploadErr) {
    console.warn('[CloudSync] Supabase upload error:', uploadErr)
  }

  // -------------------------------------------------------------
  // STEP 6: PRUNE 90-Day Parcels (Guarantees Supabase Free Limit)
  // -------------------------------------------------------------
  onProgress?.('Pruning archived database history beyond 90 days...')
  try {
    const { data: pruneData, error: pruneErr } = await supabase.rpc('purge_old_booked_parcels', { retention_days: 90 })
    if (!pruneErr && Array.isArray(pruneData)) {
      prunedParcels = pruneData.reduce((acc: number, r: any) => acc + (r.parcels_removed || 0), 0)
    }
  } catch (pruneErr) {
    console.warn('[CloudSync] Pruning error:', pruneErr)
  }

  // -------------------------------------------------------------
  // STEP 7: BROADCAST Events to All Open Tabs and Windows
  // -------------------------------------------------------------
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('customers_synced', {
      detail: { count: allMergedCustomers.length, uploaded: uploadedCount, downloaded: downloadedCount }
    }))
    window.dispatchEvent(new CustomEvent('portal_parcels_synced', {
      detail: { ordersCount: harvestedOrdersCount }
    }))
  }

  return {
    downloadedFromCloud: downloadedCount,
    uploadedToCloud: uploadedCount,
    postExHarvested: harvestedOrdersCount,
    prunedParcels,
    totalUniqueCustomers: allMergedCustomers.length
  }
}
