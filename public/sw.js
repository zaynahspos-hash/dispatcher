const BUILD_VERSION = 'v20261015-refresh'
const CACHE_PREFIX = 'courier-manager'
const CACHE_STATIC = `${CACHE_PREFIX}-static-${BUILD_VERSION}`
const CACHE_HTML = `${CACHE_PREFIX}-html-${BUILD_VERSION}`

const STATIC_ASSETS = [
  '/favicon.ico',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
  '/site.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/favicon.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith(CACHE_PREFIX) && name !== CACHE_STATIC && name !== CACHE_HTML) {
            return caches.delete(name)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)))
    })
  }
})

function isNavigationRequest(url) {
  const path = new URL(url).pathname
  return path === '/' || path === '/index.html'
}

function isStaticAsset(url) {
  const path = new URL(url).pathname
  return STATIC_ASSETS.some(asset => path === asset) || path.endsWith('.png') || path.endsWith('.ico') || path.endsWith('.svg') || path.endsWith('.webmanifest')
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return
  }

  if (isNavigationRequest(event.request.url)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_HTML).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => {
        return caches.match(event.request)
      })
    )
    return
  }

  if (isStaticAsset(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }
})
