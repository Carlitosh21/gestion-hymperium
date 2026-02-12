import { NextResponse } from 'next/server'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()

    const url = process.env.N8N_SETTER_STATUS_URL
    if (!url || url.trim() === '') {
      return NextResponse.json(
        { error: 'N8N_SETTER_STATUS_URL no configurada' },
        { status: 503 }
      )
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error al consultar estado' },
        { status: response.status }
      )
    }

    const prendido = data?.prendido === true
    return NextResponse.json({ prendido })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en /api/setter/status:', error)
    return NextResponse.json(
      { error: error.message || 'Error al consultar estado' },
      { status: 500 }
    )
  }
}
