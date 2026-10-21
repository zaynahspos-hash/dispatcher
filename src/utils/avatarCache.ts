/**
 * Avatar & Image Resilient Caching Engine (RULE C11)
 *
 * 1. Provides instant 0ms avatar rendering from local Base64 cache.
 * 2. Invalidates and purges cache immediately when photo changes or is removed.
 * 3. Survives reloads and offline network disconnects without falling back to initials.
 * 4. Namespaced per-user to uphold multi-tenant data isolation (RULE D15).
 */

interface CachedAvatarEntry {
  url: string
  dataUrl: string
  cachedAt: number
}

// In-memory hot cache for instant synchronous access during React renders
const memoryAvatarCache = new Map<string, CachedAvatarEntry>()

function getCacheKey(identifier: string): string {
  const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return `zaynah_avatar_cache_${cleanId}`
}

function isUrlMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false
  if (a === b) return true
  return a.split('?')[0] === b.split('?')[0]
}

/**
 * Retrieve cached avatar data URL for a user identifier (user.id or email).
 * Verifies that the cached source URL matches current expected avatarUrl.
 */
export function getCachedAvatar(identifier?: string | null, expectedUrl?: string | null): string | null {
  if (!expectedUrl) return null

  // 1. Check primary identifier
  if (identifier) {
    const key = getCacheKey(identifier)
    const inMem = memoryAvatarCache.get(key)
    if (inMem && isUrlMatch(inMem.url, expectedUrl) && inMem.dataUrl) {
      return inMem.dataUrl
    }

    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const entry: CachedAvatarEntry = JSON.parse(raw)
        if (entry && isUrlMatch(entry.url, expectedUrl) && entry.dataUrl) {
          memoryAvatarCache.set(key, entry)
          return entry.dataUrl
        } else if (entry && !isUrlMatch(entry.url, expectedUrl)) {
          localStorage.removeItem(key)
          memoryAvatarCache.delete(key)
        }
      }
    } catch {}
  }

  // 2. Check active user ID fallback (RULE C11)
  try {
    const activeUserId = localStorage.getItem('zaynah_active_user_id')
    if (activeUserId && activeUserId !== identifier) {
      const altKey = getCacheKey(activeUserId)
      const inMemAlt = memoryAvatarCache.get(altKey)
      if (inMemAlt && isUrlMatch(inMemAlt.url, expectedUrl) && inMemAlt.dataUrl) {
        return inMemAlt.dataUrl
      }
      const rawAlt = localStorage.getItem(altKey)
      if (rawAlt) {
        const entry: CachedAvatarEntry = JSON.parse(rawAlt)
        if (entry && isUrlMatch(entry.url, expectedUrl) && entry.dataUrl) {
          memoryAvatarCache.set(altKey, entry)
          return entry.dataUrl
        }
      }
    }
  } catch {}

  return null
}

/**
 * Save an avatar image data URL to cache for a user identifier.
 */
export function setCachedAvatar(identifier: string, url: string, dataUrl: string): void {
  if (!identifier || !url || !dataUrl) return

  const key = getCacheKey(identifier)
  const entry: CachedAvatarEntry = {
    url,
    dataUrl,
    cachedAt: Date.now()
  }

  // Set in-memory cache
  memoryAvatarCache.set(key, entry)

  // Set localStorage cache
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (e) {
    console.warn('[AvatarCache] Failed to write to localStorage:', e)
  }
}

/**
 * Clear cached avatar for a user identifier (called on Remove Photo or Logout).
 */
export function clearCachedAvatar(identifier: string): void {
  if (!identifier) return

  const key = getCacheKey(identifier)
  memoryAvatarCache.delete(key)

  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}

/**
 * Converts an image element or URL to a Base64 data URL for offline caching.
 */
export async function cacheRemoteImageAsDataUrl(identifier: string, remoteUrl: string): Promise<string | null> {
  if (!identifier || !remoteUrl || remoteUrl.startsWith('data:')) return null

  // If already cached, return existing
  const existing = getCachedAvatar(identifier, remoteUrl)
  if (existing) return existing

  try {
    const response = await fetch(remoteUrl, { mode: 'cors' })
    if (!response.ok) return null

    const blob = await response.blob()
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        if (dataUrl) {
          setCachedAvatar(identifier, remoteUrl, dataUrl)
          resolve(dataUrl)
        } else {
          resolve(null)
        }
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    // CORS or network failure; leave un-cached for graceful fallback
    return null
  }
}
