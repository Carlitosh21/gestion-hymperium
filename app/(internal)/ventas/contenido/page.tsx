'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'

interface IdeaContenido {
  id: number
  titulo: string
  descripcion: string | null
  descripcion_estrategica: string | null
  estado: string
  document_id: string | null
  guion_longform_url: string | null
  created_at: string
}

interface IdeaModalProps {
  onClose: () => void
  onSave: (data: {
    titulo_video: string
    descripcion_estrategica: string
    documentId?: string
  }) => Promise<void>
}

function IdeaModal({ onClose, onSave }: IdeaModalProps) {
  const [tituloVideo, setTituloVideo] = useState('')
  const [descripcionEstrategica, setDescripcionEstrategica] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tituloVideo.trim()) {
      setError('Título del video es requerido')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onSave({
        titulo_video: tituloVideo.trim(),
        descripcion_estrategica: descripcionEstrategica.trim() || '',
        documentId: documentId.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar idea')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl p-6 border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Nueva Idea</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título del Video *</label>
            <input
              type="text"
              required
              value={tituloVideo}
              onChange={(e) => setTituloVideo(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="ej: Los Setters Humanos Son Mercenarios..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descripción Estratégica</label>
            <textarea
              value={descripcionEstrategica}
              onChange={(e) => setDescripcionEstrategica(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Objetivo del video, curiosity gap, valor a dar..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Document ID (opcional)</label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="ID del documento de Google Docs"
            />
            <p className="text-xs text-muted mt-1">
              Si proporcionas un Document ID, se generará automáticamente la URL del guion Long Form
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ContenidoPage() {
  const [ideas, setIdeas] = useState<IdeaContenido[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingN8n, setLoadingN8n] = useState(false)
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('pendiente')

  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ventas/ideas')
      const data = await response.json()
      setIdeas(data)
    } catch (error) {
      console.error('Error al cargar ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearMasIdeas = async () => {
    setLoadingN8n(true)
    try {
      const response = await fetch('/api/ventas/ideas/sync', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (response.ok) {
        await fetchIdeas()
        alert(`Sincronización completada: ${data.inserted} nuevas, ${data.updated} actualizadas`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error al sincronizar ideas:', error)
      alert('Error al sincronizar ideas. Verifica la configuración de n8n.')
    } finally {
      setLoadingN8n(false)
    }
  }

  const handleSaveIdea = async (data: {
    titulo_video: string
    descripcion_estrategica: string
    documentId?: string
  }) => {
    const response = await fetch('/api/ventas/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear idea')
    }

    await fetchIdeas()
  }

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/ventas/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        fetchIdeas()
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
    }
  }

  const handleRechazar = async (id: number) => {
    if (!confirm('¿Estás seguro de rechazar esta idea? Se borrará de la base de datos.')) {
      return
    }

    try {
      const response = await fetch(`/api/ventas/ideas/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchIdeas()
      }
    } catch (error) {
      console.error('Error al rechazar idea:', error)
    }
  }

  const ideasPendientes = ideas.filter((i) => i.estado === 'pendiente')
  const ideasAceptadas = ideas.filter((i) => i.estado === 'aceptada')
  const ideasLongForm = ideas.filter((i) => i.estado === 'long_form')
  const ideasShortForm = ideas.filter((i) => i.estado === 'short_form')
  const ideasProgramadas = ideas.filter((i) => i.estado === 'programado')

  const tabs = [
    { id: 'pendiente', label: 'Pendientes', count: ideasPendientes.length },
    { id: 'aceptada', label: 'Aceptadas', count: ideasAceptadas.length },
    { id: 'long_form', label: 'Long Form', count: ideasLongForm.length },
    { id: 'short_form', label: 'Short Form', count: ideasShortForm.length },
    { id: 'programado', label: 'Programado', count: ideasProgramadas.length },
  ]

  const getIdeasForTab = (tabId: string) => {
    switch (tabId) {
      case 'pendiente': return ideasPendientes
      case 'aceptada': return ideasAceptadas
      case 'long_form': return ideasLongForm
      case 'short_form': return ideasShortForm
      case 'programado': return ideasProgramadas
      default: return []
    }
  }

  const getAccionesForEstado = (idea: IdeaContenido) => {
    switch (idea.estado) {
      case 'pendiente':
        return (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleCambiarEstado(idea.id, 'aceptada')}
              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Aceptar
            </button>
            <button
              onClick={() => handleRechazar(idea.id)}
              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Rechazar
            </button>
          </div>
        )
      case 'aceptada':
        return (
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => handleCambiarEstado(idea.id, 'long_form')}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Long Form Listo
            </button>
            <button
              onClick={() => handleCambiarEstado(idea.id, 'short_form')}
              className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Short Form Listo
            </button>
            <button
              onClick={() => handleCambiarEstado(idea.id, 'programado')}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Programar
            </button>
          </div>
        )
      case 'long_form':
        return (
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => handleCambiarEstado(idea.id, 'short_form')}
              className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Short Form Listo
            </button>
            <button
              onClick={() => handleCambiarEstado(idea.id, 'programado')}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Programar
            </button>
          </div>
        )
      case 'short_form':
        return (
          <div className="mt-4">
            <button
              onClick={() => handleCambiarEstado(idea.id, 'programado')}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Programar
            </button>
          </div>
        )
      case 'programado':
        return (
          <div className="mt-4">
            <div className="px-4 py-2 bg-indigo-100 text-indigo-800 text-sm rounded-lg text-center font-medium">
              Programado
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderIdeaCard = (idea: IdeaContenido) => {
    const descripcion = idea.descripcion_estrategica || idea.descripcion
    return (
      <div
        key={idea.id}
        className="p-6 bg-surface rounded-xl border border-border hover:border-accent/50 transition-all flex flex-col h-full"
      >
        <h3 className="text-lg font-semibold mb-3 leading-tight">{idea.titulo}</h3>
        {descripcion && (
          <div className="flex-1 mb-4">
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{descripcion}</p>
          </div>
        )}
        {idea.guion_longform_url && (
          <a
            href={idea.guion_longform_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-accent hover:underline mb-4 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Guion Long Form
          </a>
        )}
        {getAccionesForEstado(idea)}
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Ideas de Contenido</h1>
          <p className="text-muted text-lg">Gestiona ideas de contenido y videos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowIdeaModal(true)}
            className="px-6 py-2.5 bg-surface text-foreground border border-border rounded-lg font-medium hover:bg-surface-elevated transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Nueva Idea
          </button>
          <button
            onClick={handleCrearMasIdeas}
            disabled={loadingN8n}
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loadingN8n ? 'Generando...' : 'Crear más Ideas'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                flex items-center gap-2
                ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-foreground hover:border-border'
                }
              `}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`
                    px-2 py-0.5 text-xs rounded-full
                    ${
                      activeTab === tab.id
                        ? 'bg-accent/20 text-accent'
                        : 'bg-surface-elevated text-muted'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Ideas */}
      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getIdeasForTab(activeTab).length === 0 ? (
            <div className="col-span-full">
              <div className="bg-surface rounded-xl p-12 border border-border text-center">
                <p className="text-muted text-lg">
                  No hay ideas {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            getIdeasForTab(activeTab).map((idea) => renderIdeaCard(idea))
          )}
        </div>
      )}

      {/* Sección de Videos */}
      <div className="mt-8">
        <div className="bg-surface rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Videos</h2>
              <p className="text-sm text-muted">Gestiona tus videos subidos de YouTube e Instagram</p>
            </div>
            <Link
              href="/ventas/contenido/videos"
              className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Ver todos los videos →
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Idea */}
      {showIdeaModal && (
        <IdeaModal
          onClose={() => setShowIdeaModal(false)}
          onSave={handleSaveIdea}
        />
      )}
    </div>
  )
}
