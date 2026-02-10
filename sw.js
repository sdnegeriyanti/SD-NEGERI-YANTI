// Service Worker untuk ASAS Exam Browser
const CACHE_NAME = 'asas-exam-v2';
const urlsToCache = [
  './',
  './index.html',
  './soal.json',
  './manifest.json',
  // Di manifest.json
"start_url": "https://gogonxxx.github.io/Try-Out-TKA/",
"scope": "https://gogonxxx.github.io/Try-Out-TKA/"
  // Icons akan ditambahkan jika ada
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('⚡ Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  // Hapus cache lama
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️  Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Caching strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Jika ada di cache, return dari cache
        if (cachedResponse) {
          return cachedResponse;
        }

        // Jika tidak ada di cache, fetch dari network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache response untuk future use (kecuali untuk soal.json yang mungkin update)
            if (event.request.url.includes('soal.json')) {
              // Untuk soal.json, cache tapi dengan expiry
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback untuk halaman utama jika offline
            if (event.request.url.includes('.html') || event.request.url === self.location.origin + '/') {
              return caches.match('./index.html');
            }
            // Fallback untuk soal.json
            if (event.request.url.includes('soal.json')) {
              return new Response(JSON.stringify({
                soal: [
                  {
                    id: 1,
                    type: "multiple_choice",
                    q: "Aplikasi sedang offline. Soal tidak dapat dimuat.",
                    choices: ["OK"],
                    answer: 0,
                    score: 0
                  }
                ]
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
          });
      })
  );
});
