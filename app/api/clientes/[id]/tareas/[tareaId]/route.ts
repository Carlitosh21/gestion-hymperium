import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; tareaId: string } }
) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { estado } = body

    const result = await query(
      `UPDATE tareas 
       SET estado = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND cliente_id = $3
       RETURNING *`,
      [estado, params.tareaId, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar tarea:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tareaId: string } }
) {
  try {
    await requireInternalSession()
    const result = await query(
      'DELETE FROM tareas WHERE id = $1 AND cliente_id = $2 RETURNING *',
      [params.tareaId, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar tarea:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
