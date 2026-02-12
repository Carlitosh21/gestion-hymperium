'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageSquare, Send, Link2, Users, TrendingUp, RefreshCw, BarChart3, AlertCircle, ThumbsDown, FileText } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SetterStats {
  dailyStats: Array<{
    dia: string
    mensajes_entrantes: number
    mensajes_salientes: number
    nuevos_leads: number
    ventas: number
    derivaciones: number
    links_skool_enviados: number
    ctas_enviados: number
    links_whatsapp: number
  }>
  totals: {
    mensajes_entrantes: number
    mensajes_salientes: number
    links_skool_enviados: number
    ctas_enviados: number
    derivaciones: number
    links_whatsapp: number
    nuevos_leads: number
    ventas: number
  }
  doloresRanking: Array<{ tipo_dolor: string; count: number }>
  objecionesRanking: Array<{ tipo_objecion: string; count: number }>
  ctasList: Array<{ accionable: string; detalles: string; recurso: string }>
}

const RANGE_OPTIONS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'all', label: 'Todo el histórico' },
]

export default function SetterStatsPage() {
  const router = useRouter()
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SetterStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [range])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/estadisticas/setter?range=${range}`)
      if (!response.ok) throw new Error('Error al cargar estadísticas')
      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: number) => new Intl.NumberFormat('es-AR').format(value)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/estadisticas')}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-semibold mb-2">Performance Setter</h1>
            <p className="text-muted">Métricas diarias del Setter</p>
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
            <h2 className="text-2xl font-semibold mb-6">Resumen del período</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">
                    {formatNumber(stats.totals.mensajes_entrantes)}
                  </span>
                </div>
                <p className="text-sm text-muted">Mensajes entrantes</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Send className="w-5 h-5 text-indigo-500" />
                  <span className="text-2xl font-bold text-indigo-500">
                    {formatNumber(stats.totals.mensajes_salientes)}
                  </span>
                </div>
                <p className="text-sm text-muted">Mensajes salientes</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">
                    {formatNumber(stats.totals.nuevos_leads)}
                  </span>
                </div>
                <p className="text-sm text-muted">Nuevos leads</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-emerald-500">
                    {formatNumber(stats.totals.ventas)}
                  </span>
                </div>
                <p className="text-sm text-muted">Ventas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Link2 className="w-5 h-5 text-purple-500" />
                  <span className="text-2xl font-bold text-purple-500">
                    {formatNumber(stats.totals.links_skool_enviados)}
                  </span>
                </div>
                <p className="text-sm text-muted">Links Skool enviados</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <span className="text-2xl font-bold text-gray-600">
                  {formatNumber(stats.totals.derivaciones)}
                </span>
                <p className="text-sm text-muted">Derivaciones</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <span className="text-2xl font-bold text-gray-600">
                  {formatNumber(stats.totals.ctas_enviados)}
                </span>
                <p className="text-sm text-muted">CTAs enviados</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <span className="text-2xl font-bold text-gray-600">
                  {formatNumber(stats.totals.links_whatsapp)}
                </span>
                <p className="text-sm text-muted">Links WhatsApp</p>
              </div>
            </div>
          </section>

          {/* Gráfico: Serie temporal */}
          {stats.dailyStats.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Tendencia por día</h2>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="nuevos_leads" stroke="#22c55e" strokeWidth={2} name="Nuevos leads" dot={{ fill: '#22c55e', r: 4 }} />
                    <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} name="Ventas" dot={{ fill: '#10b981', r: 4 }} />
                    <Line type="monotone" dataKey="mensajes_entrantes" stroke="#3b82f6" strokeWidth={2} name="Msg entrantes" dot={{ fill: '#3b82f6', r: 4 }} />
                    <Line type="monotone" dataKey="mensajes_salientes" stroke="#6366f1" strokeWidth={2} name="Msg salientes" dot={{ fill: '#6366f1', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Dolores y objeciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-semibold">Dolores más frecuentes</h2>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                {stats.doloresRanking.length === 0 ? (
                  <p className="text-muted text-center py-6">No hay datos en el período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.doloresRanking} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis type="category" dataKey="tipo_dolor" width={120} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#f59e0b" name="Cantidad" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ThumbsDown className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-semibold">Objeciones más frecuentes</h2>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                {stats.objecionesRanking.length === 0 ? (
                  <p className="text-muted text-center py-6">No hay datos en el período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.objecionesRanking} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis type="category" dataKey="tipo_objecion" width={120} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#ef4444" name="Cantidad" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          {/* CTAs */}
          {stats.ctasList.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-semibold">CTAs disponibles</h2>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="space-y-4">
                  {stats.ctasList.map((cta, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg border border-border">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{cta.accionable}</div>
                        {cta.detalles && <div className="text-sm text-muted truncate">{cta.detalles}</div>}
                      </div>
                      {cta.recurso && (
                        <a href={cta.recurso} target="_blank" rel="noopener noreferrer" className="ml-4 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors whitespace-nowrap">
                          Ver recurso
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
