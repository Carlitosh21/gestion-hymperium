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
    const { estado } = body

    if (!estado) {
      return NextResponse.json(
        { error: 'Estado es requerido' },
        { status: 400 }
      )
    }

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

    // Actualizar estado y estado_editado_at
    const result = await query(
      `UPDATE leads 
       SET estado = $1, estado_editado_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [estado, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    const lead = result.rows[0]

    // Si el estado es de conversión, indicar que requiere conversión
    const estadosConversion = ['seña', 'downsell', 'cerrado']
    const requiresConversion = estadosConversion.includes(estado) && !lead.cliente_id

    return NextResponse.json({
      ...lead,
      requiresConversion
    })
  } catch (error: any) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
