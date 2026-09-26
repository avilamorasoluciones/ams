const CACHE_NAME = "juegos-avila-mora-v34";
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
  "./styles.css?v=20260926-18",
  "./scripts.js?v=20260926-34",
  "./datos.js?v=20260926-32",
  "./impostor.js?v=20260926-32",
  "./bomba.js?v=20260926-32",
  "./nosconocemos.js?v=20260926-32",
  "./rompehielo.js?v=20260926-32",
  "./tabu.js?v=20260926-32",
  "./verdadreto.js?v=20260926-32",
  "./yonunca.js?v=20260926-32",
  "./manifest.webmanifest",
  "./pwa-icon-192.svg",
  "./pwa-icon-512.svg",
  "./icon-games.svg",
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
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

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