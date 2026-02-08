'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface IdeaContenido {
  id: number
  titulo: string
  descripcion: string | null
  estado: string
  created_at: string
}

export default function ContenidoPage() {
  const [ideas, setIdeas] = useState<IdeaContenido[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingN8n, setLoadingN8n] = useState(false)

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
      // Esto llamará al flujo n8n cuando esté configurado
      // Por ahora solo mostramos un mensaje
      alert('Esta funcionalidad se conectará con n8n. El flujo n8n generará las ideas y las guardará en la base de datos.')
      
      // Cuando n8n esté configurado, aquí se haría:
      // const nuevasIdeas = await getIdeasFromN8n()
      // Luego se guardarían en la DB mediante un endpoint
      
      // Refrescar la lista después de un momento
      setTimeout(() => {
        fetchIdeas()
      }, 2000)
    } catch (error) {
      console.error('Error al obtener ideas de n8n:', error)
      alert('Error al obtener ideas. Verifica la configuración de n8n.')
    } finally {
      setLoadingN8n(false)
    }
  }

  const handleAceptar = async (id: number) => {
    try {
      const response = await fetch(`/api/ventas/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'aceptada' }),
      })

      if (response.ok) {
        fetchIdeas()
        // Aquí se crearían las ideas de Reels cuando se implemente
      }
    } catch (error) {
      console.error('Error al aceptar idea:', error)
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
  const ideasRechazadas = ideas.filter((i) => i.estado === 'rechazada')

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Ideas de Contenido</h1>
          <p className="text-muted text-lg">Gestiona ideas de contenido y videos</p>
        </div>
        <button
          onClick={handleCrearMasIdeas}
          disabled={loadingN8n}
          className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {loadingN8n ? 'Generando...' : 'Crear más Ideas'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Pendientes</h2>
          {loading ? (
            <div className="text-muted text-sm">Cargando...</div>
          ) : ideasPendientes.length === 0 ? (
            <p className="text-sm text-muted">No hay ideas pendientes</p>
          ) : (
            <div className="space-y-3">
              {ideasPendientes.map((idea) => (
                <div
                  key={idea.id}
                  className="p-4 bg-surface-elevated rounded-lg border border-border"
                >
                  <h3 className="font-medium mb-2">{idea.titulo}</h3>
                  {idea.descripcion && (
                    <p className="text-sm text-muted mb-3">{idea.descripcion}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAceptar(idea.id)}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleRechazar(idea.id)}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Aceptadas</h2>
          {ideasAceptadas.length === 0 ? (
            <p className="text-sm text-muted">No hay ideas aceptadas</p>
          ) : (
            <div className="space-y-3">
              {ideasAceptadas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-4 bg-surface-elevated rounded-lg border border-border"
                >
                  <h3 className="font-medium mb-2">{idea.titulo}</h3>
                  {idea.descripcion && (
                    <p className="text-sm text-muted">{idea.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Videos</h2>
          <Link
            href="/ventas/contenido/videos"
            className="text-accent hover:underline"
          >
            Ver todos los videos →
          </Link>
        </div>
      </div>
    </div>
  )
}
