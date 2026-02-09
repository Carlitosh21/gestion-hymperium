import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Mapeo resultado llamada -> estado del Lead (null = sin cambio, ej. Show-up)
const RESULTADO_TO_LEAD_ESTADO: Record<string, string | null> = {
  no_show: 'no_se_presento',
  'No-Show': 'no_se_presento',
  cancelo: 'llamada_cancelada',
  Canceló: 'llamada_cancelada',
  reagendo: 'llamada_reagendada',
  Reagendó: 'llamada_reagendada',
  show_up: null,
  'Show-up': null,
}

function getLeadEstadoFromResultado(resultado: string | null): string | null {
  if (!resultado) return null
  const normalized = resultado.trim()
  return RESULTADO_TO_LEAD_ESTADO[normalized] ?? null
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const result = await query(
      'DELETE FROM llamadas WHERE id = $1 RETURNING id',
      [params.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Llamada no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al borrar llamada:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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

    // Obtener llamada actual (para lead_id y estado anterior del lead)
    const currentResult = await query(
      'SELECT id, lead_id FROM llamadas WHERE id = $1',
      [params.id]
    )
    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Llamada no encontrada' }, { status: 404 })
    }
    const currentLlamada = currentResult.rows[0]

    let updateFields: string[] = []
    let updateValues: any[] = []
    let paramIndex = 1

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

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(params.id)

    const updateQuery = `
      UPDATE llamadas 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    const result = await query(updateQuery, updateValues)
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Llamada no encontrada' }, { status: 404 })
    }

    const updatedLlamada = result.rows[0]

    // Si cambió resultado y hay lead_id, actualizar estado del Lead
    if (resultado !== undefined && currentLlamada.lead_id) {
      const newLeadEstado = getLeadEstadoFromResultado(resultado)
      if (newLeadEstado) {
        const leadId = currentLlamada.lead_id
        const leadCurrent = await query(
          'SELECT estado FROM leads WHERE id = $1',
          [leadId]
        )
        const prevEstado = leadCurrent.rows[0]?.estado || null

        if (prevEstado !== newLeadEstado) {
          await query(
            `UPDATE leads SET estado = $1, estado_editado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newLeadEstado, leadId]
          )
          try {
            await query(
              `INSERT INTO lead_estado_eventos (lead_id, from_estado, to_estado, changed_at)
               VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
              [leadId, prevEstado, newLeadEstado]
            )
          } catch (e: any) {
            console.error('Error al registrar evento (no crítico):', e.message)
          }
        }
      }
    }

    return NextResponse.json(updatedLlamada)
  } catch (error: any) {
    console.error('Error al actualizar llamada:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
