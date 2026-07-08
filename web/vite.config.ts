import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NestOS',
        short_name: 'NestOS',
        theme_color: '#0E0F11',
        background_color: '#0E0F11',
        display: 'standalone',
      }
    })
  ],
})
