import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()

    // Obtener seguimientos activos con sus estados y leads que cumplen condiciones
    const result = await query(
      `SELECT 
        s.id as seguimiento_id,
        s.nombre as seguimiento_nombre,
        s.mensaje as seguimiento_mensaje,
        s.delay_horas,
        l.id as lead_id,
        l.nombre as lead_nombre,
        l.usuario_ig,
        l.estado as lead_estado,
        l.estado_editado_at,
        EXTRACT(EPOCH FROM (NOW() - l.estado_editado_at)) / 3600 as horas_desde_edicion
      FROM seguimientos s
      INNER JOIN seguimiento_estados se ON s.id = se.seguimiento_id
      INNER JOIN leads l ON l.estado = se.estado
      LEFT JOIN seguimiento_envios env ON 
        env.seguimiento_id = s.id 
        AND env.lead_id = l.id 
        AND env.estado_editado_at_snapshot = l.estado_editado_at
      WHERE 
        s.activo = true
        AND l.cliente_id IS NULL
        AND l.estado_editado_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (NOW() - l.estado_editado_at)) / 3600 >= s.delay_horas
        AND env.id IS NULL
      ORDER BY s.id, l.estado_editado_at ASC`
    )

    // Agrupar por seguimiento
    const grouped: Record<number, any> = {}
    
    result.rows.forEach((row: any) => {
      const seguimientoId = row.seguimiento_id
      if (!grouped[seguimientoId]) {
        grouped[seguimientoId] = {
          id: seguimientoId,
          nombre: row.seguimiento_nombre,
          mensaje: row.seguimiento_mensaje,
          delay_horas: row.delay_horas,
          leads: []
        }
      }
      
      grouped[seguimientoId].leads.push({
        id: row.lead_id,
        nombre: row.lead_nombre,
        usuario_ig: row.usuario_ig,
        estado: row.lead_estado,
        estado_editado_at: row.estado_editado_at,
        horas_desde_edicion: Math.floor(row.horas_desde_edicion)
      })
    })

    return NextResponse.json(Object.values(grouped))
  } catch (error: any) {
    console.error('Error al obtener seguimientos pendientes:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
