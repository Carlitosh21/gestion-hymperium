import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission('estadisticas.view')

    const [totalRes, porClienteRes, avgEntregaRes] = await Promise.all([
      query('SELECT COUNT(*) as total FROM clientes'),
      query(`
        SELECT 
          c.id,
          c.nombre,
          c.email,
          c.estado_entrega,
          COALESCE(SUM(i.monto), 0) as total_pagado
        FROM clientes c
        LEFT JOIN ingresos i ON i.tipo_proyecto = 'cliente' AND i.proyecto_id = c.id AND COALESCE(i.estado, 'completado') = 'completado'
        GROUP BY c.id, c.nombre, c.email, c.estado_entrega
        ORDER BY total_pagado DESC
      `),
      query(`
        SELECT ROUND(AVG(estado_entrega)::numeric, 1) as promedio
        FROM clientes
      `),
    ])

    return NextResponse.json({
      totalClientes: parseInt(totalRes.rows[0]?.total || '0'),
      promedioEntrega: parseFloat(avgEntregaRes.rows[0]?.promedio || '0'),
      clientes: porClienteRes.rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        email: r.email,
        estado_entrega: r.estado_entrega,
        total_pagado: parseFloat(r.total_pagado || '0'),
      })),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: error.message === 'Forbidden' ? 403 : 401 }
      )
    }
    console.error('Error al obtener estadísticas de clientes:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
