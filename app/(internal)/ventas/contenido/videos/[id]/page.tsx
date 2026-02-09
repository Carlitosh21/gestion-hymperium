'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface Video {
  id: number
  plataforma: string
  tipo: string
  titulo: string | null
  url: string
  video_id: string | null
  idea_contenido_id: number | null
  thumbnail_url: string | null
  duracion: number | null
  fecha_publicacion: string | null
  view_count: number | null
  like_count: number | null
  comment_count: number | null
}

interface IdeaContenido {
  id: number
  titulo: string
}

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string

  const [video, setVideo] = useState<Video | null>(null)
  const [ideas, setIdeas] = useState<IdeaContenido[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchVideo()
    fetchIdeas()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/ventas/videos?id=${videoId}`)
      if (response.ok) {
        const data = await response.json()
        // Si es un array, tomar el primero
        const videoData = Array.isArray(data) ? data[0] : data
        setVideo(videoData)
        if (videoData?.idea_contenido_id) {
          setSelectedIdeaId(videoData.idea_contenido_id.toString())
        }
      }
    } catch (error) {
      console.error('Error al cargar video:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ventas/ideas?estado=aceptada')
      const data = await response.json()
      setIdeas(data)
    } catch (error) {
      console.error('Error al cargar ideas:', error)
    }
  }

  const handleVincularIdea = async () => {
    if (!video || !selectedIdeaId) return

    setSaving(true)
    try {
      const response = await fetch(`/api/ventas/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_contenido_id: parseInt(selectedIdeaId) || null }),
      })

      if (response.ok) {
        const updatedVideo = await response.json()
        setVideo(updatedVideo)
        alert('Idea vinculada correctamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al vincular video:', error)
      alert('Error al vincular idea')
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return 'N/A'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getMaxMetric = (): number => {
    if (!video) return 1
    const metrics = [
      video.view_count || 0,
      video.like_count || 0,
      video.comment_count || 0,
    ]
    return Math.max(...metrics, 1)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted">Cargando...</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted">Video no encontrado</div>
      </div>
    )
  }

  const maxMetric = getMaxMetric()

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video info */}
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-semibold mb-2">
                  {video.titulo || 'Sin título'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span className="capitalize">{video.plataforma}</span>
                  <span>•</span>
                  <span className="capitalize">{video.tipo.replace('_', ' ')}</span>
                  {video.duracion && (
                    <>
                      <span>•</span>
                      <span>
                        {video.tipo === 'long_form'
                          ? `${Math.floor(video.duracion / 60)} min`
                          : `${video.duracion} seg`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver en {video.plataforma === 'youtube' ? 'YouTube' : 'Instagram'}
              </a>
            </div>

            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.titulo || 'Video'}
                className="w-full rounded-lg mb-4"
              />
            )}

            {video.fecha_publicacion && (
              <p className="text-sm text-muted">
                Publicado: {new Date(video.fecha_publicacion).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Métricas */}
          <div className="bg-surface rounded-xl p-6 border border-border">
            <h2 className="text-2xl font-semibold mb-6">Métricas</h2>

            {/* Cards de métricas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-sm text-muted mb-1">Visualizaciones</p>
                <p className="text-2xl font-semibold">{formatNumber(video.view_count)}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-sm text-muted mb-1">Me gusta</p>
                <p className="text-2xl font-semibold">{formatNumber(video.like_count)}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-sm text-muted mb-1">Comentarios</p>
                <p className="text-2xl font-semibold">{formatNumber(video.comment_count)}</p>
              </div>
            </div>

            {/* Gráfico de barras simple */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Visualizaciones</span>
                  <span className="text-sm text-muted">{formatNumber(video.view_count)}</span>
                </div>
                <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all"
                    style={{
                      width: `${((video.view_count || 0) / maxMetric) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Me gusta</span>
                  <span className="text-sm text-muted">{formatNumber(video.like_count)}</span>
                </div>
                <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{
                      width: `${((video.like_count || 0) / maxMetric) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Comentarios</span>
                  <span className="text-sm text-muted">{formatNumber(video.comment_count)}</span>
                </div>
                <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{
                      width: `${((video.comment_count || 0) / maxMetric) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vincular Idea */}
          <div className="bg-surface rounded-xl p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4">Vincular Idea</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Idea de Contenido</label>
              <select
                value={selectedIdeaId}
                onChange={(e) => setSelectedIdeaId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">Ninguna</option>
                {ideas.map((idea) => (
                  <option key={idea.id} value={idea.id.toString()}>
                    {idea.titulo}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleVincularIdea}
              disabled={saving}
              className="w-full px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {video.idea_contenido_id && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Vinculado a: {ideas.find((i) => i.id === video.idea_contenido_id)?.titulo || 'Idea'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
