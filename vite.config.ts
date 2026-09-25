import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages はリポジトリ名の下の階層で配信されるため、相対パスで組み立てる
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // 一度開けば通信なしで動くよう、アプリ一式を端末に保存する（ADR-0003）
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'third-party-notices.txt'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,webp,txt}'],
      },
      manifest: {
        name: '認字 NINJI',
        short_name: '認字',
        description: 'Practice recognizing kanji shapes.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f5f4f0',
        theme_color: '#f5f4f0',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
