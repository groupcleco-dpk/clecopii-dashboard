// ============================================================
//  Cleco Pii — Service Worker
//  Mengaktifkan PWA: install, offline cache, update otomatis
// ============================================================

var CACHE_NAME = 'cleco-pii-v1';
var URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

// Install: cache semua file penting
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching app shell');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  // Langsung aktif tanpa tunggu tab lama ditutup
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('[SW] Hapus cache lama:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, fallback ke cache
// Strategi: coba ambil dari internet dulu (data selalu fresh)
// Jika offline, tampilkan dari cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Simpan response terbaru ke cache
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Offline: ambil dari cache
        return caches.match(event.request).then(function(cached) {
          if (cached) {
            return cached;
          }
          // Jika tidak ada di cache, tampilkan halaman offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Notifikasi update tersedia
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
