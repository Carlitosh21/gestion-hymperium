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
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { nombre, porcentaje, descripcion } = body

    const current = await query(
      'SELECT nombre FROM categorias_billetera WHERE id = $1',
      [id]
    )
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    const oldNombre = current.rows[0].nombre
    const newNombre = nombre !== undefined ? String(nombre).trim() : oldNombre
    const newDescripcion = descripcion !== undefined ? (descripcion?.trim() || null) : undefined
    const newPorcentaje = porcentaje != null ? parseFloat(porcentaje) : undefined

    if (nombre !== undefined && newNombre === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (nombre !== undefined) {
      updates.push(`nombre = $${idx}`)
      values.push(newNombre)
      idx++
    }
    if (newPorcentaje !== undefined) {
      updates.push(`porcentaje = $${idx}`)
      values.push(newPorcentaje)
      idx++
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${idx}`)
      values.push(newDescripcion ?? null)
      idx++
    }

    if (updates.length === 0) {
      const cat = await query('SELECT * FROM categorias_billetera WHERE id = $1', [id])
      return NextResponse.json(cat.rows[0])
    }

    try {
      const result = await query(
        `UPDATE categorias_billetera SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        [...values, id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
      }

      if (nombre !== undefined && newNombre !== oldNombre) {
        await query(
          'UPDATE egresos SET categoria = $1 WHERE categoria = $2',
          [newNombre, oldNombre]
        )
      }

      return NextResponse.json(result.rows[0])
    } catch (error: any) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese nombre' },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al actualizar categoría:', error)
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
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const cat = await query(
      'SELECT nombre FROM categorias_billetera WHERE id = $1',
      [id]
    )
    if (cat.rows.length === 0) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    const nombre = cat.rows[0].nombre
    const uso = await query(
      'SELECT 1 FROM egresos WHERE categoria = $1 LIMIT 1',
      [nombre]
    )

    if (uso.rows.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar: esta categoría está en uso por uno o más egresos' },
        { status: 409 }
      )
    }

    await query('DELETE FROM categorias_billetera WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
