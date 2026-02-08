'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [canSetup, setCanSetup] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    try {
      const response = await fetch('/api/auth/setup')
      const data = await response.json()
      setCanSetup(!data.adminExists)
      if (data.adminExists) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error al verificar setup:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
      } else {
        setError(data.error || 'Error al crear administrador')
      }
    } catch (error) {
      setError('Error al crear administrador')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center text-muted">Verificando...</div>
    )
  }

  if (!canSetup) {
    return (
      <div className="text-center">
        <p className="text-muted">Ya existe un administrador.</p>
        <a href="/login" className="text-accent hover:underline mt-4 inline-block">
          Ir a login →
        </a>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface rounded-xl p-8 border border-border">
        <h1 className="text-3xl font-semibold mb-2">Configuración Inicial</h1>
        <p className="text-muted mb-6">
          Crea el primer usuario administrador del sistema
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="admin@hymperium.com"
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
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Contraseña *</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creando...' : 'Crear Administrador'}
          </button>
        </form>
      </div>
    </div>
  )
}
