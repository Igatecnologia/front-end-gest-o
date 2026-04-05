import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Locale, TranslationKeys } from './types'
import { ptBR } from './pt-BR'
import { en } from './en'
import { tenantStorage } from '../tenant/tenantStorage'

const dictionaries: Record<Locale, TranslationKeys> = { 'pt-BR': ptBR, en }

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'i18n.locale'

function resolveInitialLocale(): Locale {
  const stored = tenantStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'pt-BR') return stored
  const nav = navigator.language
  if (nav.startsWith('en')) return 'en'
  return 'pt-BR'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    tenantStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next === 'pt-BR' ? 'pt-BR' : 'en'
  }, [])

  const t = useCallback(
    (key: keyof TranslationKeys, params?: Record<string, string | number>) => {
      let text = dictionaries[locale][key] ?? dictionaries['pt-BR'][key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
