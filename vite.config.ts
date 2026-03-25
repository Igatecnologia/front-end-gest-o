import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Para GitHub Pages (projeto em subpasta), defina na build: VITE_BASE=/nome-do-repo/
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
        // Com VITE_SGBR_BI_BASE_URL=proxy no dev, o browser chama /sgbrbi/... na mesma origem e o Vite encaminha (evita CORS).
        '/sgbrbi': {
          target: sgbrProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
