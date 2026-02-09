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
    const { fecha, link_grabacion, notas, resultado } = body

    // Verificar que haya al menos un campo para actualizar
    if (fecha === undefined && link_grabacion === undefined && notas === undefined && resultado === undefined) {
      return NextResponse.json(
        { error: 'Se requiere al menos un campo para actualizar' },
        { status: 400 }
      )
    }

    let updateFields: string[] = []
    let updateValues: any[] = []
    let paramIndex = 1

    // Construir campos dinámicamente
    if (fecha !== undefined) {
      updateFields.push(`fecha = $${paramIndex}`)
      updateValues.push(fecha)
      paramIndex++
    }

    if (link_grabacion !== undefined) {
      updateFields.push(`link_grabacion = $${paramIndex}`)
      updateValues.push(link_grabacion || null)
      paramIndex++
    }

    if (notas !== undefined) {
      updateFields.push(`notas = $${paramIndex}`)
      updateValues.push(notas || null)
      paramIndex++
    }

    if (resultado !== undefined) {
      updateFields.push(`resultado = $${paramIndex}`)
      updateValues.push(resultado || null)
      paramIndex++
    }

    // Siempre actualizar updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Agregar WHERE clause
    updateValues.push(params.id)

    const updateQuery = `
      UPDATE llamadas 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(updateQuery, updateValues)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Llamada no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar llamada:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
