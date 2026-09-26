const CACHE_NAME = 'ams-tools-v5';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./icon-192.svg','./icon-512.svg','../img/ams-favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const fresh = event.request.mode === 'navigate' ||
    ['script','style','manifest'].includes(event.request.destination);

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    try {
      const request = fresh ? new Request(event.request, { cache: 'no-store' }) : event.request;
      const response = await fetch(request);
      if (response?.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    }
  })());
});