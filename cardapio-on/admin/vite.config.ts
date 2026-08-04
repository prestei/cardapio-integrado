import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    // 5180 evita conflito com cardapio-adm na 5173
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3334',
        changeOrigin: true,
      },
    },
  },
})
