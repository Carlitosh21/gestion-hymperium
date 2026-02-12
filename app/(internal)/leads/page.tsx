'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Search, ExternalLink, UserPlus } from 'lucide-react'

interface Lead {
  id: number
  manychat_id: string | null
  nombre: string | null
  username: string | null
  estado: string
  ultima_interaccion: string | null
  created_at: string
}

const ESTADOS_PIPELINE = [
  { id: 'En Conversacion', label: 'En Conversacion', color: 'bg-yellow-500' },
  { id: 'Link Enviado', label: 'Link Enviado', color: 'bg-blue-500' },
  { id: 'Vendido', label: 'Vendido', color: 'bg-green-500' },
  { id: 'Derivado', label: 'Derivado', color: 'bg-gray-500' },
]

interface LeadEditModalProps {
  lead: Lead | null
  onClose: () => void
  onSave: (id: number, data: { nombre: string; username: string }) => Promise<void>
}

function LeadEditModal({ lead, onClose, onSave }: LeadEditModalProps) {
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
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
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

function LeadCard({
  lead,
  onEdit,
  onDelete,
  onDerivar,
  onOpenInstagram,
}: {
  lead: Lead
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
  onDerivar: (lead: Lead) => void
  onOpenInstagram: (username: string | null) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const displayName = lead.username ? `@${lead.username}` : lead.nombre || 'Sin nombre'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-surface-elevated rounded-lg border border-border hover:bg-surface transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{displayName}</div>
          {lead.username && lead.nombre && lead.nombre !== lead.username && (
            <div className="text-sm text-muted truncate">{lead.nombre}</div>
          )}
          <div className="text-xs text-muted mt-1">
            Última interacción: {formatFecha(lead.ultima_interaccion)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (lead.username) onOpenInstagram(lead.username)
            }}
            disabled={!lead.username}
            className="p-1.5 hover:bg-surface rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={lead.username ? 'Abrir perfil de Instagram' : 'Sin usuario'}
          >
            <ExternalLink className="w-4 h-4 text-muted" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(lead)
            }}
            className="p-1.5 hover:bg-surface rounded transition-colors"
            title="Editar lead"
          >
            <Pencil className="w-4 h-4 text-muted" />
          </button>
          {lead.manychat_id && lead.estado !== 'Derivado' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDerivar(lead)
              }}
              className="p-1.5 hover:bg-surface rounded transition-colors"
              title="Derivar"
            >
              <UserPlus className="w-4 h-4 text-muted" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(lead)
            }}
            className="p-1.5 hover:bg-surface rounded transition-colors"
            title="Borrar lead"
          >
            <Trash2 className="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Column({
  estado,
  leads,
  onEditLead,
  onDeleteLead,
  onDerivar,
  onOpenInstagram,
}: {
  estado: { id: string; label: string; color: string }
  leads: Lead[]
  onEditLead: (lead: Lead) => void
  onDeleteLead: (lead: Lead) => void
  onDerivar: (lead: Lead) => void
  onOpenInstagram: (username: string | null) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado.id })

  return (
    <div className="w-[280px] flex-shrink-0">
      <div
        ref={setNodeRef}
        className={`bg-surface rounded-xl p-4 border border-border h-full flex flex-col ${isOver ? 'ring-2 ring-accent bg-surface-elevated' : ''}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${estado.color}`} />
          <h3 className="text-lg font-semibold">{estado.label}</h3>
          <span className="ml-auto text-sm text-muted bg-surface-elevated px-2 py-1 rounded">
            {leads.length}
          </span>
        </div>
        <SortableContext items={leads.map((l) => l.id.toString())} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 flex-1 overflow-y-auto min-h-[200px]">
            {leads.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Sin leads</p>
            ) : (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={onEditLead}
                  onDelete={onDeleteLead}
                  onDerivar={onDerivar}
                  onOpenInstagram={onOpenInstagram}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      const data = await response.json()
      setLeads(data)
    } catch (error) {
      console.error('Error al cargar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const leadId = active.id as string
    const newEstado = over.id as string

    const lead = leads.find((l) => l.id.toString() === leadId)
    if (!lead || lead.estado === newEstado) return

    const updatedLeads = leads.map((l) =>
      l.id.toString() === leadId ? { ...l, estado: newEstado } : l
    )
    setLeads(updatedLeads)

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      })

      if (!response.ok) {
        fetchLeads()
      }
    } catch (error) {
      console.error('Error al actualizar lead:', error)
      fetchLeads()
    }
  }

  const handleEditLead = async (id: number, data: { nombre: string; username: string }) => {
    const response = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al guardar lead')
    }

    fetchLeads()
  }

  const handleDeleteLead = async (lead: Lead) => {
    if (!confirm('¿Borrar este lead? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al borrar lead')
      }

      setEditLead(null)
      fetchLeads()
    } catch (error: any) {
      alert(error.message || 'Error al borrar lead')
    }
  }

  const handleDerivar = async (lead: Lead) => {
    if (!lead.manychat_id) {
      alert('Lead sin manychat_id, no se puede derivar')
      return
    }

    try {
      const response = await fetch('/api/leads/derivar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manychat_id: lead.manychat_id }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.reply ?? 'Lead derivado ✅')
        fetchLeads()
      } else {
        throw new Error(data.error || 'Error al derivar')
      }
    } catch (error: any) {
      alert(error.message || 'Error al derivar lead')
    }
  }

  const openInstagram = (username: string | null) => {
    if (!username) return
    window.open(`https://instagram.com/${username}`, '_blank')
  }

  const filteredLeads = searchTerm.trim()
    ? leads.filter((l) => {
        const u = (l.username || '').toLowerCase()
        const n = (l.nombre || '').toLowerCase()
        const q = searchTerm.trim().toLowerCase()
        return u.includes(q) || n.includes(q)
      })
    : leads

  const leadsByEstado = ESTADOS_PIPELINE.reduce((acc, estado) => {
    acc[estado.id] = filteredLeads.filter((l) => l.estado === estado.id)
    return acc
  }, {} as Record<string, Lead[]>)

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Pipeline de Leads</h1>
          <p className="text-muted text-lg">Gestión de leads con estados del pipeline</p>
        </div>
      </div>

      {!loading && (
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por @usuario o nombre..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="w-full overflow-x-auto overflow-y-visible pb-4" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {ESTADOS_PIPELINE.map((estado) => (
                <Column
                  key={estado.id}
                  estado={estado}
                  leads={leadsByEstado[estado.id] || []}
                  onEditLead={setEditLead}
                  onDeleteLead={handleDeleteLead}
                  onDerivar={handleDerivar}
                  onOpenInstagram={openInstagram}
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="p-3 bg-surface-elevated rounded-lg border border-border shadow-lg">
                {leads.find((l) => l.id.toString() === activeId)?.username
                  ? `@${leads.find((l) => l.id.toString() === activeId)?.username}`
                  : leads.find((l) => l.id.toString() === activeId)?.nombre || 'Lead'}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {editLead && (
        <LeadEditModal
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSave={handleEditLead}
        />
      )}
    </div>
  )
}
