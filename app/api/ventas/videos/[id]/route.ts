import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { idea_contenido_id } = body

    const result = await query(
      `UPDATE videos 
       SET idea_contenido_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [idea_contenido_id, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Video no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar video:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
