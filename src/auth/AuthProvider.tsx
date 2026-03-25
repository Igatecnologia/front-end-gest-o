import { App } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { getStoredSession, setStoredSession, type AuthSession } from './authStorage'
import { signIn as signInService } from '../services/authService'
import { onAuthSignOut } from './authEvents'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { notification } = App.useApp()
  const [session, setSession] = useState<AuthSession | null>(() =>
    typeof window !== 'undefined' ? getStoredSession() : null,
  )

  const signOut = useCallback(() => {
    setSession(null)
    setStoredSession(null)
  }, [])

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
        title: 'Bem-vindo',
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

