export type AuthSession = {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'viewer'
  }
  permissions: string[]
}

const AUTH_STORAGE_KEY = 'app.auth.session'

export function getStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setStoredSession(session: AuthSession | null) {
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

