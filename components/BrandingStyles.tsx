'use client'

import { useEffect } from 'react'
import { getThemeColors } from '@/lib/theme-presets'

export function BrandingStyles() {
  useEffect(() => {
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        const root = document.documentElement
        const map: Record<string, string> = {
          accent: '--color-accent',
          accentHover: '--color-accent-hover',
          background: '--color-background',
          foreground: '--color-foreground',
          surface: '--color-surface',
          border: '--color-border',
          muted: '--color-muted',
          glassBackground: '--glass-background',
          glassBorder: '--glass-border',
        }
        let colors: Record<string, string>
        if (data.themeId && data.themeId !== '') {
          colors = getThemeColors(data.themeId, 'dark') as unknown as Record<string, string>
        } else if (data.colors) {
          colors = data.colors
        } else {
          return
        }
        for (const [key, cssVar] of Object.entries(map)) {
          const val = colors[key]
          if (val) root.style.setProperty(cssVar, val)
        }
      })
      .catch(() => {})
  }, [])
  return null
}
