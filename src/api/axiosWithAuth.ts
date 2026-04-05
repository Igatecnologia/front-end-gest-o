import axios, { type AxiosInstance } from 'axios'
import { getStoredSession, setStoredSession } from '../auth/authStorage'
import { emitAuthSignOut } from '../auth/authEvents'
import { getHttpStatusMessage } from './httpError'
import { getCurrentTenantId } from '../tenant/tenantStorage'

/**
 * Lê o CSRF token do cookie `XSRF-TOKEN` (padrão Laravel/Express csurf).
 * Backend deve setar esse cookie em cada resposta.
 */
function readCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

export function createAuthorizedAxios(baseURL: string, timeoutMs = 20_000): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: timeoutMs,
    withCredentials: true,
  })

  instance.interceptors.request.use((config) => {
    const session = getStoredSession()
    config.headers = config.headers ?? {}

    // Auth token
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`
    }

    // Tenant isolation — backend MUST validate
    const tenantId = getCurrentTenantId()
    if (tenantId && tenantId !== 'default') {
      config.headers['X-Tenant-ID'] = tenantId
    }

    // CSRF token para requests que modificam dados
    const method = (config.method ?? 'get').toLowerCase()
    if (MUTATING_METHODS.has(method)) {
      const csrfToken = readCsrfToken()
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken
      }
    }

    return config
  })

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err?.response?.status
      const url = err?.config?.url ?? ''
      // Não fazer logout automático em chamadas de proxy/login — usam tokens externos
      const isProxyOrLogin = url.includes('/api/proxy') || url.includes('/auth/login')
      if (status === 401 && !isProxyOrLogin) {
        setStoredSession(null)
        emitAuthSignOut()
      }
      if (err && typeof err === 'object') {
        ;(err as { contextMessage?: string }).contextMessage = getHttpStatusMessage(status)
      }
      return Promise.reject(err)
    },
  )

  return instance
}
