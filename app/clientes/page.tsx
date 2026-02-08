'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Cliente {
  id: number
  nombre: string
  email: string
  telefono: string | null
  estado_entrega: number
  created_at: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    llamada_id: '',
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          llamada_id: formData.llamada_id ? parseInt(formData.llamada_id) : null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          nombre: '',
          email: '',
          password: '',
          telefono: '',
          llamada_id: '',
        })
        fetchClientes()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear cliente')
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      alert('Error al crear cliente')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Clientes</h1>
          <p className="text-muted text-lg">Gestión de clientes y sus proyectos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Nuevo Cliente</h2>
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
                <label className="block text-sm font-medium mb-2">Email (Gmail) *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="cliente@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contraseña *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="Para acceso al panel del cliente"
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">ID de Llamada (opcional)</label>
                <input
                  type="number"
                  value={formData.llamada_id}
                  onChange={(e) => setFormData({ ...formData, llamada_id: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="Vincular a una llamada existente"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Crear Cliente
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : clientes.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
          No hay clientes registrados
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="bg-surface rounded-xl p-6 border border-border hover:bg-surface-elevated transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">{cliente.nombre}</h3>
              <p className="text-sm text-muted mb-2">{cliente.email}</p>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted">Estado de entrega</span>
                  <span className="text-sm font-medium">{cliente.estado_entrega}%</span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${cliente.estado_entrega}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
