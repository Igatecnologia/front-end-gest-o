import { ConfigProvider, theme as antdTheme } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'
import {
  getStoredThemeMode,
  setStoredThemeMode,
  type AppThemeMode,
} from './theme'

const quantum = {
  dark: {
    canvas: '#0D0F12',
    surface: '#151A21',
    elevated: '#1B212B',
    border: '#2A3442',
    primary: '#7A86FF',
    secondary: '#00D4D4',
    text: '#F7F8F8',
    muted: '#A6B0BE',
  },
  light: {
    canvas: '#F6F8FC',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#DDE3EE',
    primary: '#4F46E5',
    secondary: '#0891B2',
    text: '#111827',
    muted: '#475569',
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

        // Quantum Carbon tokens
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
          headerBg: mode === 'dark' ? quantum.dark.elevated : '#F3F6FB',
          borderColor: palette.border,
          rowHoverBg: mode === 'dark' ? '#222B37' : '#f5f7fb',
        },
        Button: { borderRadius: 10 },
        Input: {
          activeBorderColor: palette.primary,
          hoverBorderColor: palette.primary,
        },
        Select: {
          optionSelectedBg: mode === 'dark' ? '#222B37' : '#EEF2FF',
        },
        Menu: {
          itemSelectedBg:
            mode === 'dark'
              ? 'rgba(122, 134, 255, 0.14)'
              : 'rgba(79, 70, 229, 0.10)',
          itemSelectedColor: palette.primary,
          itemHoverBg:
            mode === 'dark'
              ? 'rgba(122, 134, 255, 0.10)'
              : 'rgba(79, 70, 229, 0.06)',
        },
      },
    }),
    [algorithm, mode, palette],
  )

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}

