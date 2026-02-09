'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const RESULTADO_OPTIONS = ['No-Show', 'Canceló', 'Reagendó', 'Show-up', 'Otro'] as const

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

interface CalendarViewProps {
  llamadas: Llamada[]
  viewMode: 'mes' | 'semana'
  onEditLlamada: (llamada: Llamada) => void
}

function CalendarView({ llamadas, viewMode, onEditLlamada }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Lunes = 0

    const days: (Date | null)[] = []
    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getWeekDays = (date: Date) => {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // Lunes
    weekStart.setDate(diff)
    
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      days.push(d)
    }
    return days
  }

  const getLlamadasForDate = (date: Date | null) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return llamadas.filter(ll => {
      const llamadaDate = new Date(ll.fecha).toISOString().split('T')[0]
      return llamadaDate === dateStr
    })
  }

  const formatTime = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const prevPeriod = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'mes') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const nextPeriod = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'mes') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="bg-surface rounded-xl border border-border">
      <div className="p-6 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={prevPeriod}
            className="p-2 hover:bg-surface-elevated rounded transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {viewMode === 'mes'
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Semana del ${getWeekDays(currentDate)[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
          </h2>
          <button
            onClick={nextPeriod}
            className="p-2 hover:bg-surface-elevated rounded transition-colors"
          >
            →
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-elevated transition-colors"
        >
          Hoy
        </button>
      </div>

      {viewMode === 'mes' ? (
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth(currentDate).map((date, idx) => {
              const llamadasDelDia = getLlamadasForDate(date)
              const isToday = date && date.getTime() === today.getTime()
              const isCurrentMonth = date && date.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border border-border rounded-lg p-2 ${
                    isToday ? 'bg-accent/10 border-accent' : 'bg-surface-elevated'
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-accent' : ''}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {llamadasDelDia.map((ll) => (
                          <div
                            key={ll.id}
                            onClick={() => onEditLlamada(ll)}
                            className="text-xs bg-accent/20 hover:bg-accent/30 rounded p-1 cursor-pointer truncate"
                            title={`${formatTime(ll.fecha)} - ${ll.lead_nombre || ll.cliente_nombre || 'Sin nombre'}`}
                          >
                            <div className="font-medium">{formatTime(ll.fecha)}</div>
                            <div className="truncate">{ll.lead_nombre || ll.cliente_nombre || 'Sin nombre'}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {getWeekDays(currentDate).map((date) => {
              const llamadasDelDia = getLlamadasForDate(date)
              const isToday = date.getTime() === today.getTime()

              return (
                <div key={date.toISOString()} className="min-h-[400px]">
                  <div className={`text-center mb-3 pb-2 border-b border-border ${isToday ? 'text-accent font-semibold' : ''}`}>
                    <div className="text-sm text-muted">{dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]}</div>
                    <div className="text-lg">{date.getDate()}</div>
                  </div>
                  <div className="space-y-2">
                    {llamadasDelDia
                      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                      .map((ll) => (
                        <div
                          key={ll.id}
                          onClick={() => onEditLlamada(ll)}
                          className="bg-surface-elevated border border-border rounded-lg p-3 cursor-pointer hover:bg-surface transition-colors"
                        >
                          <div className="text-sm font-medium text-accent mb-1">
                            {formatTime(ll.fecha)}
                          </div>
                          <div className="font-medium text-sm mb-1">
                            {ll.lead_nombre || ll.cliente_nombre || 'Sin nombre'}
                          </div>
                          {ll.resultado && (
                            <div className="text-xs text-muted truncate">{ll.resultado}</div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
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
    link_grabacion: '',
    notas: '',
    resultado: '',
    origen: 'prospeccion', // 'prospeccion' o 'contenido'
  })
  const [editingLlamada, setEditingLlamada] = useState<Llamada | null>(null)
  const [viewMode, setViewMode] = useState<'lista' | 'mes' | 'semana'>('lista')

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

  const handleEditLlamada = (llamada: Llamada) => {
    setEditingLlamada(llamada)
  }

  const handleSaveEdit = async (data: { fecha: string; link_grabacion: string; notas: string; resultado: string }) => {
    if (!editingLlamada) return

    try {
      const response = await fetch(`/api/ventas/llamadas/${editingLlamada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: data.fecha,
          link_grabacion: data.link_grabacion || null,
          notas: data.notas || null,
          resultado: data.resultado || null,
        }),
      })

      if (response.ok) {
        setEditingLlamada(null)
        fetchLlamadas()
      }
    } catch (error) {
      console.error('Error al editar llamada:', error)
    }
  }

  const handleDeleteLlamada = async (llamada: Llamada) => {
    if (!confirm('¿Borrar esta llamada? Esta acción no se puede deshacer.')) return
    try {
      const response = await fetch(`/api/ventas/llamadas/${llamada.id}`, { method: 'DELETE' })
      if (response.ok) {
        setEditingLlamada(null)
        fetchLlamadas()
      } else {
        const err = await response.json()
        alert(err.error || 'Error al borrar')
      }
    } catch (error) {
      console.error('Error al borrar llamada:', error)
      alert('Error al borrar llamada')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Llamadas</h1>
          <p className="text-muted text-lg">Gestión de llamadas y vinculación con leads</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-surface-elevated rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode('lista')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'lista'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('mes')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'mes'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'semana'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Semana
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Nueva Llamada'}
          </button>
        </div>
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
      ) : viewMode === 'lista' ? (
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
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditLlamada(llamada)}
                    className="p-2 hover:bg-surface-elevated rounded transition-colors"
                    title="Editar llamada"
                  >
                    <Pencil className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLlamada(llamada)
                    }}
                    className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-500"
                    title="Borrar llamada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
      ) : viewMode === 'mes' ? (
        <CalendarView
          llamadas={llamadas}
          viewMode="mes"
          onEditLlamada={handleEditLlamada}
        />
      ) : (
        <CalendarView
          llamadas={llamadas}
          viewMode="semana"
          onEditLlamada={handleEditLlamada}
        />
      )}

      {editingLlamada && (
        <LlamadaEditModal
          llamada={editingLlamada}
          onClose={() => setEditingLlamada(null)}
          onSave={handleSaveEdit}
          onDelete={() => handleDeleteLlamada(editingLlamada)}
        />
      )}
    </div>
  )
}

interface LlamadaEditModalProps {
  llamada: Llamada
  onClose: () => void
  onSave: (data: { fecha: string; link_grabacion: string; notas: string; resultado: string }) => Promise<void>
  onDelete: () => void
}

function LlamadaEditModal({ llamada, onClose, onSave, onDelete }: LlamadaEditModalProps) {
  const [fecha, setFecha] = useState('')
  const [linkGrabacion, setLinkGrabacion] = useState('')
  const [notas, setNotas] = useState('')
  const [resultadoSelect, setResultadoSelect] = useState<string>('')
  const [resultadoOtro, setResultadoOtro] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fechaLocal = new Date(llamada.fecha)
    fechaLocal.setMinutes(fechaLocal.getMinutes() - fechaLocal.getTimezoneOffset())
    setFecha(fechaLocal.toISOString().slice(0, 16))
    setLinkGrabacion(llamada.link_grabacion || '')
    setNotas(llamada.notas || '')
    const r = llamada.resultado || ''
    const isPredef = RESULTADO_OPTIONS.slice(0, -1).includes(r as any)
    setResultadoSelect(isPredef ? r : 'Otro')
    setResultadoOtro(isPredef ? '' : r)
  }, [llamada])

  const resultadoFinal = resultadoSelect === 'Otro' ? resultadoOtro : resultadoSelect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fecha) {
      setError('La fecha y hora son requeridas')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onSave({
        fecha,
        link_grabacion: linkGrabacion,
        notas,
        resultado: resultadoFinal || '',
      })
    } catch (err: any) {
      setError(err.message || 'Error al guardar llamada')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Editar Llamada</h2>

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
          <div>
            <label className="block text-sm font-medium mb-2">Link de Grabación</label>
            <input
              type="url"
              value={linkGrabacion}
              onChange={(e) => setLinkGrabacion(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Resultado</label>
            <select
              value={resultadoSelect}
              onChange={(e) => setResultadoSelect(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            >
              {RESULTADO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {resultadoSelect === 'Otro' && (
              <input
                type="text"
                value={resultadoOtro}
                onChange={(e) => setResultadoOtro(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background mt-2"
                placeholder="Descripción..."
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
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
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Borrar esta llamada? Esta acción no se puede deshacer.')) onDelete()
            }}
            className="w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Borrar llamada
          </button>
        </form>
      </div>
    </div>
  )
}
