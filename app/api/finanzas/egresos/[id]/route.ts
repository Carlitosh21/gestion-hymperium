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
    const { monto, descripcion, categoria, proyecto_id, fecha, estado } = body

    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (monto !== undefined) {
      updates.push(`monto = $${idx}`)
      values.push(monto)
      idx++
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${idx}`)
      values.push(descripcion)
      idx++
    }
    if (categoria !== undefined) {
      updates.push(`categoria = $${idx}`)
      values.push(categoria)
      idx++
    }
    if (proyecto_id !== undefined) {
      updates.push(`proyecto_id = $${idx}`)
      values.push(proyecto_id || null)
      idx++
    }
    if (fecha !== undefined) {
      updates.push(`fecha = $${idx}`)
      values.push(fecha || new Date().toISOString())
      idx++
    }
    if (estado !== undefined) {
      updates.push(`estado = $${idx}`)
      values.push(estado === 'pendiente' ? 'pendiente' : 'completado')
      idx++
    }

    if (updates.length === 0) {
      const existing = await query('SELECT * FROM egresos WHERE id = $1', [params.id])
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: 'Egreso no encontrado' }, { status: 404 })
      }
      return NextResponse.json(existing.rows[0])
    }

    values.push(params.id)
    const result = await query(
      `UPDATE egresos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Egreso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
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
    await requirePermission('finanzas.write')

    const result = await query('DELETE FROM egresos WHERE id = $1', [params.id])

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Egreso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al eliminar egreso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
