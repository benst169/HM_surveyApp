// Bump this whenever you change what gets pre-cached, so old caches get cleared out.
const CACHE_NAME = 'shiny-app-cache-v1';

// Only include files you know exist in www/ - this is intentionally minimal.
const PRECACHE_ASSETS = [
  'offline.html',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Install: pre-cache the offline fallback page and icons.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove any old cache versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: for the app page itself, always try the network first (Shiny needs
// a live connection anyway) and only show the offline page if that fails.
// For static assets (css/js/img), serve from cache first for speed, and
// opportunistically update the cache in the background.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((response) => {
          if (response && response.status === 200 && req.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
