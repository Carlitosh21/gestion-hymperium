'use client'

import { useState, useEffect } from 'react'

export interface Lead {
  id: number
  manychat_id: string | null
  nombre: string | null
  username: string | null
  estado: string
  ultima_interaccion: string | null
  created_at: string
}

interface LeadEditModalProps {
  lead: Lead | null
  onClose: () => void
  onSave: (id: number, data: { nombre: string; username: string }) => Promise<void>
}

export function LeadEditModal({ lead, onClose, onSave }: LeadEditModalProps) {
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lead) {
      setNombre(lead.nombre || '')
      setUsername(lead.username || '')
    }
  }, [lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lead) return

    setError(null)
    setSubmitting(true)

    try {
      await onSave(lead.id, {
        nombre: nombre.trim(),
        username: username.trim().replace('@', ''),
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar lead')
    } finally {
      setSubmitting(false)
    }
  }

  if (!lead) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Editar Lead</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg border border-red-500/30 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Nombre del lead"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace('@', ''))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="ej: carlosvercellone"
            />
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
