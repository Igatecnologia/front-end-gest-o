export type AppThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'app.theme.mode'

export function getStoredThemeMode(): AppThemeMode {
  const raw =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(THEME_STORAGE_KEY)
      : null
  return raw === 'dark' ? 'dark' : 'light'
}

export function setStoredThemeMode(mode: AppThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
}

