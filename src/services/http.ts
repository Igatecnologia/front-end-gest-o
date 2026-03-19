import axios from 'axios'
import { getStoredSession, setStoredSession } from '../auth/authStorage'
import { emitAuthSignOut } from '../auth/authEvents'
import { API_BASE_URL } from '../api/apiEnv'
import { getHttpStatusMessage } from '../api/httpError'

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
})

http.interceptors.request.use((config) => {
  const session = getStoredSession()
  if (session?.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      setStoredSession(null)
      emitAuthSignOut()
    }
    if (err && typeof err === 'object') {
      ;(err as { contextMessage?: string }).contextMessage = getHttpStatusMessage(status)
    }
    return Promise.reject(err)
  },
)

