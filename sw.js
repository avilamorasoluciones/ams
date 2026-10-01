// AMS root service worker retired.
// The public AMS site is intentionally not a PWA because nested paths host
// independent PWAs (AyuKcal, Herramientas, Juegos, etc.). Keeping a root
// service worker here could overlap their scopes on the same origin.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
