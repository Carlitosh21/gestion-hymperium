export type ThemeMode = 'light' | 'dark'

export interface ThemeColors {
  accent: string
  accentHover: string
  background: string
  foreground: string
  surface: string
  border: string
  muted: string
  glassBackground?: string
  glassBorder?: string
}

export interface ThemePreset {
  id: string
  label: string
  accent: string
  accentHover: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'modern', label: 'Modern', accent: '#6633CC', accentHover: '#5229a3' },
  { id: 'classic', label: 'Classic', accent: '#339933', accentHover: '#2a7a2a' },
  { id: 'sunrise', label: 'Sunrise', accent: '#E65C5C', accentHover: '#c94a4a' },
  { id: 'water_lily', label: 'Water Lily', accent: '#CC3399', accentHover: '#a8287a' },
  { id: 'pacific', label: 'Pacific', accent: '#0d9488', accentHover: '#0f766e' },
  { id: 'earth', label: 'Earth', accent: '#2563eb', accentHover: '#1d4ed8' },
  { id: 'pampas', label: 'Pampas', accent: '#4a7c59', accentHover: '#3d6a4a' },
  { id: 'moon', label: 'Moon', accent: '#475569', accentHover: '#334155' },
]

const LIGHT_BASE = {
  background: '#fafafa',
  foreground: '#1d1d1f',
  surface: '#ffffff',
  border: 'rgba(0, 0, 0, 0.1)',
  muted: '#86868b',
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
}

const DARK_BASE = {
  background: '#000000',
  foreground: '#f5f5f7',
  surface: '#1d1d1f',
  border: 'rgba(255, 255, 255, 0.1)',
  muted: '#86868b',
  glassBackground: 'rgba(29, 29, 31, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
}

export function getThemeColors(themeId: string, themeMode: ThemeMode): ThemeColors {
  const preset = THEME_PRESETS.find((p) => p.id === themeId) ?? THEME_PRESETS[0]
  const base = themeMode === 'dark' ? DARK_BASE : LIGHT_BASE
  return {
    accent: preset.accent,
    accentHover: preset.accentHover,
    ...base,
  }
}
