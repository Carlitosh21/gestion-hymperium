'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Copy, ArrowLeft } from 'lucide-react'

interface PreguntaOnboarding {
  id: number
  titulo: string | null
  descripcion: string | null
  pregunta: string
  tipo: string
  opciones: any
  orden: number
  activa: boolean
}

interface PreguntaModalProps {
  pregunta: PreguntaOnboarding | null
  onClose: () => void
  onSave: (data: {
    titulo: string
    descripcion: string
    tipo: string
    opciones: string[] | null
    orden: number
  }) => Promise<void>
}

function PreguntaModal({ pregunta, onClose, onSave }: PreguntaModalProps) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState('texto')
  const [opciones, setOpciones] = useState('')
  const [orden, setOrden] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pregunta) {
      setTitulo(pregunta.titulo || pregunta.pregunta || '')
      setDescripcion(pregunta.descripcion || '')
      setTipo(pregunta.tipo || 'texto')
      setOrden(pregunta.orden || 0)
      if (pregunta.opciones) {
        const opts = typeof pregunta.opciones === 'string' 
          ? JSON.parse(pregunta.opciones) 
          : pregunta.opciones
        setOpciones(Array.isArray(opts) ? opts.join(', ') : '')
      } else {
        setOpciones('')
      }
    } else {
      setTitulo('')
      setDescripcion('')
      setTipo('texto')
      setOpciones('')
      setOrden(0)
    }
  }, [pregunta])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('Título es requerido')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const opcionesArray = tipo === 'opcion_multiple' && opciones.trim()
        ? opciones.split(',').map(o => o.trim()).filter(o => o)
        : null

      await onSave({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || '',
        tipo,
        opciones: opcionesArray,
        orden,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar pregunta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl p-6 border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {pregunta ? 'Editar Pregunta' : 'Nueva Pregunta'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título *</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="ej: ¿Cuál es tu objetivo principal?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Descripción adicional o ayuda contextual..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              >
                <option value="texto">Texto</option>
                <option value="numero">Número</option>
                <option value="opcion_multiple">Opción Múltiple</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Orden</label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
          </div>

          {tipo === 'opcion_multiple' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Opciones (separadas por comas) *
              </label>
              <input
                type="text"
                required={tipo === 'opcion_multiple'}
                value={opciones}
                onChange={(e) => setOpciones(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                placeholder="Opción 1, Opción 2, Opción 3"
              />
            </div>
          )}

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

export default function OnboardingAdminPage() {
  const [preguntas, setPreguntas] = useState<PreguntaOnboarding[]>([])
  const [loading, setLoading] = useState(true)
  const [preguntaModal, setPreguntaModal] = useState<PreguntaOnboarding | null>(null)
  const [showPreguntaModal, setShowPreguntaModal] = useState(false)

  useEffect(() => {
    fetchPreguntas()
  }, [])

  const fetchPreguntas = async () => {
    try {
      // Obtener todas las preguntas (activas e inactivas) con ?all=true
      const response = await fetch('/api/onboarding/preguntas?all=true')
      const data = await response.json()
      setPreguntas(data)
    } catch (error) {
      console.error('Error al cargar preguntas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePregunta = async (data: {
    titulo: string
    descripcion: string
    tipo: string
    opciones: string[] | null
    orden: number
  }) => {
    if (preguntaModal) {
      // Editar
      const response = await fetch(`/api/onboarding/preguntas/${preguntaModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar pregunta')
      }
    } else {
      // Crear
      const response = await fetch('/api/onboarding/preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear pregunta')
      }
    }
    setShowPreguntaModal(false)
    setPreguntaModal(null)
    await fetchPreguntas()
  }

  const handleToggleActiva = async (id: number, activa: boolean) => {
    try {
      await fetch(`/api/onboarding/preguntas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !activa }),
      })
      await fetchPreguntas()
    } catch (error) {
      console.error('Error al actualizar pregunta:', error)
    }
  }

  const handleDeletePregunta = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return

    try {
      await fetch(`/api/onboarding/preguntas/${id}`, {
        method: 'DELETE',
      })
      await fetchPreguntas()
    } catch (error) {
      console.error('Error al eliminar pregunta:', error)
    }
  }

  const copyUrlPublica = () => {
    const url = `${window.location.origin}/onboarding`
    navigator.clipboard.writeText(url)
    alert('URL pública copiada al portapapeles')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/clientes"
              className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl font-semibold">Gestión de Formulario de Onboarding</h1>
          </div>
          <p className="text-muted text-lg">
            Gestiona las preguntas del formulario de onboarding
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
          <button
            onClick={() => {
              setPreguntaModal(null)
              setShowPreguntaModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Pregunta
          </button>
        </div>
      </div>

      {/* Listado de preguntas */}
      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : preguntas.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
          No hay preguntas. Agrega la primera pregunta usando el botón superior.
        </div>
      ) : (
        <div className="space-y-4">
          {preguntas.map((pregunta) => (
            <div
              key={pregunta.id}
              className="bg-surface rounded-xl p-6 border border-border"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">
                    {pregunta.titulo || pregunta.pregunta}
                  </h4>
                  {pregunta.descripcion && (
                    <p className="text-sm text-muted mb-2">{pregunta.descripcion}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>Tipo: {pregunta.tipo}</span>
                    <span>Orden: {pregunta.orden}</span>
                    {pregunta.opciones && (
                      <span>
                        Opciones:{' '}
                        {(typeof pregunta.opciones === 'string'
                          ? JSON.parse(pregunta.opciones)
                          : pregunta.opciones
                        ).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPreguntaModal(pregunta)
                      setShowPreguntaModal(true)
                    }}
                    className="p-2 hover:bg-surface-elevated rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => handleToggleActiva(pregunta.id, pregunta.activa)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      pregunta.activa
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {pregunta.activa ? 'Activa' : 'Inactiva'}
                  </button>
                  <button
                    onClick={() => handleDeletePregunta(pregunta.id)}
                    className="p-2 hover:bg-surface-elevated rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Pregunta */}
      {showPreguntaModal && (
        <PreguntaModal
          pregunta={preguntaModal}
          onClose={() => {
            setShowPreguntaModal(false)
            setPreguntaModal(null)
          }}
          onSave={handleSavePregunta}
        />
      )}
    </div>
  )
}
