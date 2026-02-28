import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/fishing-app/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          leaflet: ['leaflet', 'react-leaflet'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
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
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osm-tile-cache',
              expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'esri-tile-cache',
              expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/tiles\.openseamap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'openseamap-tile-cache',
              expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/gis\.charttools\.noaa\.gov\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'noaa-tile-cache',
              expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/basemap\.nationalmap\.gov\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'usgs-tile-cache',
              expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/gis\.blm\.gov\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'blm-lands-tile-cache',
              expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'MyCatchBook',
        short_name: 'MyCatchBook',
        description: 'AI-Powered Fishing Community — Log catches, identify fish, discover spots, and connect with anglers.',
        theme_color: '#0d47a1',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'assets/logo-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo-512.png', sizes: '512x512', type: 'image/png' },
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
