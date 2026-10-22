import { BookedParcel } from '../components/history/types'

/**
 * Local store for parcels that came directly from PostEx (external / portal).
 *
 * These parcels are not owned by the app database, so they must survive
 * re-renders, realtime sync events and tab switches. We keep them in memory
 * for 0ms rendering plus a per-tenant localStorage snapshot so a reload or a
 * tab switch keeps the exact same list until the merchant changes the date
 * filter (a new range starts fresh and is synced from PostEx again).
 */

const STORAGE_PREFIX = 'zaynah_external_parcels_v1'
const MAX_STORED_PARCELS = 3000

interface StoredExternalRange {
  range: string
  saved_at: number
  parcels: BookedParcel[]
}

function storageKey(userId?: string): string {
  return `${STORAGE_PREFIX}_${userId || 'guest'}`
}

function rangeKey(fromDate: string, toDate: string): string {
  return `${fromDate}|${toDate}`
}

export function readExternalParcels(userId: string | undefined, fromDate: string, toDate: string): BookedParcel[] {
  if (!fromDate || !toDate) return []
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredExternalRange
    if (!parsed || parsed.range !== rangeKey(fromDate, toDate) || !Array.isArray(parsed.parcels)) return []
    return parsed.parcels
  } catch {
    return []
  }
}

export function writeExternalParcels(
  userId: string | undefined,
  fromDate: string,
  toDate: string,
  parcels: BookedParcel[]
): void {
  if (!fromDate || !toDate) return
  try {
    const trimmed = parcels.length > MAX_STORED_PARCELS ? parcels.slice(0, MAX_STORED_PARCELS) : parcels
    const payload: StoredExternalRange = {
      range: rangeKey(fromDate, toDate),
      saved_at: Date.now(),
      parcels: trimmed
    }
    localStorage.setItem(storageKey(userId), JSON.stringify(payload))
  } catch {
    // Browser quota exceeded: in-memory state still keeps the list visible.
  }
}

export function clearExternalParcels(userId?: string): void {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {}
}
