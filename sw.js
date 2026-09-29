const CACHE_NAME = "ams-main-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./scripts.js",
  "./contacto.js",
  "./manifest.webmanifest",
  "./img/ams-favicon.svg",
  "./img/ams-icon-192.svg",
  "./img/ams-icon-512.svg",
  "./legal_privacidad.html",
  "./legal_terminos.html",
  "./legal_cookies.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const cachedFirst = event.request.destination === "image" || event.request.destination === "font";
  const fresh = event.request.mode === "navigate" || ["script", "style", "manifest"].includes(event.request.destination);

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    try {
      if (cachedFirst && cached) return cached;
      const request = fresh ? new Request(event.request, { cache: "no-store" }) : event.request;
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (cached) return cached;
      if (event.request.mode === "navigate") return caches.match("./index.html");
      return Response.error();
    }
  })());
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});