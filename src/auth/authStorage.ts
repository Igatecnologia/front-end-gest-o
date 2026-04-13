import { z } from 'zod'
import { getCurrentTenantId, tenantStorage } from '../tenant/tenantStorage'

/** Schema de validação da sessão armazenada — protege contra dados corrompidos/manipulados */
const sessionSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().min(1),
    role: z.enum(['admin', 'manager', 'viewer']),
  }),
  permissions: z.array(z.string()),
})

export type AuthSession = z.infer<typeof sessionSchema>

const AUTH_KEY = 'auth.session'

function getSessionStorageKey(): string {
  return `t:${getCurrentTenantId()}:${AUTH_KEY}`
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(getSessionStorageKey())
    if (!raw) return null
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      // Dados corrompidos ou manipulados — limpar
      window.sessionStorage.removeItem(getSessionStorageKey())
      tenantStorage.removeItem(AUTH_KEY)
      return null
    }
    return parsed.data
  } catch {
    window.sessionStorage.removeItem(getSessionStorageKey())
    tenantStorage.removeItem(AUTH_KEY)
    return null
  }
}

export function setStoredSession(session: AuthSession | null) {
  if (!session) {
    window.sessionStorage.removeItem(getSessionStorageKey())
    tenantStorage.removeItem(AUTH_KEY)
    return
  }
  window.sessionStorage.setItem(getSessionStorageKey(), JSON.stringify(session))
}
