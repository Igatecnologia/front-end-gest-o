const LOGIN_PATH = '/login'

/**
 * Caminho seguro para `Navigate` / `navigate` após login.
 * Rejeita URLs absolutas, protocol-relative (`//`), barras invertidas e redireciono para `/login` (evita loop).
 */
export function sanitizeAppRedirectPath(
  from: unknown,
  fallback: string = '/dashboard',
): string {
  if (typeof from !== 'string') return fallback
  const t = from.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return fallback
  if (t.includes('\\') || t.includes('\0')) return fallback
  if (t === LOGIN_PATH || t.startsWith(`${LOGIN_PATH}/`) || t.startsWith(`${LOGIN_PATH}?`)) {
    return fallback
  }
  return t || fallback
}
