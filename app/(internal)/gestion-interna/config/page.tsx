'use client'

import { useState, useEffect } from 'react'

export default function ConfigPage() {
  const [migrating, setMigrating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [branding, setBranding] = useState({
    appTitle: 'Hymperium',
    appSubtitle: 'Gestión',
    logoDataUrl: null as string | null,
    colors: {
      accent: '#007aff',
      accentHover: '#0051d5',
      background: '#fafafa',
      foreground: '#1d1d1f',
      surface: '#ffffff',
      border: 'rgba(0, 0, 0, 0.1)',
      muted: '#86868b',
    },
  })
  const [brandingLoading, setBrandingLoading] = useState(true)
  const [brandingSaving, setBrandingSaving] = useState(false)

  useEffect(() => {
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBranding(data)
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Color principal (accent)</label>
                  <input
                    type="color"
                    value={branding.colors.accent}
                    onChange={(e) =>
                      setBranding((b) => ({
                        ...b,
                        colors: { ...b.colors, accent: e.target.value },
                      }))
                    }
                    className="w-full h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.colors.accent}
                    onChange={(e) =>
                      setBranding((b) => ({
                        ...b,
                        colors: { ...b.colors, accent: e.target.value },
                      }))
                    }
                    className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color hover (accent-hover)</label>
                  <input
                    type="color"
                    value={branding.colors.accentHover}
                    onChange={(e) =>
                      setBranding((b) => ({
                        ...b,
                        colors: { ...b.colors, accentHover: e.target.value },
                      }))
                    }
                    className="w-full h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.colors.accentHover}
                    onChange={(e) =>
                      setBranding((b) => ({
                        ...b,
                        colors: { ...b.colors, accentHover: e.target.value },
                      }))
                    }
                    className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
                  />
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
