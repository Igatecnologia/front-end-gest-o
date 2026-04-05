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
  }
})
