'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Check, X, Trash2, Pencil } from 'lucide-react'

interface Cta {
  id: number
  accionable: string
  detalles: string
  recurso: string
}

export default function CtasPage() {
  const [ctas, setCtas] = useState<Cta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ accionable: '', detalles: '', recurso: '' })
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ accionable: '', detalles: '', recurso: '' })

  useEffect(() => {
    fetchCtas()
  }, [])

  const fetchCtas = async () => {
    try {
      const response = await fetch('/api/ctas')
      const data = await response.json()
      setCtas(data)
    } catch (error) {
      console.error('Error al cargar CTAs:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (cta: Cta) => {
    setEditingId(cta.id)
    setEditForm({
      accionable: cta.accionable || '',
      detalles: cta.detalles || '',
      recurso: cta.recurso || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ accionable: '', detalles: '', recurso: '' })
  }

  const saveEdit = async () => {
    if (editingId === null) return
    try {
      const response = await fetch(`/api/ctas/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (response.ok) {
        setEditingId(null)
        fetchCtas()
      } else {
        const err = await response.json()
        alert(err.error || 'Error al guardar')
      }
    } catch (e: any) {
      alert(e.message || 'Error al guardar')
    }
  }

  const discardEdit = () => {
    cancelEdit()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Borrar este CTA?')) return
    try {
      const response = await fetch(`/api/ctas/${id}`, { method: 'DELETE' })
      if (response.ok) fetchCtas()
      else {
        const err = await response.json()
        alert(err.error || 'Error al borrar')
      }
    } catch (e: any) {
      alert(e.message || 'Error al borrar')
    }
  }

  const startCreate = () => {
    setCreating(true)
    setCreateForm({ accionable: '', detalles: '', recurso: '' })
  }

  const cancelCreate = () => {
    setCreating(false)
    setCreateForm({ accionable: '', detalles: '', recurso: '' })
  }

  const saveCreate = async () => {
    try {
      const response = await fetch('/api/ctas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (response.ok) {
        setCreating(false)
        setCreateForm({ accionable: '', detalles: '', recurso: '' })
        fetchCtas()
      } else {
        const err = await response.json()
        alert(err.error || 'Error al crear')
      }
    } catch (e: any) {
      alert(e.message || 'Error al crear')
    }
  }

  const filtered =
    searchTerm.trim()
      ? ctas.filter(
          (c) =>
            (c.accionable || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.detalles || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.recurso || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      : ctas

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-semibold mb-2">CTA's</h1>
          <p className="text-muted text-lg">Call to Action del Setter</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo CTA
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
      </div>

      {creating && (
        <div className="mb-6 p-4 bg-surface rounded-xl border border-border">
          <h3 className="font-semibold mb-3">Nuevo CTA</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              value={createForm.accionable}
              onChange={(e) => setCreateForm({ ...createForm, accionable: e.target.value })}
              placeholder="Accionable"
              className="px-4 py-2 border border-border rounded-lg bg-background"
            />
            <input
              type="text"
              value={createForm.detalles}
              onChange={(e) => setCreateForm({ ...createForm, detalles: e.target.value })}
              placeholder="Detalles"
              className="px-4 py-2 border border-border rounded-lg bg-background"
            />
            <input
              type="url"
              value={createForm.recurso}
              onChange={(e) => setCreateForm({ ...createForm, recurso: e.target.value })}
              placeholder="Recurso (URL)"
              className="px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveCreate}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover"
            >
              <Check className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={cancelCreate}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated"
            >
              <X className="w-4 h-4" />
              Descartar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
          {searchTerm.trim() ? 'No hay resultados' : 'No hay CTAs. Creá uno nuevo.'}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-elevated">
                <th className="text-left py-3 px-4 font-medium">Accionable</th>
                <th className="text-left py-3 px-4 font-medium">Detalles</th>
                <th className="text-left py-3 px-4 font-medium">Recurso</th>
                <th className="text-right py-3 px-4 font-medium w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cta) => (
                <tr key={cta.id} className="border-b border-border hover:bg-surface-elevated/50">
                  {editingId === cta.id ? (
                    <>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={editForm.accionable}
                          onChange={(e) => setEditForm({ ...editForm, accionable: e.target.value })}
                          className="w-full px-3 py-1.5 border border-border rounded bg-background"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={editForm.detalles}
                          onChange={(e) => setEditForm({ ...editForm, detalles: e.target.value })}
                          className="w-full px-3 py-1.5 border border-border rounded bg-background"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="url"
                          value={editForm.recurso}
                          onChange={(e) => setEditForm({ ...editForm, recurso: e.target.value })}
                          className="w-full px-3 py-1.5 border border-border rounded bg-background"
                        />
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={saveEdit}
                          className="p-2 text-green-600 hover:bg-surface rounded"
                          title="Guardar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={discardEdit}
                          className="p-2 text-muted hover:bg-surface rounded"
                          title="Descartar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4">{cta.accionable || '-'}</td>
                      <td className="py-3 px-4">{cta.detalles || '-'}</td>
                      <td className="py-3 px-4">
                        {cta.recurso ? (
                          <a
                            href={cta.recurso}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline truncate block max-w-[200px]"
                          >
                            {cta.recurso}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => startEdit(cta)}
                          className="p-2 text-muted hover:bg-surface rounded"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cta.id)}
                          className="p-2 text-red-500 hover:bg-surface rounded"
                          title="Borrar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
