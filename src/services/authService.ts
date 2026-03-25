import { sleep } from '../utils/sleep'
import { sha256Hex } from '../utils/sha256Hex'
import type { AuthSession } from '../auth/authStorage'
import { listUsers } from './usersService'
import { usersSeed } from '../mocks/users'
import { AUTH_BACKEND } from '../api/apiEnv'
import { postValidated } from '../api/validatedHttp'
import { sgbrUsuarioLoginResponseSchema } from '../api/schemas'
import { getErrorMessage } from '../api/httpError'
import { sgbrBiHttp } from './sgbrBiHttp'

type SignInInput = { email: string; password: string }

const ADMIN_PERMISSIONS: AuthSession['permissions'] = [
  'dashboard:view',
  'reports:view',
  'reports:export',
  'audit:view',
  'audit:export',
  'users:view',
  'users:write',
]

async function signInMock(input: SignInInput): Promise<AuthSession> {
  await sleep(600)

  const email = input.email.trim().toLowerCase()
  const password = input.password

  const users = await (async () => {
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
  const permissionsByRole: Record<typeof role, AuthSession['permissions']> = {
    admin: ADMIN_PERMISSIONS,
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

async function signInSgbrBi(input: SignInInput): Promise<AuthSession> {
  if (!sgbrBiHttp) {
    throw new Error(
      'SGBR BI desativado: em dev use VITE_SGBR_BI_BASE_URL=proxy (recomendado) ou a URL do servidor.',
    )
  }

  const login = input.email.trim()
  if (!login) throw new Error('Informe o usuário.')

  const senha = await sha256Hex(input.password)

  try {
    const data = await postValidated(sgbrBiHttp, '/sgbrbi/usuario/login', { login, senha }, sgbrUsuarioLoginResponseSchema)

    const email = data.email?.trim() || `${data.nome_usuario}@sgbr.local`

    return {
      token: data.token,
      user: {
        id: String(data.id_usuario),
        name: data.nome_usuario,
        email,
        role: 'admin',
      },
      permissions: ADMIN_PERMISSIONS,
    }
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Falha ao autenticar no SGBR BI.'))
  }
}

export async function signIn(input: SignInInput): Promise<AuthSession> {
  if (AUTH_BACKEND === 'sgbrbi') {
    return signInSgbrBi(input)
  }
  return signInMock(input)
}
