import axios, { type AxiosInstance } from 'axios'
import { getStoredSession, setStoredSession } from '../auth/authStorage'
import { emitAuthSignOut } from '../auth/authEvents'
import { getHttpStatusMessage } from './httpError'

export function createAuthorizedAxios(baseURL: string, timeoutMs = 20_000): AxiosInstance {
  const instance = axios.create({ baseURL, timeout: timeoutMs })

  instance.interceptors.request.use((config) => {
    const session = getStoredSession()
    if (session?.token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${session.token}`
    }
    return config
  })

  instance.interceptors.response.use(
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

  return instance
}
