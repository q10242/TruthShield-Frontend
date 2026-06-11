const CACHE_VERSION = 'v2'
const SHELL_CACHE = `truthshield-shell-${CACHE_VERSION}`
const ASSET_CACHE = `truthshield-assets-${CACHE_VERSION}`
const IMAGE_CACHE = `truthshield-images-${CACHE_VERSION}`
const SHELL_URLS = ['/', '/mobile', '/favicon.svg', '/manifest.webmanifest', '/brand/truthshield-mark.svg']
const IMAGE_EXTENSIONS = /\.(?:avif|webp|png|jpe?g|gif|svg|ico)$/i

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        const current = new Set([SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE])
        return Promise.all(keys.filter((key) => !current.has(key)).map((key) => caches.delete(key)))
      })
      .catch(() => undefined),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, SHELL_CACHE, '/'))
    return
  }

  if (isHashedAsset(url, request)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  if (isImageLike(url, request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }

  event.respondWith(networkFirst(request, SHELL_CACHE))
})

function isHashedAsset(url, request) {
  return request.destination === 'script' || request.destination === 'style' || /^\/assets\/.+-[A-Za-z0-9_-]{6,}\./.test(url.pathname)
}

function isImageLike(url, request) {
  return request.destination === 'image' || IMAGE_EXTENSIONS.test(url.pathname)
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone()).catch(() => undefined)
  }
  return response
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone()).catch(() => undefined)
      return response
    })
    .catch(() => null)

  return cached || await fresh || caches.match('/')
}

async function networkFirst(request, cacheName, fallbackUrl = '') {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone()).catch(() => undefined)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return fallbackUrl ? caches.match(fallbackUrl) : Response.error()
  }
}
