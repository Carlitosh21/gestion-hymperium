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

type Granularity = 'daily' | 'weekly' | 'monthly' | 'quarterly'

interface StatsData {
  granularity?: Granularity
  year?: number
  quarter?: number
  kpis: {
    totalIngresosBrutos: number
    totalIngresosHymperium: number
    totalIngresosPendientesBrutos: number
    totalIngresosPendientesHymperium: number
    totalIngresosCarlitos: number
    totalIngresosJoaco: number
    totalPagosDevs: number
    totalEgresos: number
    totalEgresosPendientes: number
    balance: number
    margenHymperium: number
    tasaEgreso: number
  }
  timeseriesIngresos: Array<{
    dia: string
    bruto: number
    hymperium: number
    carlitos: number
    joaco: number
    pagos_devs: number
  }>
  timeseriesEgresos: Array<{ dia: string; monto: number }>
  timeseriesEgresosPendientes?: Array<{ dia: string; monto: number }>
  timeseriesIngresosPendientes?: Array<{ dia: string; bruto: number; hymperium: number }>
  flujoCaja: Array<{ dia: string; ingresos: number; ingresos_pendientes?: number; egresos: number; egresos_pendientes?: number }>
  egresosPorCategoria: Array<{ categoria: string; total: number; porcentaje: number }>
  topIngresos: Array<{ id: number; descripcion: string; monto: number; hymperium: number; fecha: string }>
  topEgresos: Array<{ id: number; descripcion: string; categoria: string; monto: number; fecha: string }>
  comparativoMensual: {
    mesActual: { ingresos: number; egresos: number; balance: number }
    mesAnterior: { ingresos: number; egresos: number; balance: number }
  } | null
}

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
]

const RANGE_DAILY = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: 'all', label: 'Todo' },
]

const RANGE_WEEKLY = [
  { value: '4w', label: '4 semanas' },
  { value: '12w', label: '12 semanas' },
  { value: '52w', label: '52 semanas' },
  { value: 'all', label: 'Todo' },
]

const RANGE_MONTHLY = [
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
  { value: 'all', label: 'Todo' },
]

const QUARTERS = [
  { value: 1, label: 'Q1 (Ene–Mar)' },
  { value: 2, label: 'Q2 (Abr–Jun)' },
  { value: 3, label: 'Q3 (Jul–Sep)' },
  { value: 4, label: 'Q4 (Oct–Dic)' },
]

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function FinanzasStatsPage() {
  const router = useRouter()
  const [granularity, setGranularity] = useState<Granularity>('daily')
  const [range, setRange] = useState('30d')
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [quarter, setQuarter] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rangeOptions =
    granularity === 'daily' ? RANGE_DAILY : granularity === 'weekly' ? RANGE_WEEKLY : granularity === 'monthly' ? RANGE_MONTHLY : []

  useEffect(() => {
    if (granularity === 'quarterly') {
      setQuarter(Math.floor(new Date().getMonth() / 3) + 1)
    } else if (granularity === 'daily') {
      setRange('30d')
    } else if (granularity === 'weekly') {
      setRange('12w')
    } else if (granularity === 'monthly') {
      setRange('6m')
    }
  }, [granularity])

  useEffect(() => {
    fetchStats()
  }, [granularity, range, year, quarter])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('granularity', granularity)
      if (granularity === 'quarterly') {
        params.set('year', String(year))
        params.set('quarter', String(quarter))
      } else {
        params.set('range', range)
      }
      const response = await fetch(`/api/estadisticas/finanzas?${params}`)
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

  const chartSubtitle =
    granularity === 'daily'
      ? 'por Día'
      : granularity === 'weekly'
        ? 'por Semana'
        : granularity === 'monthly'
          ? 'por Mes'
          : granularity === 'quarterly'
            ? `Q${quarter} ${year}`
            : 'por Trimestre'

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
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium"
          >
            {GRANULARITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {granularity === 'quarterly' ? (
            <>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={quarter}
                onChange={(e) => setQuarter(parseInt(e.target.value, 10))}
                className="px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium"
              >
                {QUARTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium"
            >
              {rangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => fetchStats()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium hover:bg-surface-elevated disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-muted">Ingresos Brutos reales</p>
                <p className="text-2xl font-bold text-blue-500">
                  {formatCurrency(stats.kpis.totalIngresosBrutos)}
                </p>
                <p className="text-xs text-muted mt-1">Completados (suman caja)</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm text-muted">Ingresos Hymperium reales</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {formatCurrency(stats.kpis.totalIngresosHymperium)}
                </p>
                <p className="text-xs text-muted mt-1">Completados (suman caja)</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm text-muted">Ingresos pendientes</p>
                <p className="text-2xl font-bold text-amber-500">
                  {formatCurrency(stats.kpis.totalIngresosPendientesHymperium ?? 0)}
                </p>
                <p className="text-xs text-muted mt-1">No afectan balance</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-sm text-muted">Egresos reales</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(stats.kpis.totalEgresos)}
                </p>
                <p className="text-xs text-muted mt-1">Completados (descuentan caja)</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-sm text-muted">Egresos pendientes</p>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrency(stats.kpis.totalEgresosPendientes ?? 0)}
                </p>
                <p className="text-xs text-muted mt-1">No afectan balance</p>
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

          {/* Desglose: Ingresos míos, Carlitos, Joaco, Pagos Devs */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-semibold">Desglose de Ingresos</h2>
            </div>
            <p className="text-sm text-muted mb-4">Solo ingresos completados (cuentas reales)</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <p className="text-sm text-muted">Ingresos Carlitos</p>
                <p className="text-2xl font-bold text-indigo-500">
                  {formatCurrency(stats.kpis.totalIngresosCarlitos ?? 0)}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <p className="text-sm text-muted">Ingresos Joaco</p>
                <p className="text-2xl font-bold text-violet-500">
                  {formatCurrency(stats.kpis.totalIngresosJoaco ?? 0)}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <p className="text-sm text-muted">Pagos a Desarrolladores</p>
                <p className="text-2xl font-bold text-amber-500">
                  {formatCurrency(stats.kpis.totalPagosDevs ?? 0)}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <p className="text-sm text-muted">Ingresos Míos (Carlitos + Joaco)</p>
                <p className="text-2xl font-bold text-cyan-500">
                  {formatCurrency((stats.kpis.totalIngresosCarlitos ?? 0) + (stats.kpis.totalIngresosJoaco ?? 0))}
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
              <h3 className="text-lg font-semibold mb-4">Ingresos Hymperium vs Egresos ({chartSubtitle})</h3>
              <p className="text-sm text-muted mb-4">Solo completados afectan el balance. Ingresos y egresos pendientes se muestran aparte.</p>
              {stats.flujoCaja.some((d) => d.ingresos > 0 || d.egresos > 0 || (d.ingresos_pendientes ?? 0) > 0 || (d.egresos_pendientes ?? 0) > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.flujoCaja}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                    <XAxis dataKey="dia" stroke="#ffffff" tick={{ fill: '#ffffff' }} />
                    <YAxis
                      stroke="#ffffff"
                      tick={{ fill: '#ffffff' }}
                      tickFormatter={(v) => formatCurrency(v)}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number | undefined, name: string | undefined) => [formatCurrency(value ?? 0), name ?? '']}
                    />
                    <Legend wrapperStyle={{ color: '#ffffff' }} />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="Ingresos Hymperium (completados)"
                      dot={{ fill: '#22c55e', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ingresos_pendientes"
                      stroke="#eab308"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Ingresos pendientes"
                      dot={{ fill: '#eab308', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="egresos"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Egresos reales (completados)"
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="egresos_pendientes"
                      stroke="#f97316"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Egresos pendientes"
                      dot={{ fill: '#f97316', r: 4 }}
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
              <h3 className="text-lg font-semibold mb-4">Desglose {chartSubtitle} (Bruto, Hymperium, Carlitos, Joaco, Pagos Devs) — solo completados</h3>
              {stats.timeseriesIngresos.some((d) => d.bruto > 0 || d.hymperium > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.timeseriesIngresos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                    <XAxis dataKey="dia" stroke="#ffffff" tick={{ fill: '#ffffff' }} />
                    <YAxis
                      stroke="#ffffff"
                      tick={{ fill: '#ffffff' }}
                      tickFormatter={(v) => formatCurrency(v)}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number | undefined, name: string | undefined) => [formatCurrency(value ?? 0), name ?? '']}
                    />
                    <Legend wrapperStyle={{ color: '#ffffff' }} />
                    <Bar dataKey="bruto" fill="#3b82f6" name="Ingresos Brutos" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="hymperium"
                      fill="#22c55e"
                      name="Ingresos Hymperium"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="carlitos" fill="#8b5cf6" name="Carlitos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="joaco" fill="#ec4899" name="Joaco" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="pagos_devs"
                      fill="#f59e0b"
                      name="Pagos a Devs"
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
                <h2 className="text-2xl font-semibold">Pagos según Categoría</h2>
              </div>
              <p className="text-sm text-muted mb-2">Solo egresos completados (cuentas reales)</p>

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
                            label={{ fill: '#ffffff' }}
                          >
                            {stats.egresosPorCategoria.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
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
                  <h3 className="text-lg font-semibold mb-4">Top Ingresos (completados)</h3>
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
                  <h3 className="text-lg font-semibold mb-4">Top Egresos (completados)</h3>
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
                  <p className="text-xs text-muted mb-2">Egresos = completados (no incluye pendientes)</p>
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
                  <p className="text-xs text-muted mb-2">Egresos = completados (no incluye pendientes)</p>
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
