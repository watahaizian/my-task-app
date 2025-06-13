import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // '/api' から始まるリクエストを、バックエンドサーバーに転送する
      '/api': {
        target: 'http://localhost:8787', // あなたのバックエンドサーバーのURL
        changeOrigin: true,
      }
    }
  }
})
