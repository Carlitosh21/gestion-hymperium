import { NextResponse } from 'next/server'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireInternalSession()

    const body = await request.json().catch(() => ({}))
    const tiempo = body?.tiempo

    if (tiempo == null || typeof tiempo !== 'number' || tiempo < 0) {
      return NextResponse.json(
        { error: 'tiempo (horas) es requerido y debe ser un número >= 0' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.N8N_SETTER_APAGAR_URL
    if (!baseUrl || baseUrl.trim() === '') {
      return NextResponse.json(
        { error: 'N8N_SETTER_APAGAR_URL no configurada' },
        { status: 503 }
      )
    }

    const url = new URL(baseUrl)
    url.searchParams.set('tiempo', String(Math.round(tiempo)))

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || 'Error al apagar setter' },
        { status: response.status }
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en /api/setter/apagar:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al apagar setter' },
      { status: 500 }
    )
  }
}
