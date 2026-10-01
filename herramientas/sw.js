const CACHE_NAME = 'ams-tools-v19';
const CACHE_PREFIX = 'ams-tools-';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest?v=18',
  './icon-192.svg?v=18',
  './icon-512.svg?v=18',
  '../img/ams-favicon.svg'
];

const EXTERNAL_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

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
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const trustedExternal = EXTERNAL_HOSTS.has(url.hostname);

  // Solo cacheamos recursos externos que esta aplicación carga de forma conocida.
  // Esto permite que PDF.js, pdf-lib, JSZip, Cropper, QRCode, Bootstrap y fuentes
  // queden disponibles offline después de haber sido cargados al menos una vez.
  if (!sameOrigin && !trustedExternal) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);

    // Los recursos externos son estáticos: cache-first evita depender de la red
    // una vez que ya fueron descargados.
    if (cached && trustedExternal) return cached;

    try {
      const request = sameOrigin
        ? new Request(event.request, { cache: 'no-store' })
        : event.request;
      const response = await fetch(request);

      if (response && (response.ok || response.type === 'opaque')) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (cached) return cached;
      if (sameOrigin && event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return Response.error();
    }
  })());
});
