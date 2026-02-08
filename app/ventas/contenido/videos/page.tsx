'use client'

import { useState, useEffect } from 'react'

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
}

interface IdeaContenido {
  id: number
  titulo: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [ideas, setIdeas] = useState<IdeaContenido[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('')

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
      const response = await fetch('/api/ventas/ideas?estado=aceptada')
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

  const videosLongForm = videos.filter((v) => v.tipo === 'long_form')
  const videosShortForm = videos.filter((v) => v.tipo === 'short_form')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-2">Videos</h1>
        <p className="text-muted text-lg">
          Videos obtenidos desde YouTube e Instagram. Vincúlalos a ideas de contenido.
        </p>
        <p className="text-sm text-muted mt-2">
          Los videos se obtienen automáticamente desde las APIs de YouTube e Instagram mediante n8n.
        </p>
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

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Long Form</h2>
          {loading ? (
            <div className="text-center py-12 text-muted">Cargando...</div>
          ) : videosLongForm.length === 0 ? (
            <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
              No hay videos de formato largo
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videosLongForm.map((video) => (
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
                    {video.plataforma} • {video.duracion ? `${Math.floor(video.duracion / 60)} min` : 'N/A'}
                  </p>
                  {video.idea_contenido_id ? (
                    <p className="text-xs text-green-600 mb-2">✓ Vinculado</p>
                  ) : (
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="text-xs text-accent hover:underline"
                    >
                      Vincular a idea
                    </button>
                  )}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-accent"
                  >
                    Ver video →
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Short Form</h2>
          {loading ? (
            <div className="text-center py-12 text-muted">Cargando...</div>
          ) : videosShortForm.length === 0 ? (
            <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
              No hay videos de formato corto
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videosShortForm.map((video) => (
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
                    {video.plataforma} • {video.duracion ? `${video.duracion} seg` : 'N/A'}
                  </p>
                  {video.idea_contenido_id ? (
                    <p className="text-xs text-green-600 mb-2">✓ Vinculado</p>
                  ) : (
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="text-xs text-accent hover:underline"
                    >
                      Vincular a idea
                    </button>
                  )}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-accent"
                  >
                    Ver video →
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
