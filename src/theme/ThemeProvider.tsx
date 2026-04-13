import { App, ConfigProvider, theme as antdTheme } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'
import {
  getStoredThemeMode,
  setStoredThemeMode,
  type AppThemeMode,
} from './theme'

const quantum = {
  dark: {
    canvas: '#080D12',
    surface: '#111920',
    elevated: '#19232E',
    border: '#243344',
    primary: '#4AABE0',
    secondary: '#2196D3',
    text: '#E8EEF4',
    muted: '#8A9BB0',
  },
  /** Tema claro: canvas levemente azulado, bordas em dois níveis, superfície elevada ≠ branco puro (profundidade). */
  light: {
    canvas: '#eef3f8',
    surface: '#ffffff',
    elevated: '#fafcfe',
    border: '#c9d8e6',
    borderSubtle: '#e3edf6',
    primary: '#1A7AB5',
    secondary: '#0D5A8C',
    text: '#0f1c28',
    muted: '#5a6d7d',
  },
} as const

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>(() => getStoredThemeMode())

  const setMode = useCallback((next: AppThemeMode) => {
    setModeState(next)
    setStoredThemeMode(next)
  }, [])

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      setStoredThemeMode(next)
      return next
    })
  }, [])

  const algorithm =
    mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm

  const value: ThemeContextValue = { mode, setMode, toggle }
  const palette = mode === 'dark' ? quantum.dark : quantum.light

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  const themeConfig = useMemo(() => {
    const isLight = mode === 'light'

    return {
      algorithm,
      token: {
        fontFamily:
          "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: 14,
        borderRadius: 12,
        controlHeight: 36,
        controlHeightLG: 40,

        colorPrimary: palette.primary,
        colorInfo: palette.primary,
        colorBorder: palette.border,
        colorBorderSecondary: isLight ? quantum.light.borderSubtle : palette.border,
        colorSplit: isLight ? '#e8f0f7' : palette.border,

        colorText: palette.text,
        colorTextSecondary: palette.muted,
        ...(isLight
          ? {
              colorTextTertiary: '#8b9bab',
              colorFillAlter: '#f6f9fc',
              colorFillSecondary: '#eef3f8',
              colorFillTertiary: '#e4ecf4',
              colorPrimaryBg: '#e4f0f8',
              colorPrimaryBgHover: '#d4e8f4',
              colorPrimaryBorder: '#9cc4e0',
              controlOutline: 'rgba(26, 122, 181, 0.2)',
              boxShadow:
                '0 1px 2px rgba(15, 28, 42, 0.04), 0 4px 14px rgba(15, 28, 42, 0.06)',
              boxShadowSecondary:
                '0 8px 24px rgba(15, 28, 42, 0.08)',
            }
          : {}),

        colorBgBase: palette.canvas,
        colorBgLayout: palette.canvas,
        colorBgContainer: palette.surface,
        colorBgElevated:
          mode === 'dark' ? quantum.dark.elevated : quantum.light.elevated,

        colorLink: palette.primary,
        colorLinkHover: palette.secondary,
      },
      components: {
        Layout: {
          headerHeight: 64,
          headerBg: palette.surface,
          siderBg: palette.surface,
          bodyBg: palette.canvas,
        },
        Card: { paddingLG: 20 },
        Table: {
          headerBorderRadius: 12,
          headerBg: mode === 'dark' ? quantum.dark.elevated : '#e6eef6',
          borderColor: palette.border,
          rowHoverBg: mode === 'dark' ? '#1a2a38' : '#f2f7fb',
          rowSelectedBg: mode === 'dark' ? '#1a2a38' : '#e8f2fa',
          rowSelectedHoverBg: mode === 'dark' ? '#1f3142' : '#ddeef8',
        },
        Button: { borderRadius: 10 },
        Input: {
          activeBorderColor: palette.primary,
          hoverBorderColor: palette.primary,
          ...(isLight
            ? {
                activeShadow: '0 0 0 2px rgba(26, 122, 181, 0.12)',
              }
            : {}),
        },
        Select: {
          optionSelectedBg: mode === 'dark' ? '#1a2a38' : '#e4f0f8',
        },
        Menu: {
          itemSelectedBg:
            mode === 'dark'
              ? 'rgba(74, 171, 224, 0.14)'
              : 'rgba(26, 122, 181, 0.10)',
          itemSelectedColor: palette.primary,
          itemHoverBg:
            mode === 'dark'
              ? 'rgba(74, 171, 224, 0.08)'
              : 'rgba(26, 122, 181, 0.06)',
        },
        Modal: isLight
          ? {
              contentBg: quantum.light.surface,
              headerBg: quantum.light.surface,
              footerBg: quantum.light.surface,
            }
          : {},
      },
    }
  }, [algorithm, mode, palette])

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={themeConfig} locale={ptBR}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

