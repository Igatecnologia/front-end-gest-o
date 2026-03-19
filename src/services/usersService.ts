import { z } from 'zod'
import type { User, UserRole } from '../mocks/users'
import { http } from './http'
import { getValidated, postValidated, ApiContractError } from '../api/validatedHttp'
import { userCreateInputSchema, userSchema, usersResponseSchema } from '../api/schemas'

export async function listUsers(): Promise<User[]> {
  return getValidated(http, '/users', usersResponseSchema)
}

export async function createUser(input: {
  name: string
  email: string
  role: UserRole
  status: User['status']
  password: string
}): Promise<User> {
  const payload = userCreateInputSchema.parse(input)
  return postValidated(http, '/users', payload, userSchema)
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<User, 'name' | 'email' | 'role' | 'status' | 'password'>>,
): Promise<User> {
  const payload = userCreateInputSchema.partial().parse(patch)
  const res = await http.put(`/users/${id}`, payload)
  const parsed = userSchema.safeParse(res.data)
  if (!parsed.success) {
    throw new ApiContractError('Resposta da API fora do contrato.', parsed.error)
  }
  return parsed.data
}

export async function deleteUser(id: string): Promise<void> {
  const parsedId = z.string().min(1).parse(id)
  await http.delete(`/users/${parsedId}`)
}

