// service worker: קודם רשת, ומהמטמון רק כשאין רשת. בקשות ל-/api לא נשמרות אף פעם.
const CACHE = "joke-v1";

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/assets/logo.svg",
  "/assets/mascot-idle.svg",
  "/assets/mascot-think.svg",
  "/assets/mascot-joke.svg",
  "/assets/mascot-error.svg",
  "/assets/bg-dots.svg",
  "/assets/bg-doodles.svg",
  "/assets/icon.svg",
  "/assets/icon-maskable.svg",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // לא נוגעים: בקשה שאינה GET, כתובת אחרת, או /api
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === "navigate") return caches.match("/");
        return Response.error();
      })
  );
});
