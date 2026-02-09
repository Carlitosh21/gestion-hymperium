import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { seguimiento_id, lead_id, estado_editado_at_snapshot } = body

    if (!seguimiento_id || !lead_id || !estado_editado_at_snapshot) {
      return NextResponse.json(
        { error: 'seguimiento_id, lead_id y estado_editado_at_snapshot son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de fecha
    let fechaSnapshot: Date
    try {
      fechaSnapshot = new Date(estado_editado_at_snapshot)
      if (isNaN(fechaSnapshot.getTime())) {
        return NextResponse.json(
          { error: 'Formato de fecha inválido' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      )
    }

    // Obtener el estado actual del lead para validar
    const leadResult = await query(
      `SELECT estado, estado_editado_at FROM leads WHERE id = $1`,
      [lead_id]
    )

    if (leadResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    const lead = leadResult.rows[0]

    // Insertar registro de envío (el UNIQUE constraint evitará duplicados)
    try {
      const result = await query(
        `INSERT INTO seguimiento_envios (
          seguimiento_id, 
          lead_id, 
          estado, 
          estado_editado_at_snapshot
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          seguimiento_id,
          lead_id,
          lead.estado,
          fechaSnapshot.toISOString()
        ]
      )

      console.log(`Seguimiento ${seguimiento_id} marcado como enviado para lead ${lead_id}`)
      return NextResponse.json({ success: true, envio: result.rows[0] })
    } catch (error: any) {
      console.error('Error al insertar seguimiento_envio:', error)
      // Si es error de duplicado, está bien (ya fue marcado)
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Ya estaba marcado como enviado' })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error al marcar seguimiento como enviado:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
