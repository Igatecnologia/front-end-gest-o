import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const base = (env.VITE_BASE ?? '/').replace(/\/+$/, '') + '/'
  const sgbrProxyTarget =
    env.VITE_SGBR_BI_PROXY_TARGET?.toString().trim() || 'http://108.181.223.103:3007'

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/sgbrbi': {
          target: sgbrProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) return 'vendor-pdf'
            if (id.includes('node_modules/html2canvas')) return 'vendor-html2canvas'
            if (id.includes('node_modules/recharts')) return 'vendor-charts'
            if (id.includes('node_modules/@tanstack')) return 'vendor-query'
            return undefined
          },
        },
      },
      chunkSizeWarningLimit: 650,
    },
  }
})
