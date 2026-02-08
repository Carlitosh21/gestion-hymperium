import { NextResponse } from 'next/server'
import { requireClientSession } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireClientSession()
    
    const result = await query(
      'SELECT * FROM tareas WHERE cliente_id = $1 ORDER BY fecha_limite NULLS LAST, created_at DESC',
      [session.cliente_id]
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al obtener tareas:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
