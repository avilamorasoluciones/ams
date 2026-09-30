// AMS root service worker retired.
// The public AMS site is intentionally not a PWA because nested paths host
// independent PWAs (AyuKcal, Herramientas, Juegos, etc.). Keeping a root
// service worker here could overlap their scopes on the same origin.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});