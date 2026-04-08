import type { AuthSession } from '../auth/authStorage'
import { postValidated } from '../api/validatedHttp'
import { localLoginResponseSchema, sgbrUsuarioLoginResponseSchema } from '../api/schemas'
import { http } from './http'
import { getAuthDataSource } from './dataSourceService'

type SignInInput = { email: string; password: string }

const ALL_PERMISSIONS: AuthSession['permissions'] = [
  'dashboard:view',
  'reports:view',
  'reports:export',
  'audit:view',
  'audit:export',
  'users:view',
  'users:write',
  'producao:view',
  'producao:write',
  'fichatecnica:view',
  'fichatecnica:write',
  'comercial:view',
  'comercial:write',
  'estoque:view',
  'estoque:write',
  'alertas:view',
]

/** Mensagem genérica — não revela se o usuário existe ou não */
const INVALID_CREDENTIALS_MSG = 'Usuário ou senha incorretos.'

/**
 * Tenta login local (usuarios do proprio sistema).
 * Se falhar com 401, e houver fonte SGBR configurada como auth, tenta via proxy.
 */
export async function signIn(input: SignInInput): Promise<AuthSession> {
  const login = input.email.trim()
  if (!login) throw new Error('Informe o usuário.')

  // 1. Tenta login local
  try {
    const data = await postValidated(
      http,
      '/api/v1/auth/login',
      { email: login, password: input.password },
      localLoginResponseSchema,
    )

    return {
      token: data.token,
      user: data.user,
      permissions: ALL_PERMISSIONS,
    }
  } catch (localErr) {
    const is401 =
      localErr instanceof Error &&
      (localErr.message.includes('401') || localErr.message.includes('incorretos'))

    if (!is401) {
      throw new Error('Falha ao conectar com o servidor. Tente novamente.')
    }

    // 2. Se houver fonte SGBR marcada como auth, tenta via proxy
    const authSource = getAuthDataSource()
    if (authSource) {
      try {
        const data = await postValidated(
          http,
          '/api/proxy/login',
          { login, password: input.password },
          sgbrUsuarioLoginResponseSchema,
        )

        const email = data.email?.trim() || `${data.nome_usuario}@local`

        return {
          token: data.token,
          user: {
            id: String(data.id_usuario),
            name: data.nome_usuario,
            email,
            role: 'admin',
          },
          permissions: ALL_PERMISSIONS,
        }
      } catch {
        throw new Error(INVALID_CREDENTIALS_MSG)
      }
    }

    throw new Error(INVALID_CREDENTIALS_MSG)
  }
}
