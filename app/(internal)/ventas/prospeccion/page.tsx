'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Lead {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  origen: string
  metodo_prospeccion: string | null
  estado: string
  notas: string | null
  created_at: string
}

export default function ProspeccionPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    metodo_prospeccion: '',
    notas: '',
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/ventas/leads')
      const data = await response.json()
      setLeads(data)
    } catch (error) {
      console.error('Error al cargar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/ventas/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          origen: 'prospeccion',
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          metodo_prospeccion: '',
          notas: '',
        })
        fetchLeads()
      }
    } catch (error) {
      console.error('Error al crear lead:', error)
    }
  }

  const estados = ['nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido']

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Pipeline de Leads</h1>
          <p className="text-muted text-lg">Gestión de prospección y procedimientos estandarizados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Lead'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Nuevo Lead</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Método de Prospección</label>
                <input
                  type="text"
                  value={formData.metodo_prospeccion}
                  onChange={(e) => setFormData({ ...formData, metodo_prospeccion: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="Ej: LinkedIn, Cold Email, etc."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Crear Lead
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estados.map((estado) => {
            const leadsEstado = leads.filter((l) => l.estado === estado)
            return (
              <div key={estado} className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4 capitalize">{estado}</h3>
                <div className="space-y-3">
                  {leadsEstado.length === 0 ? (
                    <p className="text-sm text-muted">Sin leads</p>
                  ) : (
                    leadsEstado.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/ventas/leads/${lead.id}`}
                        className="block p-3 bg-surface-elevated rounded-lg hover:bg-surface transition-colors"
                      >
                        <div className="font-medium">{lead.nombre}</div>
                        {lead.email && (
                          <div className="text-sm text-muted mt-1">{lead.email}</div>
                        )}
                        {lead.metodo_prospeccion && (
                          <div className="text-xs text-muted mt-1">
                            {lead.metodo_prospeccion}
                          </div>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
