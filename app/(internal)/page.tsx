'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Wallet, Users, Phone, TrendingUp } from 'lucide-react'

interface DashboardMetrics {
  ingresosBrutosMes: number
  cashCollectedMes: number
  totalClientes: number
  clientesActivos: number
  llamadasHoy: number
  llamadasProximos7Dias: number
}

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/metrics')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setMetrics(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

  return (
    <div className="p-8">
      <h1 className="text-4xl font-semibold mb-2">Sociedad AI Setter</h1>
      <p className="text-muted text-lg mb-8">Sistema de gestión integral</p>

      {loading ? (
        <div className="text-muted">Cargando métricas...</div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-muted">Ingresos brutos (mes)</span>
            </div>
            <p className="text-2xl font-semibold">{formatCurrency(metrics.ingresosBrutosMes)}</p>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-muted">Cash Collected (mes)</span>
            </div>
            <p className="text-2xl font-semibold">{formatCurrency(metrics.cashCollectedMes)}</p>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-muted">Clientes totales</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.totalClientes}</p>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-muted">Clientes activos</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.clientesActivos}</p>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Phone className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-sm text-muted">Llamadas hoy</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.llamadasHoy}</p>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Phone className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm text-muted">Próximos 7 días</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.llamadasProximos7Dias}</p>
          </div>
        </div>
      ) : (
        <div className="text-muted">No se pudieron cargar las métricas</div>
      )}
    </div>
  )
}
