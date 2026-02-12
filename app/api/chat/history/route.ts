import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireInternalSession()

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId || sessionId.trim() === '') {
      return NextResponse.json(
        { error: 'Parámetro sessionId requerido' },
        { status: 400 }
      )
    }

    let rows: any[] = []

    try {
      const result = await query(
        `SELECT id, session_id, message
         FROM n8n_chat_histories
         WHERE session_id = $1
         ORDER BY id ASC`,
        [sessionId.trim()]
      )
      rows = result.rows || []
    } catch (err: any) {
      if (err.code === '42P01') {
        return NextResponse.json(
          { sessionId: sessionId.trim(), chatHistory: [] },
          { status: 200 }
        )
      }
      throw err
    }

    return NextResponse.json({
      sessionId: sessionId.trim(),
      chatHistory: rows,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en /api/chat/history:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener historial' },
      { status: 500 }
    )
  }
}
