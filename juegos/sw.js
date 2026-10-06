const CACHE_NAME = 'ams-games-20261006-52';
const CACHE_PREFIX = "ams-games-";
const APP_SHELL = [
  "./",
  "./index.html",
  "./apuesta.html",
  "./impostor.html",
  "./bomba.html",
  "./duelo.html",
  "./nosconocemos.html",
  "./rompehielo.html",
  "./tabu.html",
  "./verdadreto.html",
  "./yonunca.html",
  "./styles.css?v=20261006-50",
  "./styles.css?v=20261004-01",
  "./styles.css?v=20261006-53",
  "./scripts.js?v=20261006-50",
  "./scripts.js?v=20261001-46",
  "./scripts.js?v=20261005-01",
  "./scripts.js?v=20261006-54",
  "./manifest.webmanifest?v=23",
  "./datos.js?v=20261001-46",
  "./datos.js?v=20261003-48",
  "./datos_nuevos.js?v=20261005-02",
  "./apuesta.js?v=20261005-03",
  "./impostor.js?v=20261004-12",
  "./bomba.js?v=20261004-04",
  "./duelo.js?v=20261006-08",
  "./nosconocemos.js?v=20261004-04",
  "./rompehielo.js?v=20261004-03",
  "./tabu.js?v=20261004-56",
  "./verdadreto.js?v=20261004-03",
  "./yonunca.js?v=20261004-03",
  "./manifest.webmanifest?v=20260929-36",
  "./pwa-icon-192.svg",
  "./pwa-icon-192.svg?v=22",
  "./pwa-icon-512.svg?v=22",
  "./icon-games.svg",
  "./ams-fly/condor-colombia.svg",
  "./game-apuesta.svg",
  "./game-duelo.svg",
  "./game-impostor.svg",
  "./game-bomba.svg",
  "./game-nosconocemos.svg",
  "./game-rompehielo.svg",
  "./game-tabu.svg",
  "./game-verdadreto.svg",
  "./game-yonunca.svg",
  "./tool-dice.svg",
  "./tool-cards.svg",
  "./ui-icons.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(APP_SHELL.map(async url => {
        const request = new Request(url, { cache: "no-store" });
        const response = await fetch(request);
        if (!response.ok) throw new Error("No se pudo precargar " + url);
        await cache.put(request, response.clone());
      }));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) return;

  const freshDestinations = new Set(["document", "script", "style", "manifest"]);
  const mustBeFresh = event.request.mode === "navigate" || freshDestinations.has(event.request.destination);

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);

      try {
        // Los documentos y recursos de código siempre intentan red primero.
        // Así una publicación nueva no queda atrapada detrás del caché local.
        const request = mustBeFresh
          ? new Request(event.request, { cache: "no-store" })
          : event.request;
        const response = await fetch(request);

        if (response && response.ok) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, copy);
        }
        return response;
      } catch {
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      }
    })()
  );
});
