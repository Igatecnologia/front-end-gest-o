import { createContext, useContext } from 'react'
import type { AuthSession } from './authStorage'

export type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

