import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/spica.svg'],
      manifest: {
        name: 'Spica Planetarium',
        short_name: 'Spica',
        description: 'Explore a location- and time-correct night sky.',
        theme_color: '#080b12',
        background_color: '#080b12',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'icons/spica.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,wasm,ttf}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/skydata/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'spica-skydata-v1',
              expiration: { maxEntries: 240, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}']
  }
})
