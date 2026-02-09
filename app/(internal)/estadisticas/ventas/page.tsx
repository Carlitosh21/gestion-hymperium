'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, MessageSquare, Calendar, Target, Send, Phone, Video, BarChart3 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface StatsData {
  prospeccion: {
    timeseriesLeadsNuevos: Array<{ dia: string; count: number }>
    kpis: {
      tasaRespuesta: number
      tasaAgenda: number
      tasaCierre: number
      seguimientosEnviados: number
    }
  }
  llamadas: {
    kpis: {
      agendadas: number
      reagendadas: number
      showUp: number
      cierresPostLlamada: number
    }
  }
  contenido: {
    youtube: {
      viewsTotales: number
      topVideos: Array<{
        id: number
        titulo: string
        view_count: number
        like_count: number
        comment_count: number
      }>
    }
  }
}

const RANGE_OPTIONS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'all', label: 'Todo el histórico' },
]

export default function VentasStatsPage() {
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
      const response = await fetch(`/api/estadisticas/ventas?range=${range}`)
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

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR').format(value)
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
            <h1 className="text-4xl font-semibold mb-2">Estadísticas de Ventas</h1>
            <p className="text-muted">Prospección, Llamadas y Contenido</p>
          </div>
        </div>
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
          {/* PROSPECCIÓN */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-semibold">Prospección</h2>
            </div>

            {/* Gráfico de línea: Nuevas conversaciones por día */}
            <div className="bg-surface rounded-xl p-6 border border-border mb-6">
              <h3 className="text-lg font-semibold mb-4">Nuevas Conversaciones Iniciadas por Día</h3>
              {stats.prospeccion.timeseriesLeadsNuevos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.prospeccion.timeseriesLeadsNuevos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="dia" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--surface))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      name="Leads nuevos"
                      dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted">
                  No hay datos para el período seleccionado
                </div>
              )}
            </div>

            {/* KPIs de Prospección */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">
                    {formatPercent(stats.prospeccion.kpis.tasaRespuesta)}
                  </span>
                </div>
                <p className="text-sm text-muted">Tasa de Respuesta</p>
                <p className="text-xs text-muted mt-1">Respondieron al primer mensaje</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span className="text-2xl font-bold text-indigo-500">
                    {formatPercent(stats.prospeccion.kpis.tasaAgenda)}
                  </span>
                </div>
                <p className="text-sm text-muted">Tasa de Agenda</p>
                <p className="text-xs text-muted mt-1">Leads que agendaron</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">
                    {formatPercent(stats.prospeccion.kpis.tasaCierre)}
                  </span>
                </div>
                <p className="text-sm text-muted">Tasa de Cierre</p>
                <p className="text-xs text-muted mt-1">Leads convertidos a clientes</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Send className="w-5 h-5 text-purple-500" />
                  <span className="text-2xl font-bold text-purple-500">
                    {formatNumber(stats.prospeccion.kpis.seguimientosEnviados)}
                  </span>
                </div>
                <p className="text-sm text-muted">Seguimientos Enviados</p>
                <p className="text-xs text-muted mt-1">Total en el período</p>
              </div>
            </div>
          </section>

          {/* LLAMADAS */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Phone className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-semibold">Llamadas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span className="text-2xl font-bold text-indigo-500">
                    {formatNumber(stats.llamadas.kpis.agendadas)}
                  </span>
                </div>
                <p className="text-sm text-muted">Agendadas</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">
                    {formatNumber(stats.llamadas.kpis.reagendadas)}
                  </span>
                </div>
                <p className="text-sm text-muted">Reagendadas</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">
                    {formatPercent(stats.llamadas.kpis.showUp)}
                  </span>
                </div>
                <p className="text-sm text-muted">Show-up</p>
                <p className="text-xs text-muted mt-1">Tasa de asistencia</p>
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-emerald-500">
                    {formatNumber(stats.llamadas.kpis.cierresPostLlamada)}
                  </span>
                </div>
                <p className="text-sm text-muted">Cierres Post-Llamada</p>
                <p className="text-xs text-muted mt-1">Conversiones con llamada</p>
              </div>
            </div>
          </section>

          {/* CONTENIDO (YouTube) */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Video className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-semibold">Contenido (YouTube)</h2>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-border mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Visitas Totales</h3>
                  <p className="text-3xl font-bold text-red-500">
                    {formatNumber(stats.contenido.youtube.viewsTotales)}
                  </p>
                </div>
                <Video className="w-12 h-12 text-red-500/20" />
              </div>
            </div>

            {stats.contenido.youtube.topVideos.length > 0 && (
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Top Videos</h3>
                <div className="space-y-4">
                  {stats.contenido.youtube.topVideos.slice(0, 5).map((video, idx) => (
                    <div key={video.id} className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg border border-border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-muted w-6">#{idx + 1}</span>
                          <p className="font-medium text-sm line-clamp-1">{video.titulo || 'Sin título'}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted ml-9">
                          <span>👁️ {formatNumber(video.view_count || 0)}</span>
                          <span>👍 {formatNumber(video.like_count || 0)}</span>
                          <span>💬 {formatNumber(video.comment_count || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
