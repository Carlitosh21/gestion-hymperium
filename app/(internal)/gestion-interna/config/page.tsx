'use client'

import { useState, useEffect } from 'react'
import { THEME_PRESETS, getThemeColors } from '@/lib/theme-presets'

export default function ConfigPage() {
  const [migrating, setMigrating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [branding, setBranding] = useState({
    appTitle: 'Hymperium',
    appSubtitle: 'Gestión',
    logoDataUrl: null as string | null,
    themeId: 'modern',
    themeMode: 'light' as 'light' | 'dark',
  })
  const [brandingLoading, setBrandingLoading] = useState(true)
  const [brandingSaving, setBrandingSaving] = useState(false)

  useEffect(() => {
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBranding({
            appTitle: data.appTitle ?? 'Hymperium',
            appSubtitle: data.appSubtitle ?? 'Gestión',
            logoDataUrl: data.logoDataUrl ?? null,
            themeId: data.themeId ?? 'modern',
            themeMode: data.themeMode === 'dark' ? 'dark' : 'light',
          })
        }
      })
      .catch(() => {})
      .finally(() => setBrandingLoading(false))
  }, [])

  const handleBrandingSave = async () => {
    setBrandingSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Branding guardado correctamente. Recargando...' })
        setBranding(data)
        setTimeout(() => window.location.reload(), 800)
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar branding' })
    } finally {
      setBrandingSaving(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBranding((b) => ({ ...b, logoDataUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleMigrate = async () => {
    if (!confirm('¿Estás seguro de ejecutar la migración de estructura? Esto creará todas las tablas necesarias.')) {
      return
    }

    setMigrating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error desconocido' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al ejecutar migración' })
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-4xl font-semibold mb-2">Configuración</h1>
      <p className="text-muted text-lg mb-8">Gestión de configuración del sistema</p>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-2xl font-semibold mb-4">Base de Datos</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Credenciales de Base de Datos</label>
              <p className="text-sm text-muted mb-4">
                Las credenciales se configuran mediante variables de entorno en Easy Panel:
              </p>
              <div className="bg-surface-elevated rounded-lg p-4 font-mono text-sm space-y-1">
                <div>PGHOST</div>
                <div>PGPORT</div>
                <div>PGUSER</div>
                <div>PGPASSWORD</div>
                <div>PGDATABASE</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-lg font-medium mb-3">Migrar Estructura</h3>
              <p className="text-sm text-muted mb-4">
                Ejecuta la migración inicial para crear todas las tablas necesarias en la base de datos.
                Esto solo debe hacerse la primera vez que se configura la base de datos.
              </p>
              
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {migrating ? 'Migrando...' : 'Migrar Estructura'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-2xl font-semibold mb-4">Branding</h2>
          <p className="text-muted mb-6">Nombre de la app, logo y paleta de colores</p>

          {brandingLoading ? (
            <p className="text-muted">Cargando...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de la app</label>
                <input
                  type="text"
                  value={branding.appTitle}
                  onChange={(e) => setBranding((b) => ({ ...b, appTitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Hymperium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={branding.appSubtitle}
                  onChange={(e) => setBranding((b) => ({ ...b, appSubtitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Gestión"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:cursor-pointer"
                />
                {branding.logoDataUrl && (
                  <img
                    src={branding.logoDataUrl}
                    alt="Logo"
                    className="mt-2 h-12 object-contain"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Estilo de fondo</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="themeMode"
                      checked={branding.themeMode === 'light'}
                      onChange={() => setBranding((b) => ({ ...b, themeMode: 'light' }))}
                      className="accent-accent"
                    />
                    Claro
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="themeMode"
                      checked={branding.themeMode === 'dark'}
                      onChange={() => setBranding((b) => ({ ...b, themeMode: 'dark' }))}
                      className="accent-accent"
                    />
                    Fondo negro
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Tema predefinido</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {THEME_PRESETS.map((preset) => {
                    const colors = getThemeColors(preset.id, branding.themeMode)
                    const isSelected = (branding.themeId || 'modern') === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBranding((b) => ({ ...b, themeId: preset.id }))}
                        className="rounded-xl p-4 border-2 transition-all text-left hover:opacity-90"
                        style={{
                          backgroundColor: colors.surface,
                          borderColor: isSelected ? preset.accent : colors.border,
                          outline: isSelected ? `2px solid ${preset.accent}` : undefined,
                          outlineOffset: 2,
                        }}
                      >
                        <div
                          className="h-1.5 rounded-full mb-3"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <p className="text-sm font-medium" style={{ color: colors.foreground }}>
                          AaBbCc
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span
                            className="px-2 py-1 rounded text-xs text-white"
                            style={{ backgroundColor: preset.accent }}
                          >
                            Button
                          </span>
                          <span
                            className="px-2 py-1 rounded text-xs border"
                            style={{ color: preset.accent, borderColor: preset.accent }}
                          >
                            Button
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: preset.accent }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-current opacity-50"
                            style={{ color: colors.foreground }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <button
                onClick={handleBrandingSave}
                disabled={brandingSaving}
                className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {brandingSaving ? 'Guardando...' : 'Guardar Branding'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
