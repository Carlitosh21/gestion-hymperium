import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireInternalSession()

    const { searchParams } = new URL(request.url)
    const manychatId = searchParams.get('manychatId')

    if (!manychatId || manychatId.trim() === '') {
      return NextResponse.json(
        { error: 'Parámetro manychatId requerido' },
        { status: 400 }
      )
    }

    let rows: any[] = []

    try {
      // Intentar filtrar por session_id (estructura típica de n8n/LangChain)
      const result = await query(
        `SELECT id, session_id, message, created_at, "timestamp"
         FROM n8n_chat_histories
         WHERE session_id = $1
         ORDER BY COALESCE(id, 0) ASC`,
        [manychatId.trim()]
      )
      rows = result.rows || []
    } catch (err: any) {
      if (err.code === '42703') {
        // Columna session_id inexistente, intentar con manychat_id
        try {
          const result = await query(
            `SELECT id, manychat_id, message, created_at, "timestamp"
             FROM n8n_chat_histories
             WHERE manychat_id = $1
             ORDER BY COALESCE(id, 0) ASC`,
            [manychatId.trim()]
          )
          rows = result.rows || []
        } catch (retryErr: any) {
          if (retryErr.code === '42P01') {
            return NextResponse.json(
              { manychatId: manychatId.trim(), chatHistory: [] },
              { status: 200 }
            )
          }
          throw retryErr
        }
      } else if (err.code === '42P01') {
        // Tabla inexistente
        return NextResponse.json(
          { manychatId: manychatId.trim(), chatHistory: [] },
          { status: 200 }
        )
      } else {
        throw err
      }
    }

    return NextResponse.json({
      manychatId: manychatId.trim(),
      chatHistory: rows,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en /api/conversacion:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener conversación' },
      { status: 500 }
    )
  }
}
