import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico', 
        'robots.txt', 
        'apple-touch-icon.png',
        'screenshot-wide.png',
        'screenshot-narrow.png'
      ],
      manifest: {
        name: 'Sabbath School Tracker',
        short_name: 'SS Tracker',
        description: 'Sabbath School data tracking for Kanyanya SDA Church',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['business', 'education', 'productivity'],
        lang: 'en-US',
        dir: 'ltr',
        icons: [
          {
            src: '/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Sabbath School Tracker Dashboard'
          },
          {
            src: '/screenshot-narrow.png',
            sizes: '375x812',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Sabbath School Tracker Mobile View'
          }
        ],
        shortcuts: [
          {
            name: 'Weekly Data Entry',
            short_name: 'Data Entry',
            description: 'Enter weekly Sabbath School data',
            url: '/secretary/entry',
            icons: [
              {
                src: '/shortcut-data-entry.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'View Reports',
            short_name: 'Reports',
            description: 'View weekly and quarterly reports',
            url: '/reports/weekly',
            icons: [
              {
                src: '/shortcut-reports.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
        runtimeCaching: [
          // API caching for Supabase
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          // Static assets caching
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          // Fonts caching
          {
            urlPattern: /\.(?:woff2|woff|ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          },
          // CSS and JS caching
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              }
            }
          }
        ],
        // Skip waiting for service worker updates
        skipWaiting: true,
        clientsClaim: true,
        // Offline fallback
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
        // Precache additional routes
        additionalManifestEntries: [
          { url: '/offline.html', revision: null }
        ]
      },
      // Dev options (only in development)
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      // PWA minification
      minify: true,
      // Source maps for debugging
      sourcemap: process.env.NODE_ENV !== 'production'
    })
  ],
  server: {
    port: 5173,
    open: true,
    host: true // Allow external access for mobile testing
  },
  build: {
    // Optimize build for PWA
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react']
        }
      }
    },
    // PWA-specific build optimizations
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  preview: {
    port: 5173,
    host: true
  }
})