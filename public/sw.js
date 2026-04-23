const CACHE_NAME = "week-medwork-v5";
const STATIC_ASSETS = ["/", "/index.html", "/week-logo.jpeg", "/manifest.json"];

// Install: cache static assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Skip Supabase API calls (always network)
  if (url.includes("supabase.co")) return;

  // For navigation requests (HTML pages), try network first, fallback to cache
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For static assets (JS, CSS, images), cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && (url.includes("/assets/") || url.endsWith(".png") || url.endsWith(".css") || url.endsWith(".js"))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => new Response("Offline", { status: 503 }));
    })
  );
});
