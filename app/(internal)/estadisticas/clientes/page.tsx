'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, DollarSign, TrendingUp } from 'lucide-react'
import { RequirePermission } from '@/components/RequirePermission'

interface ClienteStat {
  id: number
  nombre: string
  email: string
  estado_entrega: number
  total_pagado: number
}

interface StatsData {
  totalClientes: number
  promedioEntrega: number
  clientes: ClienteStat[]
}

export default function EstadisticasClientesPage() {
  const router = useRouter()
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/estadisticas/clientes')
      .then((res) => res.json())
      .then((d) => {
        if (!d.error) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

  return (
    <RequirePermission permission="estadisticas.view" fallbackHref="/">
      <div className="p-8">
        <button
          onClick={() => router.push('/estadisticas')}
          className="flex items-center gap-2 text-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Estadísticas
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-2">Estadísticas de Clientes</h1>
          <p className="text-muted text-lg">Cantidad, pagos por cliente y tiempo de entrega</p>
        </div>

        {loading ? (
          <div className="text-muted">Cargando...</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm text-muted">Total clientes</span>
                </div>
                <p className="text-2xl font-semibold">{data.totalClientes}</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm text-muted">Tiempo de entrega promedio</span>
                </div>
                <p className="text-2xl font-semibold">{data.promedioEntrega}%</p>
                <p className="text-xs text-muted mt-1">(estado_entrega promedio)</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-muted">Total facturado (clientes)</span>
                </div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(data.clientes.reduce((s, c) => s + c.total_pagado, 0))}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <h2 className="text-xl font-semibold p-6 border-b border-border">
                Pagos por cliente
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated">
                      <th className="text-left p-4 font-medium">Cliente</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-right p-4 font-medium">Estado entrega</th>
                      <th className="text-right p-4 font-medium">Total pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clientes.map((c) => (
                      <tr key={c.id} className="border-b border-border hover:bg-surface-elevated/50">
                        <td className="p-4 font-medium">{c.nombre}</td>
                        <td className="p-4 text-muted text-sm">{c.email}</td>
                        <td className="p-4 text-right">{c.estado_entrega}%</td>
                        <td className="p-4 text-right font-medium">{formatCurrency(c.total_pagado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.clientes.length === 0 && (
                <div className="p-8 text-center text-muted">No hay clientes</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-muted">No se pudieron cargar las estadísticas</div>
        )}
      </div>
    </RequirePermission>
  )
}
