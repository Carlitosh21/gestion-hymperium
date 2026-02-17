import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission('finanzas.write')
    const body = await request.json()
    const {
      monto,
      descripcion,
      proyecto_id,
      tipo_proyecto,
      pago_desarrollador,
      fecha,
      estado,
    } = body

    const estadoVal = estado !== undefined ? (estado === 'pendiente' ? 'pendiente' : 'completado') : undefined

    const result = await query(
      `UPDATE ingresos SET
        monto = $1,
        descripcion = $2,
        proyecto_id = $3,
        tipo_proyecto = $4,
        pago_desarrollador = $5,
        fecha = $6,
        estado = COALESCE($7, estado)
      WHERE id = $8
      RETURNING *`,
      [
        monto,
        descripcion || null,
        proyecto_id || null,
        tipo_proyecto || null,
        pago_desarrollador ?? 0,
        fecha || new Date().toISOString(),
        estadoVal,
        params.id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ingreso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al actualizar ingreso:', error)
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
    await requirePermission('finanzas.write')

    const result = await query('DELETE FROM ingresos WHERE id = $1', [params.id])

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Ingreso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al eliminar ingreso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
