'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface StatsData {
  kpis: {
    totalIngresosBrutos: number
    totalIngresosHymperium: number
    totalEgresos: number
    balance: number
    margenHymperium: number
    tasaEgreso: number
  }
  timeseriesIngresos: Array<{ dia: string; bruto: number; hymperium: number }>
  timeseriesEgresos: Array<{ dia: string; monto: number }>
  flujoCaja: Array<{ dia: string; ingresos: number; egresos: number }>
  egresosPorCategoria: Array<{ categoria: string; total: number; porcentaje: number }>
  topIngresos: Array<{ id: number; descripcion: string; monto: number; hymperium: number; fecha: string }>
  topEgresos: Array<{ id: number; descripcion: string; categoria: string; monto: number; fecha: string }>
  comparativoMensual: {
    mesActual: { ingresos: number; egresos: number; balance: number }
    mesAnterior: { ingresos: number; egresos: number; balance: number }
  } | null
}

const RANGE_OPTIONS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'all', label: 'Todo el histórico' },
]

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function FinanzasStatsPage() {
  const router = useRouter()
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [range])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/estadisticas/finanzas?range=${range}`)
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }
      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/estadisticas')}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-semibold mb-2">Estadísticas de Finanzas</h1>
            <p className="text-muted">Ingresos, egresos y flujo de caja</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium hover:bg-surface-elevated disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-muted">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Cargando estadísticas...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 mb-8">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          {/* KPIs principales */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              <h2 className="text-2xl font-semibold">Indicadores Clave</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-muted">Ingresos Brutos</p>
                <p className="text-2xl font-bold text-blue-500">
                  {formatCurrency(stats.kpis.totalIngresosBrutos)}
                </p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm text-muted">Ingresos Hymperium</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {formatCurrency(stats.kpis.totalIngresosHymperium)}
                </p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-sm text-muted">Total Egresos</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(stats.kpis.totalEgresos)}
                </p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted">Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.kpis.balance >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(stats.kpis.balance)}
                </p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Percent className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-sm text-muted">Margen Hymperium</p>
                <p className="text-2xl font-bold text-indigo-500">
                  {formatPercent(stats.kpis.margenHymperium)}%
                </p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Percent className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-sm text-muted">Tasa de Egreso</p>
                <p className="text-2xl font-bold text-orange-500">
                  {formatPercent(stats.kpis.tasaEgreso)}%
                </p>
              </div>
            </div>
          </section>

          {/* Flujo de caja */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
              <h2 className="text-2xl font-semibold">Flujo de Caja</h2>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4">Ingresos Hymperium vs Egresos por Día</h3>
              {stats.flujoCaja.some((d) => d.ingresos > 0 || d.egresos > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.flujoCaja}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="dia"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatCurrency(v)}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="Ingresos Hymperium"
                      dot={{ fill: '#22c55e', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="egresos"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Egresos"
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted">
                  No hay datos para el período seleccionado
                </div>
              )}
            </div>
          </section>

          {/* Evolución de ingresos */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-semibold">Evolución de Ingresos</h2>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4">Bruto vs Hymperium por Día</h3>
              {stats.timeseriesIngresos.some((d) => d.bruto > 0 || d.hymperium > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.timeseriesIngresos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="dia"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatCurrency(v)}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend />
                    <Bar dataKey="bruto" fill="#3b82f6" name="Ingresos Brutos" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="hymperium"
                      fill="#22c55e"
                      name="Ingresos Hymperium"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted">
                  No hay ingresos en el período seleccionado
                </div>
              )}
            </div>
          </section>

          {/* Egresos por categoría + Top movimientos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <TrendingDown className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-semibold">Egresos por Categoría</h2>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                {stats.egresosPorCategoria.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={stats.egresosPorCategoria}
                            dataKey="total"
                            nameKey="categoria"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ categoria }) => categoria}
                          >
                            {stats.egresosPorCategoria.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--surface))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {stats.egresosPorCategoria.map((cat, i) => (
                        <div
                          key={cat.categoria}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            {cat.categoria}
                          </span>
                          <span>{formatCurrency(cat.total)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted">No hay egresos en el período</div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-semibold">Top Movimientos</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-surface rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold mb-4">Top Ingresos</h3>
                  {stats.topIngresos.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topIngresos.slice(0, 5).map((ing, idx) => (
                        <div
                          key={ing.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ing.descripcion}</p>
                            <p className="text-xs text-muted">
                              {new Date(ing.fecha).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <span className="text-green-600 font-medium ml-2">
                            +{formatCurrency(ing.hymperium)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-sm">Sin ingresos en el período</p>
                  )}
                </div>

                <div className="bg-surface rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold mb-4">Top Egresos</h3>
                  {stats.topEgresos.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topEgresos.slice(0, 5).map((egr) => (
                        <div
                          key={egr.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{egr.descripcion}</p>
                            <p className="text-xs text-muted">
                              {egr.categoria} ·{' '}
                              {new Date(egr.fecha).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <span className="text-red-600 font-medium ml-2">
                            -{formatCurrency(egr.monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-sm">Sin egresos en el período</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Comparativo mensual */}
          {stats.comparativoMensual && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ArrowUpRight className="w-6 h-6 text-indigo-500" />
                <h2 className="text-2xl font-semibold">Comparativo Mensual</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold mb-4">Mes Actual</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Ingresos:</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(stats.comparativoMensual.mesActual.ingresos)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Egresos:</span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(stats.comparativoMensual.mesActual.egresos)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-border">
                      <span>Balance:</span>
                      <span
                        className={
                          stats.comparativoMensual.mesActual.balance >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {formatCurrency(stats.comparativoMensual.mesActual.balance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold mb-4">Mes Anterior</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Ingresos:</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(stats.comparativoMensual.mesAnterior.ingresos)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Egresos:</span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(stats.comparativoMensual.mesAnterior.egresos)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-border">
                      <span>Balance:</span>
                      <span
                        className={
                          stats.comparativoMensual.mesAnterior.balance >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {formatCurrency(stats.comparativoMensual.mesAnterior.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
