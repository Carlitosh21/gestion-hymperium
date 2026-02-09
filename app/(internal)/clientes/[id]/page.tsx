'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Copy, ExternalLink } from 'lucide-react'

interface Cliente {
  id: number
  nombre: string
  email: string
  telefono: string | null
  estado_entrega: number
  cotizacion: string | null
  entregables: string | null
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

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.id as string

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'recursos' | 'tareas' | 'ficha' | 'resultados' | 'onboarding'>('overview')

  useEffect(() => {
    if (clienteId) {
      fetchCliente()
      fetchRecursos()
      fetchTareas()
      fetchResultados()
    }
  }, [clienteId])

  const fetchCliente = async () => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}`)
      const data = await response.json()
      setCliente(data)
    } catch (error) {
      console.error('Error al cargar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecursos = async () => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}/recursos`)
      const data = await response.json()
      setRecursos(data)
    } catch (error) {
      console.error('Error al cargar recursos:', error)
    }
  }

  const fetchTareas = async () => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}/tareas`)
      const data = await response.json()
      setTareas(data)
    } catch (error) {
      console.error('Error al cargar tareas:', error)
    }
  }

  const fetchResultados = async () => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}/resultados`)
      const data = await response.json()
      setResultados(data)
    } catch (error) {
      console.error('Error al cargar resultados:', error)
    }
  }

  const handleUpdateEstadoEntrega = async (nuevoEstado: number) => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_entrega: nuevoEstado }),
      })

      if (response.ok) {
        fetchCliente()
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
    }
  }

  const handleDeleteCliente = async () => {
    if (!confirm(`¿Estás seguro de eliminar al cliente "${cliente?.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/clientes')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar cliente')
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      alert('Error al eliminar cliente')
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
    return (
      <div className="p-8">
        <div className="text-center py-12 text-red-600">Cliente no encontrado</div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'tareas', label: 'Tareas' },
    { id: 'ficha', label: 'Ficha' },
    { id: 'resultados', label: 'Resultados' },
    { id: 'onboarding', label: 'Onboarding' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link href="/clientes" className="text-accent hover:underline text-sm mb-4 inline-block">
              ← Volver a Clientes
            </Link>
            <h1 className="text-4xl font-semibold mb-2">{cliente.nombre}</h1>
            <p className="text-muted">{cliente.email}</p>
          </div>
          <button
            onClick={handleDeleteCliente}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Cliente
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border mb-6">
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Estado de Entrega</h2>
            <span className="text-2xl font-semibold">{cliente.estado_entrega}%</span>
          </div>
          <div className="w-full bg-surface-elevated rounded-full h-3 mb-4">
            <div
              className="bg-accent h-3 rounded-full transition-all"
              style={{ width: `${cliente.estado_entrega}%` }}
            />
          </div>
          <div className="flex gap-2">
            {[0, 25, 50, 75, 100].map((valor) => (
              <button
                key={valor}
                onClick={() => handleUpdateEstadoEntrega(valor)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  cliente.estado_entrega === valor
                    ? 'bg-accent text-white'
                    : 'bg-surface-elevated hover:bg-surface'
                }`}
              >
                {valor}%
              </button>
            ))}
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
            <RecursosTab
              clienteId={clienteId}
              recursos={recursos}
              onRefresh={fetchRecursos}
            />
          )}

          {activeTab === 'tareas' && (
            <TareasTab
              clienteId={clienteId}
              tareas={tareas}
              onRefresh={fetchTareas}
            />
          )}

          {activeTab === 'ficha' && (
            <FichaTab cliente={cliente} onRefresh={fetchCliente} />
          )}

          {activeTab === 'resultados' && (
            <ResultadosTab
              clienteId={clienteId}
              resultados={resultados}
              onRefresh={fetchResultados}
            />
          )}

          {activeTab === 'onboarding' && (
            <OnboardingTab clienteId={clienteId} numeroIdentificacion={cliente.numero_identificacion} />
          )}
        </div>
      </div>
    </div>
  )
}

function RecursosTab({ clienteId, recursos, onRefresh }: { clienteId: string; recursos: Recurso[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'link',
    url: '',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/clientes/${clienteId}/recursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ titulo: '', tipo: 'link', url: '', descripcion: '' })
        onRefresh()
      }
    } catch (error) {
      console.error('Error al crear recurso:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recursos Relacionados</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Recurso'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-surface-elevated rounded-lg space-y-3">
          <input
            type="text"
            required
            placeholder="Título"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          >
            <option value="link">Link</option>
            <option value="archivo">Archivo</option>
            <option value="nota">Nota</option>
          </select>
          <input
            type="url"
            placeholder="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <textarea
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors"
          >
            Agregar
          </button>
        </form>
      )}

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
  )
}

function TareasTab({ clienteId, tareas, onRefresh }: { clienteId: string; tareas: Tarea[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    responsable: 'nosotros',
    fecha_limite: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/clientes/${clienteId}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fecha_limite: formData.fecha_limite || null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ titulo: '', descripcion: '', responsable: 'nosotros', fecha_limite: '' })
        onRefresh()
      }
    } catch (error) {
      console.error('Error al crear tarea:', error)
    }
  }

  const handleToggleEstado = async (tareaId: number, nuevoEstado: string) => {
    try {
      await fetch(`/api/clientes/${clienteId}/tareas/${tareaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      onRefresh()
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tareas Pendientes</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Tarea'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-surface-elevated rounded-lg space-y-3">
          <input
            type="text"
            required
            placeholder="Título"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <textarea
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <select
            value={formData.responsable}
            onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          >
            <option value="nosotros">Nosotros</option>
            <option value="ellos">Ellos</option>
          </select>
          <input
            type="datetime-local"
            value={formData.fecha_limite}
            onChange={(e) => setFormData({ ...formData, fecha_limite: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors"
          >
            Agregar
          </button>
        </form>
      )}

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
                <select
                  value={tarea.estado}
                  onChange={(e) => handleToggleEstado(tarea.id, e.target.value)}
                  className="ml-4 px-3 py-1 text-sm border border-border rounded-lg bg-background"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FichaTab({ cliente, onRefresh }: { cliente: Cliente; onRefresh: () => void }) {
  const [cotizacion, setCotizacion] = useState(cliente.cotizacion || '')
  const [entregables, setEntregables] = useState(cliente.entregables || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cotizacion, entregables }),
      })
      onRefresh()
      alert('Ficha actualizada correctamente')
    } catch (error) {
      console.error('Error al guardar ficha:', error)
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Ficha del Cliente</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Cotización</label>
          <textarea
            value={cotizacion}
            onChange={(e) => setCotizacion(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            placeholder="Detalles de la cotización..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Entregables</label>
          <textarea
            value={entregables}
            onChange={(e) => setEntregables(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            placeholder="Lista de entregables..."
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Ficha'}
        </button>
      </div>
    </div>
  )
}

function ResultadosTab({ clienteId, resultados, onRefresh }: { clienteId: string; resultados: Resultado[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/clientes/${clienteId}/resultados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ titulo: '', descripcion: '' })
        onRefresh()
      }
    } catch (error) {
      console.error('Error al crear resultado:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Panel de Resultados</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Resultado'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-surface-elevated rounded-lg space-y-3">
          <input
            type="text"
            required
            placeholder="Título"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <textarea
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors"
          >
            Agregar
          </button>
        </form>
      )}

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
  )
}


interface PreguntaRespuesta {
  pregunta_id: number
  titulo: string | null
  descripcion: string | null
  pregunta: string
  tipo: string
  opciones: any
  orden: number
  activa: boolean
  respuesta: string | null
  respuesta_fecha: string | null
}

function OnboardingTab({ clienteId, numeroIdentificacion }: { clienteId: string; numeroIdentificacion: string }) {
  const [preguntasRespuestas, setPreguntasRespuestas] = useState<PreguntaRespuesta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOnboarding()
  }, [clienteId])

  const fetchOnboarding = async () => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}/onboarding`)
      if (!response.ok) {
        throw new Error('Error al cargar onboarding')
      }
      const data = await response.json()
      setPreguntasRespuestas(data.preguntas_respuestas || [])
    } catch (error) {
      console.error('Error al cargar onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyUrlPublica = () => {
    const url = `${window.location.origin}/onboarding`
    navigator.clipboard.writeText(url)
    alert('URL pública copiada al portapapeles')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Onboarding (Respuestas)</h3>
          <p className="text-sm text-muted">
            Respuestas del cliente al formulario de onboarding
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyUrlPublica}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copiar URL Pública
          </button>
        </div>
      </div>

      {/* Info del cliente */}
      <div className="p-4 bg-surface-elevated rounded-lg border border-border mb-6">
        <p className="text-sm text-muted mb-2">
          Número de identificación del cliente:
        </p>
        <code className="block bg-background px-3 py-2 rounded-lg text-sm font-mono mb-2">
          {numeroIdentificacion}
        </code>
        <p className="text-xs text-muted">
          Este número debe ser ingresado por el cliente al inicio del formulario público para vincular sus respuestas.
        </p>
      </div>

      {/* Listado de preguntas y respuestas */}
      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : preguntasRespuestas.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
          No hay preguntas configuradas en el formulario de onboarding.
        </div>
      ) : (
        <div className="space-y-4">
          {preguntasRespuestas
            .filter(p => p.activa) // Solo mostrar preguntas activas
            .sort((a, b) => a.orden - b.orden)
            .map((item) => (
            <div
              key={item.pregunta_id}
              className="bg-surface rounded-xl p-6 border border-border"
            >
              <div className="mb-3">
                <h4 className="font-medium mb-1">
                  {item.titulo || item.pregunta}
                </h4>
                {item.descripcion && (
                  <p className="text-sm text-muted mb-2">{item.descripcion}</p>
                )}
              </div>
              {item.respuesta ? (
                <div className="mt-3 p-3 bg-surface-elevated rounded-lg">
                  <p className="text-sm font-medium mb-1">Respuesta:</p>
                  <p className="text-sm">{item.respuesta}</p>
                  {item.respuesta_fecha && (
                    <p className="text-xs text-muted mt-2">
                      Respondida el: {new Date(item.respuesta_fecha).toLocaleString('es-AR')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 p-3 bg-surface-elevated rounded-lg">
                  <p className="text-sm text-muted italic">Sin respuesta aún</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
