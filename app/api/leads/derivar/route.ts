import { NextResponse } from 'next/server'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { manychat_id } = body

    if (!manychat_id) {
      return NextResponse.json(
        { error: 'manychat_id es requerido' },
        { status: 400 }
      )
    }

    const url = process.env.N8N_DERIVAR_URL
    if (!url) {
      return NextResponse.json(
        { error: 'N8N_DERIVAR_URL no configurada en variables de entorno' },
        { status: 503 }
      )
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manychat_id }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error al derivar lead' },
        { status: response.status }
      )
    }

    return NextResponse.json({ reply: data.reply ?? 'Lead derivado ✅' })
  } catch (error: any) {
    console.error('Error al derivar lead:', error)
    return NextResponse.json(
      { error: error.message || 'Error al derivar lead' },
      { status: 500 }
    )
  }
}
