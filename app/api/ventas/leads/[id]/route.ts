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
    const { estado, usuario_ig, notas } = body

    // Verificar que haya al menos un campo para actualizar
    if (!estado && usuario_ig === undefined && notas === undefined) {
      return NextResponse.json(
        { error: 'Se requiere al menos un campo para actualizar' },
        { status: 400 }
      )
    }

    let updateFields: string[] = []
    let updateValues: any[] = []
    let paramIndex = 1

    // Si viene estado, validar y actualizar
    if (estado) {
      // Estados válidos del pipeline
      const estadosValidos = [
        'mensaje_conexion',
        'respondio',
        'video_enviado',
        'respuesta_positiva',
        'respuesta_negativa',
        'llamada_agendada',
        'llamada_reagendada',
        'llamada_cancelada',
        'no_se_presento',
        'no_cualifica',
        'seña',
        'downsell',
        'cerrado'
      ]

      if (!estadosValidos.includes(estado)) {
        return NextResponse.json(
          { error: 'Estado inválido' },
          { status: 400 }
        )
      }

      updateFields.push(`estado = $${paramIndex}`)
      updateValues.push(estado)
      paramIndex++

      updateFields.push(`estado_editado_at = CURRENT_TIMESTAMP`)
    }

    // Si viene usuario_ig, actualizar usuario_ig y nombre (para consistencia)
    if (usuario_ig !== undefined) {
      updateFields.push(`usuario_ig = $${paramIndex}`)
      updateFields.push(`nombre = $${paramIndex}`)
      updateValues.push(usuario_ig)
      paramIndex++
    }

    // Si viene notas, actualizar
    if (notas !== undefined) {
      updateFields.push(`notas = $${paramIndex}`)
      updateValues.push(notas)
      paramIndex++
    }

    // Siempre actualizar updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Agregar WHERE clause
    updateValues.push(params.id)

    const updateQuery = `
      UPDATE leads 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(updateQuery, updateValues)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    const lead = result.rows[0]

    // Si se actualizó el estado y es de conversión, indicar que requiere conversión
    if (estado) {
      const estadosConversion = ['seña', 'downsell', 'cerrado']
      const requiresConversion = estadosConversion.includes(estado) && !lead.cliente_id

      return NextResponse.json({
        ...lead,
        requiresConversion
      })
    }

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
