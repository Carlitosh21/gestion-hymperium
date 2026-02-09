'use client'

import { useState, useEffect } from 'react'

interface Pregunta {
  id: number
  titulo: string | null
  descripcion: string | null
  pregunta: string
  tipo: string
  opciones: any
  orden: number
}

export default function OnboardingPublicPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('')
  const [showPublicForm, setShowPublicForm] = useState(false)
  const [validatingId, setValidatingId] = useState(false)
  const [idValid, setIdValid] = useState(false)
  const [idError, setIdError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (idValid) {
      fetchPreguntas()
    }
  }, [idValid])

  const fetchPreguntas = async () => {
    try {
      const response = await fetch('/api/onboarding/preguntas')
      const data = await response.json()
      setPreguntas(data)
    } catch (error) {
      console.error('Error al cargar preguntas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidateId = async () => {
    if (!numeroIdentificacion.trim()) {
      setIdError('Debes ingresar tu número de identificación')
      return
    }

    setValidatingId(true)
    setIdError(null)

    try {
      const response = await fetch(`/api/onboarding/validate-id?numero_identificacion=${encodeURIComponent(numeroIdentificacion.trim())}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.valid) {
          setIdValid(true)
          setShowPublicForm(true)
          setIdError(null)
        } else {
          setIdValid(false)
          setIdError('Número de identificación no válido. Por favor, verifica e intenta nuevamente.')
        }
      } else {
        setIdValid(false)
        setIdError('Error al validar el número de identificación. Por favor, intenta nuevamente.')
      }
    } catch (error) {
      console.error('Error al validar ID:', error)
      setIdValid(false)
      setIdError('Error al validar el número de identificación. Por favor, intenta nuevamente.')
    } finally {
      setValidatingId(false)
    }
  }

  const handleSubmitFormulario = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!numeroIdentificacion || !idValid) {
      alert('Debes validar tu número de identificación primero')
      return
    }

    setSubmitting(true)

    try {
      const respuestasArray = Object.entries(respuestas)
        .filter(([_, respuesta]) => respuesta && respuesta.trim())
        .map(([pregunta_id, respuesta]) => ({
          pregunta_id: parseInt(pregunta_id),
          respuesta: respuesta.toString(),
        }))

      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_identificacion: numeroIdentificacion.trim(),
          respuestas: respuestasArray,
        }),
      })

      if (response.ok) {
        alert('Formulario enviado correctamente')
        setRespuestas({})
        setNumeroIdentificacion('')
        setIdValid(false)
        setShowPublicForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al enviar formulario')
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error)
      alert('Error al enviar formulario')
    } finally {
      setSubmitting(false)
    }
  }

  if (!showPublicForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="bg-surface rounded-xl p-8 border border-border max-w-2xl w-full">
          <h1 className="text-3xl font-semibold mb-4 text-center">Formulario de Onboarding</h1>
          <p className="text-muted mb-6 text-center">
            Ingresa tu número de identificación para comenzar
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número de Identificación *</label>
              <input
                type="text"
                value={numeroIdentificacion}
                onChange={(e) => {
                  setNumeroIdentificacion(e.target.value)
                  setIdError(null)
                  setIdValid(false)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleValidateId()
                  }
                }}
                placeholder="Ingresa tu número de identificación"
                className={`w-full px-4 py-2 border rounded-lg bg-background ${
                  idError ? 'border-red-500' : 'border-border'
                }`}
              />
              {idError && (
                <p className="mt-2 text-sm text-red-600">{idError}</p>
              )}
            </div>
            <button
              onClick={handleValidateId}
              disabled={!numeroIdentificacion.trim() || validatingId}
              className="w-full px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {validatingId ? 'Validando...' : 'Validar y Continuar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold mb-2">Formulario de Onboarding</h1>
          <p className="text-muted text-lg">
            Completa el formulario para vincularlo a tu proyecto
          </p>
        </div>

        <form onSubmit={handleSubmitFormulario}>
          <div className="bg-surface rounded-xl p-6 border border-border space-y-6">
            {loading ? (
              <div className="text-center py-12 text-muted">Cargando...</div>
            ) : preguntas.length === 0 ? (
              <p className="text-muted text-center">No hay preguntas disponibles</p>
            ) : (
              preguntas
                .filter(p => p.orden !== null)
                .sort((a, b) => a.orden - b.orden)
                .map((pregunta) => (
                <div key={pregunta.id} className="space-y-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      {pregunta.titulo || pregunta.pregunta}
                    </label>
                    {pregunta.descripcion && (
                      <p className="text-sm text-muted mb-2">{pregunta.descripcion}</p>
                    )}
                  </div>
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
                disabled={submitting}
                className="w-full px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Enviando...' : 'Enviar Formulario'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
