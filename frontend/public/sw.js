// Service Worker for Sabbath School Tracker - FIXED CSS CACHING
const APP_VERSION = '1.0.2'; // Updated version
const CACHE_NAME = `sabbath-tracker-${APP_VERSION}`;

// Critical app shell files ONLY (avoid caching CSS/JS that change frequently)
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
  // REMOVED: '/static/js/bundle.js', '/static/css/main.css' - these cause issues
];

// Install event - cache only essential static files
self.addEventListener('install', (event) => {
  console.log(`Service Worker installing for version ${APP_VERSION}`);
  
  // Force the waiting Service Worker to become active immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        // Only cache truly static assets
        return cache.addAll(urlsToCache).catch(error => {
          console.log('Cache addAll failed:', error);
        });
      })
  );
});

// Fetch event - NEVER cache CSS files, always fetch fresh
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return;
  
  const requestUrl = event.request.url;
  
  // STRATEGY 1: For CSS files - ALWAYS NETWORK FIRST, no caching
  if (requestUrl.match(/\.css(\?.*)?$/)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Return fresh CSS, never cache it
          return response;
        })
        .catch(error => {
          console.log('CSS fetch failed, no fallback:', error);
          // Let the browser handle the error
          return fetch(event.request);
        })
    );
    return;
  }
  
  // STRATEGY 2: For JS files - NETWORK FIRST, then cache as fallback
  if (requestUrl.match(/\.js(\?.*)?$/)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache JS files only if network succeeds
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(error => {
          // If network fails, try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || fetch(event.request);
            });
        })
    );
    return;
  }
  
  // STRATEGY 3: For images and manifest - CACHE FIRST
  if (requestUrl.match(/\.(png|jpg|jpeg|gif|ico|webp|svg|json)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached version if found
          if (response) {
            return response;
          }
          
          // Otherwise fetch and cache
          return fetch(event.request)
            .then(fetchResponse => {
              if (fetchResponse && fetchResponse.status === 200) {
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return fetchResponse;
            });
        })
    );
    return;
  }
  
  // STRATEGY 4: For HTML pages - NETWORK FIRST, then cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // For successful responses, update cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(error => {
        // If network fails, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            return cachedResponse || fetch(event.request);
          });
      })
  );
});

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating - cleaning old caches');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches except current version
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      console.log('Service Worker claiming clients');
      return self.clients.claim();
    })
  );
});

// Optional: Add message handling for manual cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
});