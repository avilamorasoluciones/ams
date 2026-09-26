const CACHE_NAME = "ayukcal-app-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./db.js",
  "./supabase/config.js",
  "./manifest.webmanifest",
  "./assets/ayukcal-avocado.svg"
];

const STATIC_THIRD_PARTY = [
  "cdn.jsdelivr.net",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "tesseract.projectnaptha.com",
  "unpkg.com"
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
  const sameOrigin = url.origin === self.location.origin;
  const thirdParty = STATIC_THIRD_PARTY.includes(url.hostname);
  if (!sameOrigin && !thirdParty) return;

  const fresh = sameOrigin && (
    event.request.mode === "navigate" ||
    ["script","style","manifest"].includes(event.request.destination)
  );

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    try {
      const request = fresh ? new Request(event.request, { cache: "no-store" }) : event.request;
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) {
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