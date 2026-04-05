import { App } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { getStoredSession, setStoredSession, type AuthSession } from './authStorage'
import { signIn as signInService } from '../services/authService'
import { onAuthSignOut } from './authEvents'
import { useSessionTimeout } from './useSessionTimeout'
import { http } from '../services/http'
import { tenantStorage } from '../tenant/tenantStorage'

/** Tempo de inatividade antes do auto-logout (30 minutos) */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { notification } = App.useApp()
  const [session, setSession] = useState<AuthSession | null>(() =>
    typeof window !== 'undefined' ? getStoredSession() : null,
  )

  const signOut = useCallback(async () => {
    // Tenta invalidar sessão no backend (fire-and-forget)
    try {
      await http.post('/api/v1/auth/logout').catch(() => {})
    } catch {
      // Falha silenciosa — o importante é limpar o frontend
    }

    setSession(null)
    setStoredSession(null)
    tenantStorage.removeItem('auth.session')
  }, [])

  // Auto-logout por inatividade
  useSessionTimeout(
    useCallback(() => {
      signOut()
      notification.warning({
        message: 'Sessão expirada',
        description: 'Você foi desconectado por inatividade. Faça login novamente.',
        duration: 0,
      })
    }, [signOut, notification]),
    SESSION_TIMEOUT_MS,
    !!session,
  )

  useEffect(() => {
    return onAuthSignOut(() => {
      signOut()
    })
  }, [signOut])

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (input) => {
      const next = await signInService(input)
      setSession(next)
      setStoredSession(next)
      notification.success({
        message: 'Bem-vindo',
        description: next.user.name,
      })
    },
    [notification],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session?.token,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
