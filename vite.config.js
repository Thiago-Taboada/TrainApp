import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'Vortx',
        short_name: 'Vortx',
        description: 'Rutinas, registro de entrenamiento y análisis de progreso.',
        lang: 'es',
        theme_color: '#05070e',
        background_color: '#05070e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell so it opens offline.
        globPatterns: ['**/*.{js,css,html,svg,woff2,ttf}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        // Don't try to cache/serve Firebase API calls from the SW; let the
        // Firestore SDK handle its own offline persistence.
        navigateFallbackDenylist: [/^\/__\//, /firestore\.googleapis\.com/],
      },
      devOptions: {
        enabled: false, // keep the SW off during `npm run dev`
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
})
