import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "node:path";
import { cpSync } from "node:fs";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    {
      name: 'copy-scandit-lib',
      buildStart() {
        cpSync(
          path.resolve(__dirname, 'node_modules/@scandit/web-datacapture-barcode/sdc-lib'),
          path.resolve(__dirname, 'public/scandit-lib'),
          { recursive: true }
        );
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'LWT Scanner — Leeuwse Wieler Toeristen',
        short_name: 'LWT Scanner',
        description: 'Scan het rijksregisternummer (INSZ) met de camera. Een app van de Leeuwse Wieler Toeristen.',
        lang: 'nl-BE',
        theme_color: '#EB0029',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The Scandit engine (~8 MB per variant, 4 variants) must not be
        // precached: every device only ever loads one variant. Cache it on
        // first use instead so scanning keeps working offline.
        globIgnores: ['scandit-lib/**'],
        runtimeCaching: [
          {
            urlPattern: /\/scandit-lib\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'scandit-engine',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
  },
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom'],
          'mui-vendor':    ['@mui/material', '@emotion/react', '@emotion/styled'],
          'scandit-vendor': ['@scandit/web-datacapture-core', '@scandit/web-datacapture-barcode'],
        },
      },
    },
  },
})
