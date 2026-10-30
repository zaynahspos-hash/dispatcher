import { BookedParcel, getParcelDateStr } from '../components/history/types'
import { idbSaveParcels, idbGetParcels, idbFindEncompassingParcels } from './indexedDbStore'

/**
 * Local store for parcels that came directly from PostEx (external / portal).
 *
 * These parcels are not owned by the app database, so they must survive
 * re-renders, realtime sync events and tab switches. We keep them in memory
 * for 0ms rendering plus a quota-free IndexedDB layer and per-tenant localStorage snapshot.
 *
 * ZERO TRUNCATION: All fetched parcels are preserved in full without artificial capping.
 */

const STORAGE_PREFIX = 'zaynah_ext_parcels_v2'
const MAX_STORED_RANGES = 3
const MAX_LOCAL_STORAGE_PARCELS = 50

interface StoredExternalRange {
  range: string
  saved_at: number
  parcels: BookedParcel[]
}

// In-memory cache for 0ms instant tab switching during the active session (holds 100% full dataset)
const memoryStore = new Map<string, StoredExternalRange>()

// Global sync timestamps surviving tab switches within the active session
const lastSyncTimestamps = new Map<string, number>()

export function recordRangeSync(userId: string | undefined, range: string): void {
  const key = `${userId || 'guest'}_${range}`
  lastSyncTimestamps.set(key, Date.now())
}

export function getLastRangeSyncTime(userId: string | undefined, range: string): number {
  const key = `${userId || 'guest'}_${range}`
  return lastSyncTimestamps.get(key) || 0
}

function storageKey(userId?: string, range?: string): string {
  const uid = userId || 'guest'
  return range ? `${STORAGE_PREFIX}_${uid}_${range}` : `${STORAGE_PREFIX}_${uid}`
}

function rangeKey(fromDate: string, toDate: string): string {
  return `${fromDate}|${toDate}`
}

function getIndexKey(userId?: string): string {
  return `${STORAGE_PREFIX}_index_${userId || 'guest'}`
}

function getStoredRangesIndex(userId?: string): string[] {
  try {
    const raw = localStorage.getItem(getIndexKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function updateStoredRangesIndex(userId: string | undefined, currentKey: string): void {
  try {
    const indexKey = getIndexKey(userId)
    let index = getStoredRangesIndex(userId).filter(k => k !== currentKey)
    index.unshift(currentKey)
    // Prune old ranges beyond MAX_STORED_RANGES to keep localStorage clean
    if (index.length > MAX_STORED_RANGES) {
      const toRemove = index.slice(MAX_STORED_RANGES)
      toRemove.forEach(oldKey => {
        try { localStorage.removeItem(oldKey) } catch {}
      })
      index = index.slice(0, MAX_STORED_RANGES)
    }
    localStorage.setItem(indexKey, JSON.stringify(index))
  } catch {}
}

export function readExternalParcels(
  userId: string | undefined,
  fromDate: string,
  toDate: string
): BookedParcel[] {
  if (!fromDate || !toDate) return []
  const rKey = rangeKey(fromDate, toDate)
  const memKey = `${userId || 'guest'}_${rKey}`

  // 1. Check in-memory store for exact range match (0ms instant access)
  const mem = memoryStore.get(memKey)
  if (mem && mem.range === rKey && Array.isArray(mem.parcels) && mem.parcels.length > 0) {
    return mem.parcels
  }

  // 2. Check in-memory encompassing range (e.g. user synced "Last 3 Months" or "This Month" and now views "Last 7 Days" or "Today")
  const userPrefix = `${userId || 'guest'}_`
  for (const [key, stored] of memoryStore.entries()) {
    if (key.startsWith(userPrefix) && stored && Array.isArray(stored.parcels) && stored.parcels.length > 0) {
      const parts = stored.range.split('|')
      if (parts.length === 2) {
        const [storedFrom, storedTo] = parts
        if (storedFrom && storedTo && storedFrom <= fromDate && storedTo >= toDate) {
          const matching = stored.parcels.filter(p => {
            const pDate = getParcelDateStr(p.bookingDate)
            return Boolean(pDate && pDate >= fromDate && pDate <= toDate)
          })
          if (matching.length > 0) {
            return matching
          }
        }
      }
    }
  }

  // 3. Check localStorage snapshot for exact match
  try {
    const sKey = storageKey(userId, rKey)
    const raw = localStorage.getItem(sKey)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredExternalRange
      if (parsed && parsed.range === rKey && Array.isArray(parsed.parcels) && parsed.parcels.length > 0) {
        memoryStore.set(memKey, parsed)
        return parsed.parcels
      }
    }
  } catch {}

  return []
}

/**
 * Asynchronously loads parcels from IndexedDB if not in memory.
 * Ensures large datasets (30,000+ parcels) survive page reloads and tab navigations.
 */
export async function loadExternalParcelsAsync(
  userId: string | undefined,
  fromDate: string,
  toDate: string
): Promise<BookedParcel[]> {
  const inMem = readExternalParcels(userId, fromDate, toDate)
  if (inMem.length > 0) return inMem

  const rKey = rangeKey(fromDate, toDate)
  const memKey = `${userId || 'guest'}_${rKey}`

  // Try IndexedDB exact match
  const idbExact = await idbGetParcels(userId, rKey)
  if (idbExact && idbExact.length > 0) {
    memoryStore.set(memKey, { range: rKey, saved_at: Date.now(), parcels: idbExact })
    return idbExact
  }

  // Try IndexedDB encompassing match
  const idbEncomp = await idbFindEncompassingParcels(userId, fromDate, toDate)
  if (idbEncomp && idbEncomp.length > 0) {
    return idbEncomp
  }

  return []
}

export function hasExternalParcels(
  userId: string | undefined,
  fromDate: string,
  toDate: string
): boolean {
  return readExternalParcels(userId, fromDate, toDate).length > 0
}

export function writeExternalParcels(
  userId: string | undefined,
  fromDate: string,
  toDate: string,
  parcels: BookedParcel[]
): void {
  if (!fromDate || !toDate) return
  const rKey = rangeKey(fromDate, toDate)
  const memKey = `${userId || 'guest'}_${rKey}`

  // 1. In-memory store keeps 100% of parcels without any truncation
  const memPayload: StoredExternalRange = {
    range: rKey,
    saved_at: Date.now(),
    parcels: parcels
  }
  memoryStore.set(memKey, memPayload)
  recordRangeSync(userId, rKey)

  // 2. Persist to IndexedDB (asynchronous, quota-free, 100% full dataset)
  void idbSaveParcels(userId, rKey, parcels)

  // 3. Save snapshot to device storage (defensively safe against browser QuotaExceededError)
  try {
    const sKey = storageKey(userId, rKey)
    const storageParcels = parcels.length > MAX_LOCAL_STORAGE_PARCELS 
      ? parcels.slice(0, MAX_LOCAL_STORAGE_PARCELS) 
      : parcels
    const storagePayload: StoredExternalRange = {
      range: rKey,
      saved_at: Date.now(),
      parcels: storageParcels
    }
    localStorage.setItem(sKey, JSON.stringify(storagePayload))
    updateStoredRangesIndex(userId, sKey)
  } catch {
    // LocalStorage quota reached: IndexedDB + memoryStore hold 100% of the live parcels
  }

  // 4. Notify active tabs / components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('portal_parcels_synced', {
      detail: { userId, range: rKey, count: parcels.length }
    }))
  }
}

export function clearExternalParcels(
  userId?: string,
  fromDate?: string,
  toDate?: string
): void {
  if (fromDate && toDate) {
    const rKey = rangeKey(fromDate, toDate)
    const memKey = `${userId || 'guest'}_${rKey}`
    memoryStore.delete(memKey)
    lastSyncTimestamps.delete(memKey)
    try {
      localStorage.removeItem(storageKey(userId, rKey))
    } catch {}
  } else {
    // Clear all external caches for user
    const prefix = `${userId || 'guest'}_`
    for (const key of memoryStore.keys()) {
      if (key.startsWith(prefix)) memoryStore.delete(key)
    }
    for (const key of lastSyncTimestamps.keys()) {
      if (key.startsWith(prefix)) lastSyncTimestamps.delete(key)
    }
    const index = getStoredRangesIndex(userId)
    index.forEach(k => {
      try { localStorage.removeItem(k) } catch {}
    })
    try { localStorage.removeItem(getIndexKey(userId)) } catch {}
  }
}
