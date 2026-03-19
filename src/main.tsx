import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/reset.css'
import './index.css'
import App from './App'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './auth/AuthProvider'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './query/queryClient'
import { USE_MOCKS } from './api/apiEnv'

async function enableMocking() {
  if (!USE_MOCKS) return
  const { worker } = await import('./mocks/server/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

function routerBasename() {
  const raw = import.meta.env.BASE_URL
  if (raw === '/') return undefined
  return raw.replace(/\/$/, '') || undefined
}

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppErrorBoundary>
              <BrowserRouter basename={routerBasename()}>
                <App />
              </BrowserRouter>
            </AppErrorBoundary>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  )
}

enableMocking().finally(renderApp)
