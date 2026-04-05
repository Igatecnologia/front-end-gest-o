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
  light: {
    canvas: '#F2F6FA',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#D4DFE9',
    primary: '#1A7AB5',
    secondary: '#0D5A8C',
    text: '#0F1C28',
    muted: '#546878',
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

  const themeConfig = useMemo(
    () => ({
      algorithm,
      token: {
        // Typography / spacing
        fontFamily:
          "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        fontSize: 14,
        borderRadius: 12,
        controlHeight: 36,
        controlHeightLG: 40,

        // Palette
        colorPrimary: palette.primary,
        colorInfo: palette.primary,
        colorBorder: palette.border,
        colorBorderSecondary: palette.border,
        colorSplit: palette.border,

        colorText: palette.text,
        colorTextSecondary: palette.muted,

        // Backgrounds
        colorBgBase: palette.canvas,
        colorBgLayout: palette.canvas,
        colorBgContainer: palette.surface,
        colorBgElevated:
          mode === 'dark' ? quantum.dark.elevated : quantum.light.elevated,

        // Link colors
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
          headerBg: mode === 'dark' ? quantum.dark.elevated : '#e8f0f6',
          borderColor: palette.border,
          rowHoverBg: mode === 'dark' ? '#1a2a38' : '#f0f6fa',
        },
        Button: { borderRadius: 10 },
        Input: {
          activeBorderColor: palette.primary,
          hoverBorderColor: palette.primary,
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
      },
    }),
    [algorithm, mode, palette],
  )

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={themeConfig} locale={ptBR}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

