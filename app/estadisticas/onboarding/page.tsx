'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Pregunta {
  id: number
  pregunta: string
  tipo: string
  opciones: any
  orden: number
  activa: boolean
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente')
  const modoPublico = !clienteId

  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    pregunta: '',
    tipo: 'texto',
    opciones: '',
    orden: 0,
  })
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('')
  const [showPublicForm, setShowPublicForm] = useState(modoPublico)

  useEffect(() => {
    fetchPreguntas()
  }, [])

  const fetchPreguntas = async () => {
    try {
      const response = await fetch('/api/estadisticas/onboarding/preguntas')
      const data = await response.json()
      setPreguntas(data)
    } catch (error) {
      console.error('Error al cargar preguntas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPregunta = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const opciones = formData.opciones
        ? formData.opciones.split(',').map((o) => o.trim())
        : null

      const response = await fetch('/api/estadisticas/onboarding/preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          opciones: opciones,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ pregunta: '', tipo: 'texto', opciones: '', orden: 0 })
        fetchPreguntas()
      }
    } catch (error) {
      console.error('Error al crear pregunta:', error)
    }
  }

  const handleToggleActiva = async (id: number, activa: boolean) => {
    try {
      await fetch(`/api/estadisticas/onboarding/preguntas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !activa }),
      })
      fetchPreguntas()
    } catch (error) {
      console.error('Error al actualizar pregunta:', error)
    }
  }

  const handleDeletePregunta = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return

    try {
      await fetch(`/api/estadisticas/onboarding/preguntas/${id}`, {
        method: 'DELETE',
      })
      fetchPreguntas()
    } catch (error) {
      console.error('Error al eliminar pregunta:', error)
    }
  }

  const handleSubmitFormulario = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!numeroIdentificacion && modoPublico) {
      alert('Debes ingresar tu número de identificación')
      return
    }

    try {
      const respuestasArray = Object.entries(respuestas).map(([pregunta_id, respuesta]) => ({
        pregunta_id: parseInt(pregunta_id),
        respuesta: respuesta.toString(),
      }))

      const response = await fetch('/api/estadisticas/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_identificacion: numeroIdentificacion,
          respuestas: respuestasArray,
        }),
      })

      if (response.ok) {
        alert('Formulario enviado correctamente')
        setRespuestas({})
        setNumeroIdentificacion('')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al enviar formulario')
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error)
      alert('Error al enviar formulario')
    }
  }

  if (modoPublico && !showPublicForm) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-surface rounded-xl p-8 border border-border text-center">
          <h1 className="text-3xl font-semibold mb-4">Formulario de Onboarding</h1>
          <p className="text-muted mb-6">
            Ingresa tu número de identificación para comenzar
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={numeroIdentificacion}
              onChange={(e) => setNumeroIdentificacion(e.target.value)}
              placeholder="Número de identificación"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
            <button
              onClick={() => setShowPublicForm(true)}
              disabled={!numeroIdentificacion}
              className="w-full px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">
            {modoPublico ? 'Formulario de Onboarding' : 'Gestionar Formulario de Onboarding'}
          </h1>
          <p className="text-muted text-lg">
            {modoPublico
              ? 'Completa el formulario para vincularlo a tu proyecto'
              : 'Agrega, edita y borra preguntas del formulario'}
          </p>
        </div>
        {!modoPublico && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Agregar Pregunta'}
          </button>
        )}
      </div>

      {!modoPublico && showForm && (
        <div className="mb-8 bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Nueva Pregunta</h2>
          <form onSubmit={handleSubmitPregunta} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pregunta *</label>
              <input
                type="text"
                required
                value={formData.pregunta}
                onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
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
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>
            {formData.tipo === 'opcion_multiple' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Opciones (separadas por comas)
                </label>
                <input
                  type="text"
                  value={formData.opciones}
                  onChange={(e) => setFormData({ ...formData, opciones: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="Opción 1, Opción 2, Opción 3"
                />
              </div>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Agregar Pregunta
            </button>
          </form>
        </div>
      )}

      {modoPublico && (
        <form onSubmit={handleSubmitFormulario} className="max-w-2xl mx-auto">
          <div className="bg-surface rounded-xl p-6 border border-border space-y-6">
            {loading ? (
              <div className="text-center py-12 text-muted">Cargando...</div>
            ) : preguntas.length === 0 ? (
              <p className="text-muted text-center">No hay preguntas disponibles</p>
            ) : (
              preguntas.map((pregunta) => (
                <div key={pregunta.id}>
                  <label className="block text-sm font-medium mb-2">{pregunta.pregunta}</label>
                  {pregunta.tipo === 'texto' && (
                    <input
                      type="text"
                      value={respuestas[pregunta.id] || ''}
                      onChange={(e) =>
                        setRespuestas({ ...respuestas, [pregunta.id]: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  )}
                  {pregunta.tipo === 'numero' && (
                    <input
                      type="number"
                      value={respuestas[pregunta.id] || ''}
                      onChange={(e) =>
                        setRespuestas({ ...respuestas, [pregunta.id]: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  )}
                  {pregunta.tipo === 'opcion_multiple' && pregunta.opciones && (
                    <select
                      value={respuestas[pregunta.id] || ''}
                      onChange={(e) =>
                        setRespuestas({ ...respuestas, [pregunta.id]: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">Seleccionar...</option>
                      {(typeof pregunta.opciones === 'string' 
                        ? JSON.parse(pregunta.opciones) 
                        : pregunta.opciones
                      ).map((opcion: string, idx: number) => (
                        <option key={idx} value={opcion}>
                          {opcion}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))
            )}
            {preguntas.length > 0 && (
              <button
                type="submit"
                className="w-full px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
              >
                Enviar Formulario
              </button>
            )}
          </div>
        </form>
      )}

      {!modoPublico && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted">Cargando...</div>
          ) : preguntas.length === 0 ? (
            <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
              No hay preguntas. Agrega la primera pregunta usando el botón superior.
            </div>
          ) : (
            preguntas.map((pregunta) => (
              <div
                key={pregunta.id}
                className="bg-surface rounded-xl p-6 border border-border"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{pregunta.pregunta}</h3>
                    <p className="text-sm text-muted">
                      Tipo: {pregunta.tipo} • Orden: {pregunta.orden}
                    </p>
                    {pregunta.opciones && (
                      <p className="text-xs text-muted mt-1">
                        Opciones:{' '}
                        {(typeof pregunta.opciones === 'string'
                          ? JSON.parse(pregunta.opciones)
                          : pregunta.opciones
                        ).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
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
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="text-center py-12 text-muted">Cargando...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
