const CACHE_PREFIX = 'parcel_cache_'
const DEFAULT_TTL = 12 * 60 * 60 * 1000 // 12 hours

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    localStorage.removeItem(CACHE_PREFIX + key)
    return null
  }
}

export function setCached<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch (e) {
    console.error('Cache write error:', e)
  }
}

export function removeCached(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key)
}

export function clearAllCache(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(CACHE_PREFIX)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export function getTTL(unit: 'minutes' | 'hours' | 'days', value: number): number {
  const ms = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 }
  return ms[unit] * value
}
