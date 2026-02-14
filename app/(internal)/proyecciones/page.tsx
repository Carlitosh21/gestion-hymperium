'use client'

import { useState } from 'react'
import { RequirePermission } from '@/components/RequirePermission'

export default function ProyeccionesPage() {
  const [tipoProyeccion, setTipoProyeccion] = useState('')
  const [filtros, setFiltros] = useState<Record<string, any>>({})

  return (
    <RequirePermission permission="proyecciones.view" fallbackHref="/">
    <div className="p-8">
      <h1 className="text-4xl font-semibold mb-2">Creador de Proyecciones</h1>
      <p className="text-muted text-lg mb-8">
        Genera proyecciones basadas en todos los datos del sistema
      </p>

      <div className="bg-surface rounded-xl p-6 border border-border">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Tipo de Proyección</label>
          <select
            value={tipoProyeccion}
            onChange={(e) => setTipoProyeccion(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          >
            <option value="">Seleccionar tipo...</option>
            <option value="ingresos">Proyección de Ingresos</option>
            <option value="clientes">Proyección de Clientes</option>
            <option value="ventas">Proyección de Ventas</option>
            <option value="contenido">Proyección de Contenido</option>
          </select>
        </div>

        {tipoProyeccion && (
          <div className="p-4 bg-surface-elevated rounded-lg border border-border">
            <p className="text-muted text-sm">
              El creador de proyecciones utilizará todos los datos disponibles del sistema para
              generar proyecciones según el tipo seleccionado. Esta funcionalidad se implementará
              con algoritmos de análisis de datos y tendencias.
            </p>
            <p className="text-muted text-xs mt-2">
              Próximamente: Implementación de algoritmos de proyección basados en datos históricos.
            </p>
          </div>
        )}
      </div>
    </div>
    </RequirePermission>
  )
}
