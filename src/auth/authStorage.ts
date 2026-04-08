import { z } from 'zod'
import { tenantStorage } from '../tenant/tenantStorage'

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

export function getStoredSession(): AuthSession | null {
  try {
    const raw = tenantStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      // Dados corrompidos ou manipulados — limpar
      tenantStorage.removeItem(AUTH_KEY)
      return null
    }
    return parsed.data
  } catch {
    tenantStorage.removeItem(AUTH_KEY)
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
