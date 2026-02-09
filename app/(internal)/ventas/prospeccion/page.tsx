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
import { GripVertical, Pencil, Plus, Copy, ExternalLink, Check, Edit2, Trash2 } from 'lucide-react'

interface Lead {
  id: number
  nombre: string
  usuario_ig: string | null
  estado: string
  estado_editado_at: string | null
  notas: string | null
  created_at: string
}

const ESTADOS_PIPELINE = [
  { id: 'mensaje_conexion', label: 'Mensaje Conexión', color: 'bg-yellow-500' },
  { id: 'respondio', label: 'Respondió', color: 'bg-blue-500' },
  { id: 'video_enviado', label: 'Video Enviado', color: 'bg-purple-500' },
  { id: 'respuesta_positiva', label: 'Respuesta Positiva', color: 'bg-green-500' },
  { id: 'respuesta_negativa', label: 'Respuesta Negativa', color: 'bg-red-500' },
  { id: 'llamada_agendada', label: 'Llamada Agendada', color: 'bg-indigo-500' },
  { id: 'llamada_reagendada', label: 'Llamada Reagendada', color: 'bg-indigo-400' },
  { id: 'llamada_cancelada', label: 'Llamada Cancelada', color: 'bg-orange-500' },
  { id: 'no_se_presento', label: 'No se Presentó', color: 'bg-red-400' },
  { id: 'no_cualifica', label: 'No Cualifica', color: 'bg-gray-500' },
  { id: 'seña', label: 'Seña', color: 'bg-emerald-500' },
  { id: 'downsell', label: 'Downsell', color: 'bg-teal-500' },
  { id: 'cerrado', label: 'Cerrado', color: 'bg-green-600' },
]

const ESTADOS_CONVERSION = ['seña', 'downsell', 'cerrado']
const ESTADOS_REQUIEREN_LLAMADA = ['llamada_agendada', 'llamada_reagendada']

interface Seguimiento {
  id: number
  nombre: string
  mensaje: string
  delay_horas: number
  activo: boolean
  estados: Array<{ estado: string }>
}

interface SeguimientoDue {
  id: number
  nombre: string
  mensaje: string
  delay_horas: number
  leads: Array<{
    id: number
    nombre: string
    usuario_ig: string | null
    estado: string
    estado_editado_at: string
    horas_desde_edicion: number
  }>
}

interface LeadEditModalProps {
  lead: Lead | null
  onClose: () => void
  onSave: (id: number, data: { usuario_ig: string; notas: string | null }) => Promise<void>
}

function LeadEditModal({ lead, onClose, onSave }: LeadEditModalProps) {
  const [usuarioIg, setUsuarioIg] = useState('')
  const [notas, setNotas] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lead) {
      setUsuarioIg(lead.usuario_ig || '')
      setNotas(lead.notas || '')
    }
  }, [lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lead || !usuarioIg.trim()) {
      setError('Usuario IG es requerido')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onSave(lead.id, {
        usuario_ig: usuarioIg.trim(),
        notas: notas.trim() || null,
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
            <label className="block text-sm font-medium mb-2">Usuario IG *</label>
            <input
              type="text"
              required
              value={usuarioIg}
              onChange={(e) => setUsuarioIg(e.target.value.replace('@', ''))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="ej: carlosvercellone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Notas adicionales sobre el lead..."
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

interface ConversionModalProps {
  lead: Lead | null
  onClose: () => void
  onConvert: (data: { nombre: string; email: string; password: string; telefono?: string }) => Promise<void>
}

interface LlamadaModalProps {
  lead: Lead | null
  prevEstado: string
  newEstado: string
  onClose: () => void
  onConfirm: (fecha: string) => Promise<void>
}

function LlamadaModal({ lead, prevEstado, newEstado, onClose, onConfirm }: LlamadaModalProps) {
  const [fecha, setFecha] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Establecer fecha por defecto: ahora + 1 hora
    const now = new Date()
    now.setHours(now.getHours() + 1)
    setFecha(now.toISOString().slice(0, 16))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fecha) {
      setError('La fecha y hora son requeridas')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onConfirm(fecha)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al crear llamada')
    } finally {
      setSubmitting(false)
    }
  }

  if (!lead) return null

  const estadoLabel = ESTADOS_PIPELINE.find(e => e.id === newEstado)?.label || newEstado

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Agendar Llamada</h2>
        <p className="text-sm text-muted mb-4">
          Moviste el lead <strong>@{lead.usuario_ig || lead.nombre}</strong> a <strong>{estadoLabel}</strong>.
          Completá la fecha y hora de la llamada:
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fecha y Hora *</label>
            <input
              type="datetime-local"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
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
              {submitting ? 'Creando...' : 'Crear Llamada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConversionModal({ lead, onClose, onConvert }: ConversionModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lead) {
      setFormData({
        nombre: lead.nombre || '',
        email: '',
        password: '',
        telefono: '',
      })
    }
  }, [lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await onConvert(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al convertir lead')
    } finally {
      setSubmitting(false)
    }
  }

  if (!lead) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Convertir Lead a Cliente</h2>
        <p className="text-sm text-muted mb-4">
          Para convertir este lead a cliente, completá los siguientes datos:
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre Completo *</label>
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
            <label className="block text-sm font-medium mb-2">Teléfono (opcional)</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
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
              {submitting ? 'Convirtiendo...' : 'Convertir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LeadCard({ lead, onEdit, onDelete }: { lead: Lead; onEdit: (lead: Lead) => void; onDelete: (lead: Lead) => void }) {
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
          <div className="font-medium truncate">
            {lead.usuario_ig ? `@${lead.usuario_ig}` : lead.nombre}
          </div>
          {lead.usuario_ig && lead.nombre !== lead.usuario_ig && (
            <div className="text-sm text-muted truncate">{lead.nombre}</div>
          )}
          <div className="text-xs text-muted mt-1">
            Última edición: {formatFecha(lead.estado_editado_at)}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(lead)
          }}
          className="ml-2 p-1.5 hover:bg-surface rounded transition-colors"
          title="Editar lead"
        >
          <Pencil className="w-4 h-4 text-muted" />
        </button>
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
  )
}

interface SeguimientoModalProps {
  seguimiento: Seguimiento | null
  onClose: () => void
  onSave: (data: { nombre: string; mensaje: string; delay_horas: number; activo: boolean; estados: string[] }) => Promise<void>
}

function SeguimientoModal({ seguimiento, onClose, onSave }: SeguimientoModalProps) {
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [delayHoras, setDelayHoras] = useState(24)
  const [activo, setActivo] = useState(true)
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (seguimiento) {
      setNombre(seguimiento.nombre)
      setMensaje(seguimiento.mensaje)
      setDelayHoras(seguimiento.delay_horas)
      setActivo(seguimiento.activo)
      setEstadosSeleccionados(seguimiento.estados.map(e => e.estado))
    } else {
      setNombre('')
      setMensaje('')
      setDelayHoras(24)
      setActivo(true)
      setEstadosSeleccionados([])
    }
  }, [seguimiento])

  const toggleEstado = (estadoId: string) => {
    setEstadosSeleccionados(prev =>
      prev.includes(estadoId)
        ? prev.filter(e => e !== estadoId)
        : [...prev, estadoId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !mensaje.trim() || estadosSeleccionados.length === 0) {
      setError('Todos los campos son requeridos y debes seleccionar al menos un estado')
      return
    }

    if (delayHoras <= 0) {
      setError('El delay en horas debe ser mayor a 0')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onSave({
        nombre: nombre.trim(),
        mensaje: mensaje.trim(),
        delay_horas: delayHoras,
        activo,
        estados: estadosSeleccionados,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar seguimiento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl p-6 border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {seguimiento ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="ej: Recordatorio 24h Mensaje Conexión"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mensaje *</label>
            <textarea
              required
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Hola, pudiste ver mi mensaje?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Delay (horas) *</label>
            <input
              type="number"
              required
              min="1"
              value={delayHoras}
              onChange={(e) => setDelayHoras(parseInt(e.target.value) || 24)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Estados del Pipeline *</label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border border-border rounded-lg bg-background">
              {ESTADOS_PIPELINE.map((estado) => (
                <label key={estado.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={estadosSeleccionados.includes(estado.id)}
                    onChange={() => toggleEstado(estado.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{estado.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted mt-1">
              Seleccionados: {estadosSeleccionados.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="activo" className="text-sm font-medium cursor-pointer">
              Activo
            </label>
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

function Column({ estado, leads, onEditLead, onDeleteLead }: { estado: { id: string; label: string; color: string }; leads: Lead[]; onEditLead: (lead: Lead) => void; onDeleteLead: (lead: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado.id })

  return (
    <div className="w-[280px] flex-shrink-0">
      <div ref={setNodeRef} className={`bg-surface rounded-xl p-4 border border-border h-full flex flex-col ${isOver ? 'ring-2 ring-accent bg-surface-elevated' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${estado.color}`} />
          <h3 className="text-lg font-semibold">{estado.label}</h3>
          <span className="ml-auto text-sm text-muted bg-surface-elevated px-2 py-1 rounded">
            {leads.length}
          </span>
        </div>
        <SortableContext items={leads.map(l => l.id.toString())} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 flex-1 overflow-y-auto min-h-[200px]">
            {leads.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Sin leads</p>
            ) : (
              leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onEdit={onEditLead} onDelete={onDeleteLead} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export default function ProspeccionPage() {
  const [vistaActiva, setVistaActiva] = useState<'pipeline' | 'seguimientos'>('pipeline')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [usuarioIg, setUsuarioIg] = useState('')
  const [notas, setNotas] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [conversionLead, setConversionLead] = useState<Lead | null>(null)
  const [llamadaModal, setLlamadaModal] = useState<{
    lead: Lead
    prevEstado: string
    newEstado: string
  } | null>(null)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  
  // Estados para seguimientos
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [seguimientosDue, setSeguimientosDue] = useState<SeguimientoDue[]>([])
  const [loadingSeguimientos, setLoadingSeguimientos] = useState(false)
  const [seguimientoModal, setSeguimientoModal] = useState<Seguimiento | null>(null)
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchLeads()
    if (vistaActiva === 'seguimientos') {
      fetchSeguimientos()
      fetchSeguimientosDue()
    }
  }, [vistaActiva])

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
    if (!usuarioIg.trim()) return

    try {
      const response = await fetch('/api/ventas/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_ig: usuarioIg.trim(),
          notas: notas.trim() || null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setUsuarioIg('')
        setNotas('')
        fetchLeads()
      }
    } catch (error) {
      console.error('Error al crear lead:', error)
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

    // Encontrar el lead actual
    const lead = leads.find(l => l.id.toString() === leadId)
    if (!lead || lead.estado === newEstado) return

    const prevEstado = lead.estado

    // Si requiere llamada, abrir modal primero (sin actualizar estado todavía)
    if (ESTADOS_REQUIEREN_LLAMADA.includes(newEstado)) {
      setLlamadaModal({ lead, prevEstado, newEstado })
      return
    }

    // Actualización optimista
    const updatedLeads = leads.map(l =>
      l.id.toString() === leadId
        ? { ...l, estado: newEstado, estado_editado_at: new Date().toISOString() }
        : l
    )
    setLeads(updatedLeads)

    try {
      const response = await fetch(`/api/ventas/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      })

      const result = await response.json()

      if (response.ok) {
        // Si requiere conversión, abrir modal
        if (result.requiresConversion && ESTADOS_CONVERSION.includes(newEstado)) {
          setConversionLead(result)
        } else {
          // Refrescar para obtener datos actualizados
          fetchLeads()
        }
      } else {
        // Revertir en caso de error
        fetchLeads()
      }
    } catch (error) {
      console.error('Error al actualizar lead:', error)
      // Revertir en caso de error
      fetchLeads()
    }
  }

  const handleLlamadaCancel = () => {
    // Cerrar modal sin hacer cambios
    setLlamadaModal(null)
  }

  const handleLlamadaConfirm = async (fecha: string) => {
    if (!llamadaModal) return

    const { lead, prevEstado, newEstado } = llamadaModal

    // Actualización optimista
    const updatedLeads = leads.map(l =>
      l.id === lead.id
        ? { ...l, estado: newEstado, estado_editado_at: new Date().toISOString() }
        : l
    )
    setLeads(updatedLeads)

    try {
      // 1. Actualizar estado del lead
      const patchResponse = await fetch(`/api/ventas/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      })

      if (!patchResponse.ok) {
        throw new Error('Error al actualizar estado del lead')
      }

      // 2. Crear registro en llamadas
      const llamadaResponse = await fetch('/api/ventas/llamadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          fecha: fecha,
        }),
      })

      if (!llamadaResponse.ok) {
        // Rollback: revertir estado del lead
        await fetch(`/api/ventas/leads/${lead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: prevEstado }),
        })
        throw new Error('Error al crear llamada')
      }

      // Todo bien, cerrar modal y refrescar
      setLlamadaModal(null)
      fetchLeads()
    } catch (error: any) {
      console.error('Error al crear llamada:', error)
      // Revertir UI
      fetchLeads()
      throw error
    }
  }

  const handleEditLead = async (id: number, data: { usuario_ig: string; notas: string | null }) => {
    const response = await fetch(`/api/ventas/leads/${id}`, {
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
      const response = await fetch(`/api/ventas/leads/${lead.id}`, { method: 'DELETE' })

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

  const handleConvert = async (data: { nombre: string; email: string; password: string; telefono?: string }) => {
    if (!conversionLead) return

    const response = await fetch(`/api/ventas/leads/${conversionLead.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al convertir lead')
    }

    // Remover el lead del pipeline y refrescar
    setConversionLead(null)
    fetchLeads()
  }

  // Funciones para seguimientos
  const fetchSeguimientos = async () => {
    setLoadingSeguimientos(true)
    try {
      const response = await fetch('/api/ventas/seguimientos')
      if (!response.ok) {
        console.error('Error al cargar seguimientos:', response.statusText)
        setSeguimientos([])
        return
      }
      const data = await response.json()
      // Asegurar que siempre sea un array
      setSeguimientos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar seguimientos:', error)
      setSeguimientos([])
    } finally {
      setLoadingSeguimientos(false)
    }
  }

  const fetchSeguimientosDue = async () => {
    try {
      const response = await fetch('/api/ventas/seguimientos/due')
      if (!response.ok) {
        console.error('Error al cargar seguimientos pendientes:', response.statusText)
        setSeguimientosDue([])
        return
      }
      const data = await response.json()
      // Asegurar que siempre sea un array
      setSeguimientosDue(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar seguimientos pendientes:', error)
      setSeguimientosDue([])
    }
  }

  const handleSaveSeguimiento = async (data: { nombre: string; mensaje: string; delay_horas: number; activo: boolean; estados: string[] }) => {
    if (seguimientoModal !== null) {
      // Editar
      const response = await fetch(`/api/ventas/seguimientos/${seguimientoModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar seguimiento')
      }
    } else {
      // Crear
      const response = await fetch('/api/ventas/seguimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear seguimiento')
      }
    }
    setShowSeguimientoModal(false)
    setSeguimientoModal(null)
    await fetchSeguimientos()
    await fetchSeguimientosDue()
  }

  const handleDeleteSeguimiento = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este seguimiento?')) return
    
    const response = await fetch(`/api/ventas/seguimientos/${id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      await fetchSeguimientos()
      await fetchSeguimientosDue()
    }
  }

  const handleMarkSent = async (seguimientoId: number, leadId: number, estadoEditadoAt: string) => {
    try {
      // El backend ahora usa el estado_editado_at real de la DB, no necesitamos enviar snapshot
      const response = await fetch('/api/ventas/seguimientos/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seguimiento_id: seguimientoId,
          lead_id: leadId,
        }),
      })
      
      if (response.ok) {
        // Refrescar inmediatamente la lista de seguimientos pendientes
        await fetchSeguimientosDue()
        // Mostrar mensaje de éxito
        alert('Seguimiento marcado como enviado')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'No se pudo marcar como enviado'}`)
      }
    } catch (error: any) {
      console.error('Error al marcar seguimiento como enviado:', error)
      alert(`Error: ${error.message || 'No se pudo marcar como enviado'}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Mensaje copiado al portapapeles')
  }

  const openInstagram = (usuarioIg: string | null) => {
    if (!usuarioIg) return
    window.open(`https://instagram.com/${usuarioIg}`, '_blank')
  }

  const leadsByEstado = ESTADOS_PIPELINE.reduce((acc, estado) => {
    acc[estado.id] = leads.filter(l => l.estado === estado.id)
    return acc
  }, {} as Record<string, Lead[]>)

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Pipeline de Leads</h1>
          <p className="text-muted text-lg">Gestión de prospección y procedimientos estandarizados</p>
        </div>
        {vistaActiva === 'pipeline' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            {showForm ? 'Cancelar' : '+ Nuevo Lead'}
          </button>
        )}
      </div>

      {/* Tabs Pipeline / Seguimientos */}
      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setVistaActiva('pipeline')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'pipeline'
              ? 'border-b-2 border-accent text-accent'
              : 'text-muted hover:text-foreground'
          }`}
        >
          Pipeline
        </button>
        <button
          onClick={() => setVistaActiva('seguimientos')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'seguimientos'
              ? 'border-b-2 border-accent text-accent'
              : 'text-muted hover:text-foreground'
          }`}
        >
          Seguimientos
        </button>
      </div>

      {/* Vista Pipeline */}
      {vistaActiva === 'pipeline' && (
        <>

      {showForm && (
        <div className="mb-8 bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Nuevo Lead</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Usuario IG *</label>
              <input
                type="text"
                required
                value={usuarioIg}
                onChange={(e) => setUsuarioIg(e.target.value.replace('@', ''))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                placeholder="ej: carlosvercellone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                placeholder="Notas adicionales sobre el lead..."
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
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="p-3 bg-surface-elevated rounded-lg border border-border shadow-lg">
                {leads.find(l => l.id.toString() === activeId)?.usuario_ig || 'Lead'}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {conversionLead && (
        <ConversionModal
          lead={conversionLead}
          onClose={() => setConversionLead(null)}
          onConvert={handleConvert}
        />
      )}

      {llamadaModal && (
        <LlamadaModal
          lead={llamadaModal.lead}
          prevEstado={llamadaModal.prevEstado}
          newEstado={llamadaModal.newEstado}
          onClose={handleLlamadaCancel}
          onConfirm={handleLlamadaConfirm}
        />
      )}

      {editLead && (
        <LeadEditModal
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSave={handleEditLead}
        />
      )}
        </>
      )}

      {/* Vista Seguimientos */}
      {vistaActiva === 'seguimientos' && (
        <div className="space-y-8">
          {/* Listado de seguimientos configurados */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Seguimientos Configurados</h2>
              <button
                onClick={() => {
                  setSeguimientoModal(null)
                  setShowSeguimientoModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Seguimiento
              </button>
            </div>

            {loadingSeguimientos ? (
              <div className="text-center py-12 text-muted">Cargando...</div>
            ) : seguimientos.length === 0 ? (
              <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
                No hay seguimientos configurados. Crea uno para empezar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {seguimientos.map((seguimiento) => (
                  <div
                    key={seguimiento.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{seguimiento.nombre}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSeguimientoModal(seguimiento)
                            setShowSeguimientoModal(true)
                          }}
                          className="p-1.5 hover:bg-surface-elevated rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          onClick={() => handleDeleteSeguimiento(seguimiento.id)}
                          className="p-1.5 hover:bg-surface-elevated rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted mb-2">{seguimiento.mensaje}</p>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>Delay: {seguimiento.delay_horas}h</span>
                      <span className={`px-2 py-1 rounded ${seguimiento.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {seguimiento.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      Estados: {seguimiento.estados.map(e => ESTADOS_PIPELINE.find(s => s.id === e.estado)?.label || e.estado).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Panel de Pendientes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Pendientes</h2>
            {seguimientosDue.length === 0 ? (
              <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
                No hay seguimientos pendientes en este momento.
              </div>
            ) : (
              <div className="space-y-6">
                {seguimientosDue.map((seguimientoDue) => (
                  <div key={seguimientoDue.id} className="bg-surface rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold mb-2">{seguimientoDue.nombre}</h3>
                    <p className="text-sm text-muted mb-4">{seguimientoDue.mensaje}</p>
                    <div className="space-y-3">
                      {seguimientoDue.leads.map((lead) => {
                        const estadoLabel = ESTADOS_PIPELINE.find(e => e.id === lead.estado)?.label || lead.estado
                        return (
                          <div
                            key={lead.id}
                            className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                @{lead.usuario_ig || lead.nombre}
                              </div>
                              <div className="text-sm text-muted">
                                Estado: {estadoLabel} • Hace {lead.horas_desde_edicion}h
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(seguimientoDue.mensaje)}
                                className="p-2 hover:bg-surface-elevated rounded transition-colors"
                                title="Copiar mensaje"
                              >
                                <Copy className="w-4 h-4 text-muted" />
                              </button>
                              <button
                                onClick={() => openInstagram(lead.usuario_ig)}
                                className="p-2 hover:bg-surface-elevated rounded transition-colors"
                                title="Abrir Instagram"
                              >
                                <ExternalLink className="w-4 h-4 text-muted" />
                              </button>
                              <button
                                onClick={() => handleMarkSent(seguimientoDue.id, lead.id, lead.estado_editado_at)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                              >
                                <Check className="w-4 h-4" />
                                Enviado
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal de Seguimiento */}
      {showSeguimientoModal && (
        <SeguimientoModal
          seguimiento={seguimientoModal}
          onClose={() => {
            setShowSeguimientoModal(false)
            setSeguimientoModal(null)
          }}
          onSave={handleSaveSeguimiento}
        />
      )}
    </div>
  )
}
