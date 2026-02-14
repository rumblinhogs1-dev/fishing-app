import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'weather-api-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.tidesandcurrents\.noaa\.gov\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tide-api-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'geocode-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'Fishing Log',
        short_name: 'Fishing Log',
        description: 'Log catches, plan trips, and track your fishing adventures',
        theme_color: '#0d47a1',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/fish-icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  server: {
    watch: {
      ignored: ['**/ios/**', '**/android/**'],
    },
  },
})
