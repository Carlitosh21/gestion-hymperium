import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { seguimiento_id, lead_id } = body

    if (!seguimiento_id || !lead_id) {
      return NextResponse.json(
        { error: 'seguimiento_id y lead_id son requeridos' },
        { status: 400 }
      )
    }

    // Obtener el estado actual del lead y su estado_editado_at REAL desde la DB
    // Esto asegura que usamos el timestamp exacto de PostgreSQL, no el del frontend
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

    // Validar que el lead tiene estado_editado_at
    if (!lead.estado_editado_at) {
      return NextResponse.json(
        { error: 'El lead no tiene fecha de última edición' },
        { status: 400 }
      )
    }

    // Usar el estado_editado_at REAL de la DB (ya es un timestamp de PostgreSQL)
    // No necesitamos convertir, PostgreSQL lo maneja directamente
    const estadoEditadoAtSnapshot = lead.estado_editado_at

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
          estadoEditadoAtSnapshot
        ]
      )

      console.log(`Seguimiento ${seguimiento_id} marcado como enviado para lead ${lead_id} con snapshot ${estadoEditadoAtSnapshot}`)
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
