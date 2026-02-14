'use client'

import { useState } from 'react'
import { RequirePermission } from '@/components/RequirePermission'

export default function ConfigPage() {
  const [migrating, setMigrating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
    <RequirePermission permission="config.manage" fallbackHref="/gestion-interna">
    <div className="p-8 max-w-4xl">
      <h1 className="text-4xl font-semibold mb-2">Configuración</h1>
      <p className="text-muted text-lg mb-8">Gestión de configuración del sistema</p>

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
              
              {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

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
          <h2 className="text-2xl font-semibold mb-4">Datos Básicos</h2>
          <p className="text-muted">Configuración de datos básicos del sistema (próximamente)</p>
        </section>
      </div>
    </div>
    </RequirePermission>
  )
}
