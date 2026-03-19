import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
// Para GitHub Pages (projeto em subpasta), defina na build: VITE_BASE=/nome-do-repo/
const base = (process.env.VITE_BASE ?? '/').replace(/\/+$/, '') + '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
