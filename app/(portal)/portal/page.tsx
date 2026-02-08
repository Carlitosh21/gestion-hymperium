'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Cliente {
  id: number
  nombre: string
  email: string
  telefono: string | null
  estado_entrega: number
  numero_identificacion: string
}

interface Recurso {
  id: number
  titulo: string
  tipo: string
  url: string | null
  descripcion: string | null
}

interface Tarea {
  id: number
  titulo: string
  descripcion: string | null
  responsable: string
  estado: string
  fecha_limite: string | null
}

interface Resultado {
  id: number
  titulo: string
  descripcion: string | null
}

export default function PortalPage() {
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'recursos' | 'tareas' | 'resultados'>('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clienteRes, recursosRes, tareasRes, resultadosRes] = await Promise.all([
        fetch('/api/portal/me'),
        fetch('/api/portal/me/recursos'),
        fetch('/api/portal/me/tareas'),
        fetch('/api/portal/me/resultados'),
      ])

      if (clienteRes.status === 401) {
        router.push('/portal/login')
        return
      }

      setCliente(await clienteRes.json())
      setRecursos(await recursosRes.json())
      setTareas(await tareasRes.json())
      setResultados(await resultadosRes.json())
    } catch (error) {
      console.error('Error al cargar datos:', error)
      router.push('/portal/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/portal/logout', { method: 'POST' })
      router.push('/portal/login')
      router.refresh()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted">Cargando...</div>
      </div>
    )
  }

  if (!cliente) {
    return null
  }

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'tareas', label: 'Tareas' },
    { id: 'resultados', label: 'Resultados' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Panel del Cliente</h1>
          <p className="text-muted">{cliente.nombre}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border mb-6">
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Estado de Entrega</h2>
            <span className="text-2xl font-semibold">{cliente.estado_entrega}%</span>
          </div>
          <div className="w-full bg-surface-elevated rounded-full h-3">
            <div
              className="bg-accent h-3 rounded-full transition-all"
              style={{ width: `${cliente.estado_entrega}%` }}
            />
          </div>
        </div>

        <div className="border-b border-border">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Información General</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted">Email:</span> {cliente.email}
                  </div>
                  {cliente.telefono && (
                    <div>
                      <span className="text-muted">Teléfono:</span> {cliente.telefono}
                    </div>
                  )}
                  <div>
                    <span className="text-muted">Número de Identificación:</span>{' '}
                    <code className="bg-surface-elevated px-2 py-1 rounded">{cliente.numero_identificacion}</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recursos' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recursos Relacionados</h3>
              {recursos.length === 0 ? (
                <p className="text-muted text-sm">No hay recursos agregados</p>
              ) : (
                <div className="space-y-3">
                  {recursos.map((recurso) => (
                    <div key={recurso.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
                      <h4 className="font-medium mb-1">{recurso.titulo}</h4>
                      {recurso.descripcion && <p className="text-sm text-muted mb-2">{recurso.descripcion}</p>}
                      {recurso.url && (
                        <a
                          href={recurso.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent hover:underline"
                        >
                          Abrir →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tareas' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Tareas</h3>
              {tareas.length === 0 ? (
                <p className="text-muted text-sm">No hay tareas</p>
              ) : (
                <div className="space-y-3">
                  {tareas.map((tarea) => (
                    <div key={tarea.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{tarea.titulo}</h4>
                          {tarea.descripcion && <p className="text-sm text-muted mb-2">{tarea.descripcion}</p>}
                          <div className="flex gap-4 text-xs text-muted">
                            <span>Responsable: {tarea.responsable === 'nosotros' ? 'Nosotros' : 'Ellos'}</span>
                            {tarea.fecha_limite && (
                              <span>
                                Fecha límite: {new Date(tarea.fecha_limite).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-lg ${
                          tarea.estado === 'completada' ? 'bg-green-600 text-white' :
                          tarea.estado === 'en_progreso' ? 'bg-blue-600 text-white' :
                          'bg-gray-300 text-gray-700'
                        }`}>
                          {tarea.estado === 'completada' ? 'Completada' :
                           tarea.estado === 'en_progreso' ? 'En Progreso' :
                           'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resultados' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Resultados</h3>
              {resultados.length === 0 ? (
                <p className="text-muted text-sm">No hay resultados agregados</p>
              ) : (
                <div className="space-y-4">
                  {resultados.map((resultado) => (
                    <div key={resultado.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
                      <h4 className="font-medium mb-2">{resultado.titulo}</h4>
                      {resultado.descripcion && <p className="text-sm text-muted">{resultado.descripcion}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
