import { query } from './db'

export const DEFAULT_BRANDING = {
  appTitle: 'Hymperium',
  appSubtitle: 'Gestión',
  logoDataUrl: null as string | null,
  themeId: 'modern' as string,
  themeMode: 'light' as 'light' | 'dark',
  colors: {
    accent: '#007aff',
    accentHover: '#0051d5',
    background: '#fafafa',
    foreground: '#1d1d1f',
    surface: '#ffffff',
    border: 'rgba(0, 0, 0, 0.1)',
    muted: '#86868b',
  } as Record<string, string>,
}

export type Branding = typeof DEFAULT_BRANDING

export async function ensureConfigTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS config (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function getConfig(key: string): Promise<string | null> {
  try {
    const result = await query(
      'SELECT value FROM config WHERE key = $1',
      [key]
    )
    return result.rows[0]?.value ?? null
  } catch (err: any) {
    if (err.code === '42P01') return null
    throw err
  }
}

export async function setConfig(key: string, value: string): Promise<void> {
  await ensureConfigTable()
  await query(
    `INSERT INTO config (key, value, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  )
}

export async function getBranding(): Promise<Branding> {
  try {
    await ensureConfigTable()
  } catch {
    return DEFAULT_BRANDING
  }

  const raw = await getConfig('branding')
  if (!raw) return DEFAULT_BRANDING
  try {
    const parsed = JSON.parse(raw) as Partial<Branding>
    const hasThemePreference = 'themeId' in parsed && parsed.themeId != null
    return {
      appTitle: parsed.appTitle ?? DEFAULT_BRANDING.appTitle,
      appSubtitle: parsed.appSubtitle ?? DEFAULT_BRANDING.appSubtitle,
      logoDataUrl: parsed.logoDataUrl ?? DEFAULT_BRANDING.logoDataUrl,
      themeId: hasThemePreference ? (parsed.themeId ?? DEFAULT_BRANDING.themeId) : '',
      themeMode: parsed.themeMode === 'dark' ? 'dark' : 'light',
      colors: parsed.colors ? { ...DEFAULT_BRANDING.colors, ...parsed.colors } : DEFAULT_BRANDING.colors,
    }
  } catch {
    return DEFAULT_BRANDING
  }
}

export async function saveBranding(branding: Partial<Branding>): Promise<void> {
  const current = await getBranding()
  const merged: Branding = {
    appTitle: branding.appTitle ?? current.appTitle,
    appSubtitle: branding.appSubtitle ?? current.appSubtitle,
    logoDataUrl: branding.logoDataUrl !== undefined ? branding.logoDataUrl : current.logoDataUrl,
    themeId: branding.themeId ?? current.themeId,
    themeMode: branding.themeMode === 'dark' ? 'dark' : 'light',
    colors: branding.colors ? { ...current.colors, ...branding.colors } : current.colors,
  }
  await setConfig('branding', JSON.stringify(merged))
}
