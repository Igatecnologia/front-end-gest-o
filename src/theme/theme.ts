import { tenantStorage } from '../tenant/tenantStorage'

export type AppThemeMode = 'light' | 'dark'

const THEME_KEY = 'theme.mode'

export function getStoredThemeMode(): AppThemeMode {
  const raw = typeof window !== 'undefined' ? tenantStorage.getItem(THEME_KEY) : null
  return raw === 'dark' ? 'dark' : 'light'
}

export function setStoredThemeMode(mode: AppThemeMode) {
  tenantStorage.setItem(THEME_KEY, mode)
}
