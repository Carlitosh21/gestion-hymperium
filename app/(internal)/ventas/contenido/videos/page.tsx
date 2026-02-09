'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Youtube } from 'lucide-react'

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

export default function VideosPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [ideas, setIdeas] = useState<IdeaContenido[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('')
  // Requerimiento: solo mostrar YouTube Long Form (ocultar Shorts en UI)
  const [plataformaFilter, setPlataformaFilter] = useState<'youtube'>('youtube')
  const [tipoFilter] = useState<'long_form'>('long_form')

  useEffect(() => {
    fetchVideos()
    fetchIdeas()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/ventas/videos')
      const data = await response.json()
      setVideos(data)
    } catch (error) {
      console.error('Error al cargar videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ventas/ideas?estado=aceptada,long_form,short_form,programado')
      const data = await response.json()
      setIdeas(data)
    } catch (error) {
      console.error('Error al cargar ideas:', error)
    }
  }

  const handleVincularIdea = async () => {
    if (!selectedVideo || !selectedIdeaId) return

    try {
      const response = await fetch(`/api/ventas/videos/${selectedVideo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_contenido_id: parseInt(selectedIdeaId) }),
      })

      if (response.ok) {
        setSelectedVideo(null)
        setSelectedIdeaId('')
        fetchVideos()
      }
    } catch (error) {
      console.error('Error al vincular video:', error)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/ventas/videos/sync', {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        await fetchVideos()
        alert(`Sincronización completada: ${data.inserted} nuevos, ${data.updated} actualizados`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error al sincronizar:', error)
      alert('Error al sincronizar videos')
    } finally {
      setSyncing(false)
    }
  }

  // Solo YouTube Long Form
  const videosAMostrar = videos.filter((v) => v.plataforma === 'youtube' && v.tipo === 'long_form')

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Videos</h1>
            <p className="text-muted text-lg">
              Videos obtenidos desde YouTube e Instagram. Vincúlalos a ideas de contenido.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
        <p className="text-sm text-muted">
          Los videos se obtienen automáticamente desde las APIs de YouTube e Instagram mediante n8n.
        </p>
      </div>

      {/* Tabs de plataforma */}
      <div className="mb-6">
        <div className="bg-surface rounded-xl p-4 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 text-red-500 p-2 rounded-lg">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">YouTube</p>
              <p className="text-xs text-muted">Mostrando solo Long Form</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-accent/20 text-accent rounded-full font-medium">
            Long Form
          </span>
        </div>
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Vincular Video a Idea</h2>
            <div className="mb-4">
              <p className="text-sm text-muted mb-2">Video:</p>
              <p className="font-medium">{selectedVideo.titulo || selectedVideo.url}</p>
              <p className="text-xs text-muted mt-1">
                {selectedVideo.plataforma} - {selectedVideo.tipo}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Idea de Contenido</label>
              <select
                value={selectedIdeaId}
                onChange={(e) => setSelectedIdeaId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">Seleccionar idea...</option>
                {ideas.map((idea) => (
                  <option key={idea.id} value={idea.id.toString()}>
                    {idea.titulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleVincularIdea}
                disabled={!selectedIdeaId}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                Vincular
              </button>
              <button
                onClick={() => {
                  setSelectedVideo(null)
                  setSelectedIdeaId('')
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de videos */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-muted">Cargando...</div>
        ) : videosAMostrar.length === 0 ? (
          <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
            No hay videos de YouTube Long Form
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videosAMostrar.map((video) => (
              <div
                key={video.id}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                {video.thumbnail_url && (
                  <img
                    src={video.thumbnail_url}
                    alt={video.titulo || 'Video'}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-medium mb-2">{video.titulo || 'Sin título'}</h3>
                <p className="text-xs text-muted mb-2">
                  {video.plataforma} •{' '}
                  {video.duracion
                    ? video.tipo === 'long_form'
                      ? `${Math.floor(video.duracion / 60)} min`
                      : `${video.duracion} seg`
                    : 'N/A'}
                </p>
                {video.idea_contenido_id ? (
                  <p className="text-xs text-green-600 mb-2">✓ Vinculado</p>
                ) : (
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="text-xs text-accent hover:underline mb-2 block"
                  >
                    Vincular a idea
                  </button>
                )}
                <button
                  onClick={() => router.push(`/ventas/contenido/videos/${video.id}`)}
                  className="text-xs text-muted hover:text-accent"
                >
                  Ver detalles →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
