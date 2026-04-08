const CACHE_NAME = 'ss-tracker-v1773250147';
const urlsToCache = [
  '/',
  '/login',
  '/admin',
  '/secretary',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch with Network First strategy and scheme check
self.addEventListener('fetch', (event) => {
  // Only handle http and https requests to avoid chrome-extension errors
  if (!(event.request.url.indexOf('http') === 0)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache valid successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
// rebuild Wed, Mar 11, 2026  3:17:08 PM