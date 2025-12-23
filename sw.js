const CACHE_NAME = 'fusion-cache-v1';
const URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './avatar.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Try cache first, then network, then fallback to cache index.html
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // put a copy in the cache for future
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        return response;
      }).catch(() => {
        // fallback - if the request is a navigation, return cached root
        if (event.request.mode === 'navigate') {
          return caches.match('./');
        }
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});