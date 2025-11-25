// Service Worker for Sabbath School Tracker - SIMPLIFIED
const APP_VERSION = '1.0.3';
const CACHE_NAME = `sabbath-tracker-${APP_VERSION}`;

// Only cache the bare minimum that won't cause 404s
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - Simple network-first approach
self.addEventListener('fetch', (event) => {
  // For CSS files - always fetch fresh, no caching
  if (event.request.url.match(/\.css(\?.*)?$/)) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For all other requests - network first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});