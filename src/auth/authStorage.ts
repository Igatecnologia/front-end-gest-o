import { tenantStorage } from '../tenant/tenantStorage'

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

const AUTH_KEY = 'auth.session'

export function getStoredSession(): AuthSession | null {
  try {
    const raw = tenantStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setStoredSession(session: AuthSession | null) {
  if (!session) {
    tenantStorage.removeItem(AUTH_KEY)
    return
  }
  tenantStorage.setItem(AUTH_KEY, JSON.stringify(session))
}
