const CACHE_NAME = "juegos-avila-mora-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./impostor.html",
  "./bomba.html",
  "./nosconocemos.html",
  "./rompehielo.html",
  "./tabu.html",
  "./verdadreto.html",
  "./yonunca.html",
  "./styles.css",
  "./scripts.js",
  "./datos.js",
  "./impostor.js",
  "./bomba.js",
  "./nosconocemos.js",
  "./rompehielo.js",
  "./tabu.js",
  "./verdadreto.js",
  "./yonunca.js",
  "./manifest.webmanifest",
  "./icon-192.svg",
  "./icon-512.svg"
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
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });

      return cached || network;
    })
  );
});