'use client'

import { useState } from 'react'

export default function EstadisticasPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-semibold mb-2">Estadísticas</h1>
      <p className="text-muted text-lg mb-8">Análisis y reportes del sistema</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Filtros por Módulo</h2>
          <p className="text-muted text-sm mb-4">
            Estadísticas de TODO, ABSOLUTAMENTE TODO dividido por módulos y pudiendo agregarle condiciones y filtrar en cada uno.
          </p>
          <div className="space-y-2">
            {['Ventas', 'Clientes', 'Llamadas', 'Finanzas', 'Contenido'].map((modulo) => (
              <button
                key={modulo}
                className="w-full text-left px-4 py-2 bg-surface-elevated rounded-lg hover:bg-surface transition-colors"
              >
                {modulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-6 border border-border">
        <p className="text-muted">Panel de estadísticas detalladas (próximamente)</p>
      </div>
    </div>
  )
}
