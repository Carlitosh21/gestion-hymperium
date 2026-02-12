'use client'

import { useEffect } from 'react'

export function BrandingStyles() {
  useEffect(() => {
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.colors) return
        const root = document.documentElement
        const map: Record<string, string> = {
          accent: '--color-accent',
          accentHover: '--color-accent-hover',
          background: '--color-background',
          foreground: '--color-foreground',
          surface: '--color-surface',
          border: '--color-border',
          muted: '--color-muted',
        }
        for (const [key, cssVar] of Object.entries(map)) {
          const val = data.colors[key]
          if (val) root.style.setProperty(cssVar, val)
        }
      })
      .catch(() => {})
  }, [])
  return null
}
