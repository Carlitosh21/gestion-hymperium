import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { titulo, descripcion, pregunta, tipo, opciones, orden, activa } = body

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (titulo !== undefined) {
      updates.push(`titulo = $${paramIndex++}`)
      values.push(titulo)
      // Si se actualiza titulo y no viene pregunta, actualizar pregunta también para compatibilidad
      if (pregunta === undefined) {
        updates.push(`pregunta = $${paramIndex - 1}`)
      }
    }

    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex++}`)
      values.push(descripcion)
    }

    if (pregunta !== undefined) {
      updates.push(`pregunta = $${paramIndex++}`)
      values.push(pregunta)
      // Si se actualiza pregunta y no viene titulo, actualizar titulo también
      if (titulo === undefined) {
        updates.push(`titulo = $${paramIndex - 1}`)
      }
    }

    if (tipo !== undefined) {
      updates.push(`tipo = $${paramIndex++}`)
      values.push(tipo)
    }

    if (opciones !== undefined) {
      updates.push(`opciones = $${paramIndex++}`)
      values.push(opciones ? JSON.stringify(opciones) : null)
    }

    if (orden !== undefined) {
      updates.push(`orden = $${paramIndex++}`)
      values.push(orden)
    }

    if (activa !== undefined) {
      updates.push(`activa = $${paramIndex++}`)
      values.push(activa)
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
      `UPDATE preguntas_onboarding SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar pregunta:', error)
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
    const result = await query(
      'DELETE FROM preguntas_onboarding WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar pregunta:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
