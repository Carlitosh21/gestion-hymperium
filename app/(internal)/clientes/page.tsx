'use client'

import { useState, useEffect } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Cliente {
  id: number
  manychat_id: string | null
  nombre: string | null
  username: string | null
  estado: string
  ultima_interaccion: string | null
  created_at: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

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

  const openInstagram = (username: string | null) => {
    if (!username) return
    window.open(`https://instagram.com/${username}`, '_blank')
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filtered =
    searchTerm.trim()
      ? clientes.filter((c) => {
          const q = searchTerm.trim().toLowerCase()
          const n = (c.nombre || '').toLowerCase()
          const u = (c.username || '').toLowerCase()
          return n.includes(q) || u.includes(q)
        })
      : clientes

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Clientes</h1>
          <p className="text-muted text-lg">Leads vendidos (estado Vendido)</p>
        </div>
        <Link
          href="/leads"
          className="px-6 py-2.5 bg-surface border border-border rounded-lg font-medium hover:bg-surface-elevated transition-colors"
        >
          Ver pipeline de Leads
        </Link>
      </div>

      {!loading && clientes.length > 0 && (
        <div className="mb-6 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o username…"
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
          {searchTerm.trim() ? 'No hay resultados para tu búsqueda' : 'No hay clientes (leads vendidos)'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-surface rounded-xl p-6 border border-border hover:bg-surface-elevated transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {cliente.username ? `@${cliente.username}` : cliente.nombre || 'Sin nombre'}
                </h3>
                {cliente.username && (
                  <button
                    onClick={() => openInstagram(cliente.username)}
                    className="p-2 hover:bg-surface rounded transition-colors"
                    title="Abrir Instagram"
                  >
                    <ExternalLink className="w-4 h-4 text-muted" />
                  </button>
                )}
              </div>
              {cliente.username && cliente.nombre && cliente.nombre !== cliente.username && (
                <p className="text-sm text-muted mb-2">{cliente.nombre}</p>
              )}
              <div className="text-xs text-muted mt-auto">
                Última interacción: {formatFecha(cliente.ultima_interaccion)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
