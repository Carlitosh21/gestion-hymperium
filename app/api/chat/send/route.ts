import { NextResponse } from 'next/server'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function normalizeReply(data: any): string {
  if (Array.isArray(data) && data[0]?.reply != null) {
    return String(data[0].reply)
  }
  if (data?.reply != null) {
    return String(data.reply)
  }
  return JSON.stringify(data, null, 2)
}

export async function POST(request: Request) {
  try {
    await requireInternalSession()

    const url = process.env.N8N_CHAT_URL
    if (!url || url.trim() === '') {
      return NextResponse.json(
        { error: 'N8N_CHAT_URL no configurada' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const chatInput = body?.chatInput
    const sessionId = body?.sessionId

    if (!chatInput || typeof chatInput !== 'string' || chatInput.trim() === '') {
      return NextResponse.json(
        { error: 'chatInput requerido' },
        { status: 400 }
      )
    }

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      return NextResponse.json(
        { error: 'sessionId requerido' },
        { status: 400 }
      )
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: chatInput.trim(),
        sessionId: sessionId.trim(),
      }),
    })

    const data = await response.json()
    const reply = normalizeReply(data)

    return NextResponse.json({ reply, raw: data })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en /api/chat/send:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}
