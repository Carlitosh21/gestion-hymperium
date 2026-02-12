'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Power } from 'lucide-react'

const PRESETS = [1, 3, 6, 12, 24, 48]
const MIN_HORAS = 0.5
const MAX_HORAS = 72
const POLL_INTERVAL_MS = 12000
const LAST_ACTION_KEY = 'setter_last_apagado'

interface LastAction {
  tiempo: number
  startedAt: string
}

function formatHasta(horas: number): string {
  const d = new Date()
  d.setHours(d.getHours() + horas)
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCountdown(startedAt: string, horas: number): string | null {
  const start = new Date(startedAt).getTime()
  const end = start + horas * 60 * 60 * 1000
  const now = Date.now()
  if (now >= end) return 'Reencendido'
  const rem = end - now
  const h = Math.floor(rem / (60 * 60 * 1000))
  const m = Math.floor((rem % (60 * 60 * 1000)) / (60 * 1000))
  return `${h}h ${m}m`
}

export default function InterruptorPage() {
  const [prendido, setPrendido] = useState<boolean | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<Date | null>(null)
  const [horas, setHoras] = useState(24)
  const [apagarLoading, setApagarLoading] = useState(false)
  const [apagarFeedback, setApagarFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  const [lastAction, setLastAction] = useState<LastAction | null>(null)
  const [countdown, setCountdown] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true)
    setStatusError(null)
    try {
      const res = await fetch('/api/setter/status')
      const data = await res.json()
      if (res.ok) {
        setPrendido(data.prendido === true)
        setStatusUpdatedAt(new Date())
      } else {
        setStatusError(data.error || 'Error al consultar estado')
      }
    } catch {
      setStatusError('Error de conexión')
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    const t = setInterval(fetchStatus, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [fetchStatus])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_ACTION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as LastAction
        setLastAction(parsed)
      }
    } catch {
      setLastAction(null)
    }
  }, [])

  useEffect(() => {
    if (!lastAction) {
      setCountdown(null)
      return
    }
    const update = () => {
      const c = getCountdown(lastAction.startedAt, lastAction.tiempo)
      setCountdown(c)
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [lastAction])

  const handleApagar = async () => {
    if (apagarLoading) return
    if (horas < MIN_HORAS || horas > MAX_HORAS) return
    if (!confirm(`¿Apagar el Setter por ${horas} horas? Se reencenderá automáticamente hacia las ${formatHasta(horas)}.`)) return

    setApagarLoading(true)
    setApagarFeedback(null)

    try {
      const res = await fetch('/api/setter/apagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiempo: horas }),
      })

      const data = await res.json()

      if (res.ok && data.ok) {
        setApagarFeedback({ ok: true, msg: `Apagado por ${horas}h. Se reencenderá hacia las ${formatHasta(horas)}.` })
        const action: LastAction = {
          tiempo: horas,
          startedAt: new Date().toISOString(),
        }
        setLastAction(action)
        try {
          localStorage.setItem(LAST_ACTION_KEY, JSON.stringify(action))
        } catch {}
        fetchStatus()
      } else {
        setApagarFeedback({ ok: false, msg: data.error || 'Error al apagar' })
      }
    } catch {
      setApagarFeedback({ ok: false, msg: 'Error de conexión' })
    } finally {
      setApagarLoading(false)
    }
  }

  const clampHoras = (v: number) => Math.max(MIN_HORAS, Math.min(MAX_HORAS, v))

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-4xl font-semibold mb-2">Interruptor</h1>
      <p className="text-muted text-lg mb-8">Control del Setter: estado y apagado programado</p>

      {/* Card de estado */}
      <div
        className="rounded-2xl border p-6 mb-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Estado actual
          </h2>
          <button
            onClick={fetchStatus}
            disabled={statusLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-foreground)',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>

        {statusLoading && prendido === null && !statusError && (
          <p className="text-muted">Consultando estado del Setter...</p>
        )}

        {statusError && (
          <p className="text-sm" style={{ color: 'rgb(239,68,68)' }}>
            {statusError}
          </p>
        )}

        {!statusLoading && prendido !== null && !statusError && (
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium ${
                prendido ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${prendido ? 'bg-green-500' : 'bg-red-500'}`}
              />
              {prendido ? 'ACTIVO' : 'APAGADO'}
            </div>
            {statusUpdatedAt && (
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Actualizado hace {Math.round((Date.now() - statusUpdatedAt.getTime()) / 1000)}s
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card de apagado programado */}
      <div
        className="rounded-2xl border p-6 mb-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
          Apagar por tiempo
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((h) => (
            <button
              key={h}
              onClick={() => setHoras(h)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                horas === h
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated hover:bg-surface text-foreground'
              }`}
              style={
                horas === h
                  ? { backgroundColor: 'var(--color-accent)', color: 'white' }
                  : { backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-foreground)' }
              }
            >
              {h}h
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={MIN_HORAS}
              max={MAX_HORAS}
              step={0.5}
              value={horas}
              onChange={(e) => setHoras(clampHoras(parseFloat(e.target.value)))}
              className="flex-1 h-2 rounded-full accent-accent"
              style={{ accentColor: 'var(--color-accent)' }}
            />
            <input
              type="number"
              min={MIN_HORAS}
              max={MAX_HORAS}
              step={0.5}
              value={horas}
              onChange={(e) => setHoras(clampHoras(parseFloat(e.target.value) || 0))}
              className="w-20 px-3 py-2 rounded-lg border text-center"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            />
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              horas
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Apagar por {horas} horas (hasta las {formatHasta(horas)})
          </p>
        </div>

        <button
          onClick={handleApagar}
          disabled={apagarLoading || (prendido === false)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: 'rgb(239,68,68)',
            color: 'white',
          }}
        >
          <Power className="w-5 h-5" />
          {apagarLoading ? 'Enviando...' : 'Apagar Setter'}
        </button>

        {apagarFeedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              apagarFeedback.ok ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'
            }`}
          >
            {apagarFeedback.msg}
          </div>
        )}
      </div>

      {/* Última acción + countdown */}
      {lastAction && (
        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>
            Última acción
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Apagado por {lastAction.tiempo}h el{' '}
            {new Date(lastAction.startedAt).toLocaleString('es-AR')}
          </p>
          {countdown && (
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-foreground)' }}>
              Reencendido en: {countdown}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
