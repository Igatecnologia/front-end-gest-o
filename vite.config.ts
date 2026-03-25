import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Para GitHub Pages (projeto em subpasta), defina na build: VITE_BASE=/nome-do-repo/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (mode === 'production') {
    const mocksOn = String(env.VITE_USE_MOCKS ?? 'false').toLowerCase() === 'true'
    const authMock =
      env.VITE_AUTH_BACKEND?.toString().trim().toLowerCase() === 'mock'
    if (mocksOn) {
      throw new Error(
        'Build de produção bloqueada: VITE_USE_MOCKS=true. Use npm run build:e2e (modo e2e) para MSW, ou remova/ajuste o .env.',
      )
    }
    if (authMock) {
      throw new Error(
        'Build de produção bloqueada: VITE_AUTH_BACKEND=mock. Remova ou use outro backend nas variáveis de ambiente do build.',
      )
    }
  }

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
