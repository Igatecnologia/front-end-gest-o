import { describe, expect, it } from 'vitest'
import { signIn } from './authService'

describe('authService', () => {
  it('retorna sessão válida para admin', async () => {
    const session = await signIn({ email: 'admin@admin.com', password: 'admin' })
    expect(session.user.role).toBe('admin')
    expect(session.permissions).toContain('users:write')
  })

  it('falha com credencial inválida', async () => {
    await expect(signIn({ email: 'admin@admin.com', password: 'x' })).rejects.toThrow(
      'E-mail ou senha inválidos.',
    )
  })
})
