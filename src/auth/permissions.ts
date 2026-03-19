import type { AuthSession } from './authStorage'

export type Permission =
  | 'dashboard:view'
  | 'reports:view'
  | 'reports:export'
  | 'audit:view'
  | 'audit:export'
  | 'users:view'
  | 'users:write'

export function hasPermission(
  session: AuthSession | null,
  permission: Permission,
) {
  return !!session?.permissions?.includes(permission)
}

