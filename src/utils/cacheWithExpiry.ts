const CACHE_PREFIX = 'parcel_cache_'
const DEFAULT_TTL = 12 * 60 * 60 * 1000 // 12 hours
const MAX_LOCAL_STORAGE_ITEMS_PER_KEY = 50

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// In-memory cache for 0ms access without browser quota constraints
const memoryCache = new Map<string, CacheEntry<any>>()

/**
 * Emergency purge of heavy cache entries from localStorage to release quota.
 */
export function purgeEmergencyStorage(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith(CACHE_PREFIX) || k.startsWith('zaynah_ext_parcels_') || k.startsWith('parcel_cache_'))) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k) } catch {}
    })
  } catch {}
}

export function getCached<T>(key: string): T | null {
  // 1. Check in-memory store first
  const mem = memoryCache.get(key)
  if (mem) {
    if (Date.now() - mem.timestamp <= mem.ttl) {
      return mem.data as T
    }
    memoryCache.delete(key)
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    // Sync into memoryCache
    memoryCache.set(key, entry)
    return entry.data
  } catch {
    try { localStorage.removeItem(CACHE_PREFIX + key) } catch {}
    return null
  }
}

export function setCached<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const fullEntry: CacheEntry<T> = { data, timestamp: Date.now(), ttl }
  
  // 1. Always retain full 100% dataset in memory
  memoryCache.set(key, fullEntry)

  // 2. Prepare lightweight payload for localStorage to strictly prevent QuotaExceededError
  try {
    let storageData = data
    if (Array.isArray(data) && data.length > MAX_LOCAL_STORAGE_ITEMS_PER_KEY) {
      storageData = data.slice(0, MAX_LOCAL_STORAGE_ITEMS_PER_KEY) as unknown as T
    }

    const storageEntry: CacheEntry<T> = { data: storageData, timestamp: Date.now(), ttl }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(storageEntry))
  } catch (e: any) {
    // If QuotaExceededError occurs, perform emergency purge of old parcel caches and retry
    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
      purgeEmergencyStorage()
      try {
        let storageData = data
        if (Array.isArray(data)) {
          storageData = data.slice(0, 10) as unknown as T
        }
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data: storageData, timestamp: Date.now(), ttl }))
      } catch {
        // Memory cache retains full data cleanly
      }
    }
  }
}

export function removeCached(key: string): void {
  memoryCache.delete(key)
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
  } catch {}
}

export function clearAllCache(): void {
  memoryCache.clear()
  purgeEmergencyStorage()
}

export function getTTL(unit: 'minutes' | 'hours' | 'days', value: number): number {
  const ms = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 }
  return ms[unit] * value
}
