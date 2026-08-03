const CACHE_NAME = 'egia-shell-v2'
const APP_SHELL = ['/', '/manifest.json', '/logo.svg', '/icon-light-32x32.png', '/apple-icon.png']

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())))
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Never cache authenticated dashboard/API data. It can be stale or belong to another user.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/dashboard/')) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }
  if (url.origin === self.location.origin && /\.(?:js|css|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()))
      return response
    })))
  }
})
