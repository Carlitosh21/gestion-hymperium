import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT * FROM clientes WHERE id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { estado_entrega, cotizacion, entregables } = body

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (estado_entrega !== undefined) {
      updates.push(`estado_entrega = $${paramIndex++}`)
      values.push(estado_entrega)
    }

    if (cotizacion !== undefined) {
      updates.push(`cotizacion = $${paramIndex++}`)
      values.push(cotizacion)
    }

    if (entregables !== undefined) {
      updates.push(`entregables = $${paramIndex++}`)
      values.push(entregables)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(params.id)

    const result = await query(
      `UPDATE clientes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    
    // Verificar que el cliente existe antes de eliminar
    const checkResult = await query(
      'SELECT id FROM clientes WHERE id = $1',
      [params.id]
    )

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar cliente (las relaciones con CASCADE se eliminan automáticamente)
    await query(
      'DELETE FROM clientes WHERE id = $1',
      [params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
