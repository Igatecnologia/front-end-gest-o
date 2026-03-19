import { sleep } from '../utils/sleep'
import type { AuthSession } from '../auth/authStorage'
import { listUsers } from './usersService'
import { usersSeed } from '../mocks/users'

type SignInInput = { email: string; password: string }

// Mock: troque por API real depois (http.post('/auth/login', ...))
export async function signIn(input: SignInInput): Promise<AuthSession> {
  await sleep(600)

  const email = input.email.trim().toLowerCase()
  const password = input.password

  const users = await (async () => {
    // Em testes (vitest), `window` não existe e o MSW/HTTP não é confiável.
    if (typeof window === 'undefined') return usersSeed
    try {
      return await listUsers()
    } catch {
      return usersSeed
    }
  })()

  const user = users.find((u) => u.email === email && u.status === 'active') ?? null
  if (!user || user.password !== password) throw new Error('E-mail ou senha inválidos.')

  const role = user.role
  const permissionsByRole: Record<typeof role, string[]> = {
    admin: [
      'dashboard:view',
      'reports:view',
      'reports:export',
      'audit:view',
      'audit:export',
      'users:view',
      'users:write',
    ],
    manager: ['dashboard:view', 'reports:view', 'reports:export', 'audit:view', 'users:view'],
    viewer: ['dashboard:view', 'reports:view'],
  }

  return {
    token: `mock-jwt-token:${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
    },
    permissions: permissionsByRole[role],
  }
}

