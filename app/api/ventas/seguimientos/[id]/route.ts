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
    const { nombre, mensaje, delay_horas, activo, estados } = body

    // Construir campos a actualizar
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (nombre !== undefined) {
      updateFields.push(`nombre = $${paramIndex}`)
      updateValues.push(nombre)
      paramIndex++
    }

    if (mensaje !== undefined) {
      updateFields.push(`mensaje = $${paramIndex}`)
      updateValues.push(mensaje)
      paramIndex++
    }

    if (delay_horas !== undefined) {
      if (delay_horas <= 0) {
        return NextResponse.json(
          { error: 'delay_horas debe ser mayor a 0' },
          { status: 400 }
        )
      }
      updateFields.push(`delay_horas = $${paramIndex}`)
      updateValues.push(delay_horas)
      paramIndex++
    }

    if (activo !== undefined) {
      updateFields.push(`activo = $${paramIndex}`)
      updateValues.push(activo)
      paramIndex++
    }

    // Siempre actualizar updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    if (updateFields.length > 1) {
      // Hay campos para actualizar
      updateValues.push(params.id)

      await query(
        `UPDATE seguimientos 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}`,
        updateValues
      )
    }

    // Si se proporcionaron estados, actualizar la relación
    if (Array.isArray(estados)) {
      // Eliminar estados existentes
      await query(
        `DELETE FROM seguimiento_estados WHERE seguimiento_id = $1`,
        [params.id]
      )

      // Insertar nuevos estados
      if (estados.length > 0) {
        const estadosValues = estados.map((estado: string, index: number) => {
          const paramIndex = index * 2 + 1
          return `($${paramIndex}, $${paramIndex + 1})`
        }).join(', ')

        const estadosParams: any[] = []
        estados.forEach((estado: string) => {
          estadosParams.push(params.id, estado)
        })

        await query(
          `INSERT INTO seguimiento_estados (seguimiento_id, estado)
           VALUES ${estadosValues}`,
          estadosParams
        )
      }
    }

    // Obtener seguimiento completo con estados
    const completoResult = await query(
      `SELECT s.*, 
       COALESCE(
         json_agg(
           json_build_object('estado', se.estado)
         ) FILTER (WHERE se.estado IS NOT NULL),
         '[]'::json
       ) as estados
       FROM seguimientos s
       LEFT JOIN seguimiento_estados se ON s.id = se.seguimiento_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [params.id]
    )

    if (completoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(completoResult.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar seguimiento:', error)
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

    const result = await query(
      `DELETE FROM seguimientos WHERE id = $1 RETURNING *`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar seguimiento:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
