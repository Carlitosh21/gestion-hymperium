import { NextResponse } from 'next/server'
import { requireClientSession } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireClientSession()
    const body = await request.json()
    const { estado } = body

    if (estado !== 'completada') {
      return NextResponse.json(
        { error: 'Solo se puede marcar como completada' },
        { status: 400 }
      )
    }

    const check = await query(
      'SELECT id, responsable FROM tareas WHERE id = $1 AND cliente_id = $2',
      [params.id, session.cliente_id]
    )

    if (check.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    if (check.rows[0].responsable !== 'ellos') {
      return NextResponse.json(
        { error: 'Solo puedes marcar como completadas las tareas de tipo "Ellos"' },
        { status: 403 }
      )
    }

    const result = await query(
      `UPDATE tareas SET estado = $1 WHERE id = $2 AND cliente_id = $3 RETURNING *`,
      ['completada', params.id, session.cliente_id]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al actualizar tarea:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
