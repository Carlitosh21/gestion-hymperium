import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { monto, descripcion, categoria, proyecto_id, fecha } = body

    const result = await query(
      `UPDATE egresos SET
        monto = $1,
        descripcion = $2,
        categoria = $3,
        proyecto_id = $4,
        fecha = $5
      WHERE id = $6
      RETURNING *`,
      [
        monto,
        descripcion,
        categoria,
        proyecto_id || null,
        fecha || new Date().toISOString(),
        params.id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Egreso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar egreso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()

    const result = await query('DELETE FROM egresos WHERE id = $1', [params.id])

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Egreso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar egreso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
