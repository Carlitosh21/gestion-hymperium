'use client'

import { useState, useEffect } from 'react'

interface Llamada {
  id: number
  lead_id: number | null
  cliente_id: number | null
  fecha: string
  duracion: number | null
  link_grabacion: string | null
  notas: string | null
  resultado: string | null
  lead_nombre?: string
  cliente_nombre?: string
}

interface Lead {
  id: number
  nombre: string
}

interface Cliente {
  id: number
  nombre: string
}

export default function LlamadasPage() {
  const [llamadas, setLlamadas] = useState<Llamada[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    lead_id: '',
    cliente_id: '',
    fecha: new Date().toISOString().slice(0, 16),
    duracion: '',
    link_grabacion: '',
    notas: '',
    resultado: '',
    origen: 'prospeccion', // 'prospeccion' o 'contenido'
  })

  useEffect(() => {
    fetchLlamadas()
    fetchLeads()
    fetchClientes()
  }, [])

  const fetchLlamadas = async () => {
    try {
      const response = await fetch('/api/ventas/llamadas')
      const data = await response.json()
      setLlamadas(data)
    } catch (error) {
      console.error('Error al cargar llamadas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/ventas/leads')
      const data = await response.json()
      setLeads(data)
    } catch (error) {
      console.error('Error al cargar leads:', error)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/ventas/llamadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: formData.lead_id ? parseInt(formData.lead_id) : null,
          cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null,
          fecha: formData.fecha,
          duracion: formData.duracion ? parseInt(formData.duracion) : null,
          link_grabacion: formData.link_grabacion || null,
          notas: formData.notas || null,
          resultado: formData.resultado || null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          lead_id: '',
          cliente_id: '',
          fecha: new Date().toISOString().slice(0, 16),
          duracion: '',
          link_grabacion: '',
          notas: '',
          resultado: '',
          origen: 'prospeccion',
        })
        fetchLlamadas()
      }
    } catch (error) {
      console.error('Error al crear llamada:', error)
    }
  }

  const formatDuracion = (segundos: number | null) => {
    if (!segundos) return 'N/A'
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`
    }
    return `${minutos}m ${segs}s`
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Llamadas</h1>
          <p className="text-muted text-lg">Gestión de llamadas y vinculación con leads</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nueva Llamada'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Nueva Llamada</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Origen</label>
                <select
                  value={formData.origen}
                  onChange={(e) => {
                    setFormData({ ...formData, origen: e.target.value, lead_id: '', cliente_id: '' })
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="prospeccion">Prospección Fría</option>
                  <option value="contenido">Contenido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {formData.origen === 'prospeccion' ? 'Lead' : 'Cliente'}
                </label>
                <select
                  value={formData.origen === 'prospeccion' ? formData.lead_id : formData.cliente_id}
                  onChange={(e) => {
                    if (formData.origen === 'prospeccion') {
                      setFormData({ ...formData, lead_id: e.target.value })
                    } else {
                      setFormData({ ...formData, cliente_id: e.target.value })
                    }
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Seleccionar...</option>
                  {formData.origen === 'prospeccion'
                    ? leads.map((lead) => (
                        <option key={lead.id} value={lead.id.toString()}>
                          {lead.nombre}
                        </option>
                      ))
                    : clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nombre}
                        </option>
                      ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duración (segundos)</label>
                <input
                  type="number"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Link de Grabación</label>
                <input
                  type="url"
                  value={formData.link_grabacion}
                  onChange={(e) => setFormData({ ...formData, link_grabacion: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Resultado</label>
                <input
                  type="text"
                  value={formData.resultado}
                  onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="Ej: Cliente interesado, necesita más info, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Crear Llamada
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : llamadas.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
          No hay llamadas registradas
        </div>
      ) : (
        <div className="space-y-4">
          {llamadas.map((llamada) => (
            <div
              key={llamada.id}
              className="bg-surface rounded-xl p-6 border border-border"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {llamada.lead_nombre || llamada.cliente_nombre || 'Sin nombre'}
                  </h3>
                  <p className="text-sm text-muted">
                    {new Date(llamada.fecha).toLocaleString('es-ES')}
                  </p>
                  {llamada.duracion && (
                    <p className="text-sm text-muted mt-1">
                      Duración: {formatDuracion(llamada.duracion)}
                    </p>
                  )}
                </div>
                {llamada.link_grabacion && (
                  <a
                    href={llamada.link_grabacion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
                  >
                    Ver Grabación
                  </a>
                )}
              </div>
              {llamada.resultado && (
                <p className="text-sm mb-2">
                  <span className="font-medium">Resultado:</span> {llamada.resultado}
                </p>
              )}
              {llamada.notas && (
                <p className="text-sm text-muted">{llamada.notas}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
