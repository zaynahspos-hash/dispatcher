/**
 * Single Source of Truth for App-Booked Consignment Numbers (CNs).
 * Tracks which orders/tracking numbers were booked directly through this app,
 * ensuring they retain their "Booked in App" badge/source even after full PostEx API syncs.
 */

const memorySet = new Set<string>()
let currentUserId = ''

function normalizeKey(val?: string | null): string {
  return (val || '').trim().toLowerCase()
}

function getStorageKey(userId?: string): string {
  const uid = userId || currentUserId || 'default'
  return `app_booked_cns_${uid}`
}

/**
 * Initializes or loads the registry for a specific user from localStorage.
 */
export function initAppBookedRegistry(userId?: string, extraCns?: string[]): void {
  if (userId) currentUserId = userId
  const storageKey = getStorageKey(userId)

  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) {
        list.forEach(item => {
          const k = normalizeKey(item)
          if (k) memorySet.add(k)
        })
      }
    }
  } catch (err) {
    console.warn('Failed to load app_booked_cns from localStorage:', err)
  }

  if (Array.isArray(extraCns)) {
    extraCns.forEach(item => {
      const k = normalizeKey(item)
      if (k) memorySet.add(k)
    })
    saveToStorage(userId)
  }
}

function saveToStorage(userId?: string): void {
  try {
    const storageKey = getStorageKey(userId)
    const list = Array.from(memorySet)
    localStorage.setItem(storageKey, JSON.stringify(list))
  } catch (err) {
    console.warn('Failed to save app_booked_cns to localStorage:', err)
  }
}

/**
 * Registers one or more identifiers (trackingNumber, orderRefNumber) as booked in the app.
 */
export function registerAppBookedCn(tracking?: string | null, refId?: string | null, userId?: string): void {
  if (userId) currentUserId = userId
  let changed = false

  const tKey = normalizeKey(tracking)
  const rKey = normalizeKey(refId)

  if (tKey && !memorySet.has(tKey)) {
    memorySet.add(tKey)
    changed = true
  }
  if (rKey && !memorySet.has(rKey)) {
    memorySet.add(rKey)
    changed = true
  }

  if (changed) {
    saveToStorage(userId)
  }
}

/**
 * Bulk registers multiple parcels booked in the app.
 */
export function registerAppBookedCns(items: Array<{ tracking?: string | null; id?: string | null }>, userId?: string): void {
  if (userId) currentUserId = userId
  let changed = false

  items.forEach(item => {
    const tKey = normalizeKey(item.tracking)
    const rKey = normalizeKey(item.id)
    if (tKey && !memorySet.has(tKey)) {
      memorySet.add(tKey)
      changed = true
    }
    if (rKey && !memorySet.has(rKey)) {
      memorySet.add(rKey)
      changed = true
    }
  })

  if (changed) {
    saveToStorage(userId)
  }
}

/**
 * Checks if a given tracking number or order reference was booked in the app.
 */
export function isAppBookedCn(trackingOrRef?: string | null, userId?: string): boolean {
  if (!trackingOrRef) return false
  const key = normalizeKey(trackingOrRef)
  if (!key) return false

  if (memorySet.has(key)) return true

  // Fallback to checking localStorage in case memory set was reset during hot reload
  try {
    const storageKey = getStorageKey(userId)
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list) && list.some(item => normalizeKey(item) === key)) {
        memorySet.add(key)
        return true
      }
    }
  } catch {}

  return false
}

/**
 * Synchronizes the in-memory and localStorage registry with parcels from history.
 * Any parcel that is not explicitly 'postex_portal' is recorded as an app booking.
 */
export function syncAppBookedCnsFromHistory(history: Array<{ tracking?: string | null; id?: string | null; source?: string }>, userId?: string): void {
  if (userId) currentUserId = userId
  if (!Array.isArray(history) || history.length === 0) return

  let changed = false
  history.forEach(p => {
    // If not portal, or source is 'app', it was booked in this app
    if (p.source !== 'postex_portal' || p.source === 'app') {
      const tKey = normalizeKey(p.tracking)
      const rKey = normalizeKey(p.id)
      if (tKey && !memorySet.has(tKey)) {
        memorySet.add(tKey)
        changed = true
      }
      if (rKey && !memorySet.has(rKey)) {
        memorySet.add(rKey)
        changed = true
      }
    }
  })

  if (changed) {
    saveToStorage(userId)
  }
}

/**
 * Returns all currently registered CNs as an array (for DB sync or diagnostics).
 */
export function getAppBookedCnsList(): string[] {
  return Array.from(memorySet)
}
