import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'screenshot-wide.png',
        'screenshot-narrow.png',
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
            src: '/icon-192x192.png', 
            sizes: '192x192', 
            type: 'image/png', 
            purpose: 'maskable any' 
          },
          { 
            src: '/icon-512x512.png', 
            sizes: '512x512', 
            type: 'image/png', 
            purpose: 'maskable any' 
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
      },
      devOptions: { 
        enabled: true 
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 1000,
  },
});