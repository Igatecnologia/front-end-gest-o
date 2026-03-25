import { z } from 'zod'
import type { User, UserRole } from '../mocks/users'
import { SGBR_BI_ACTIVE } from '../api/apiEnv'
import { http } from './http'
import { getValidated, postValidated, ApiContractError } from '../api/validatedHttp'
import { userCreateInputSchema, userSchema, usersResponseSchema } from '../api/schemas'

function assertNotSgbrOnly() {
  if (SGBR_BI_ACTIVE) {
    throw new Error('A API SGBR BI não expõe cadastro de usuários neste projeto.')
  }
}

export async function listUsers(): Promise<User[]> {
  if (SGBR_BI_ACTIVE) return []
  return getValidated(http, '/users', usersResponseSchema)
}

export async function createUser(input: {
  name: string
  email: string
  role: UserRole
  status: User['status']
  password: string
}): Promise<User> {
  assertNotSgbrOnly()
  const payload = userCreateInputSchema.parse(input)
  return postValidated(http, '/users', payload, userSchema)
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<User, 'name' | 'email' | 'role' | 'status' | 'password'>>,
): Promise<User> {
  assertNotSgbrOnly()
  const payload = userCreateInputSchema.partial().parse(patch)
  const res = await http.put(`/users/${id}`, payload)
  const parsed = userSchema.safeParse(res.data)
  if (!parsed.success) {
    throw new ApiContractError('Resposta da API fora do contrato.', parsed.error)
  }
  return parsed.data
}

export async function deleteUser(id: string): Promise<void> {
  assertNotSgbrOnly()
  const parsedId = z.string().min(1).parse(id)
  await http.delete(`/users/${parsedId}`)
}

