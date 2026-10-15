/**
 * PWA Cache Buster & Application Refresh Utility
 * Ensures latest deployed assets on Vercel are fetched immediately on mobile & desktop.
 */
export async function forceAppUpdate(): Promise<void> {
  try {
    // 1. Post message to all active service workers to clear cache and skip waiting
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        try {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
          if (reg.active) {
            reg.active.postMessage({ type: 'CLEAR_CACHE' })
          }
          await reg.update()
        } catch (e) {
          console.warn('[PWA] SW registration update failed:', e)
        }
      }
    }

    // 2. Direct cache storage clear
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      } catch (e) {
        console.warn('[PWA] Direct cache clear failed:', e)
      }
    }
  } catch (err) {
    console.warn('[PWA] App update execution error:', err)
  } finally {
    // 3. Force cache-busting reload
    try {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('_ts', Date.now().toString())
      window.location.replace(currentUrl.toString())
    } catch {
      window.location.reload()
    }
  }
}
