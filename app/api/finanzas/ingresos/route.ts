import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT * FROM ingresos ORDER BY fecha DESC, created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener ingresos:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const {
      monto,
      descripcion,
      proyecto_id,
      tipo_proyecto,
      pago_desarrollador,
      porcentaje_carlitos,
      porcentaje_joaco,
      porcentaje_hymperium,
      fecha,
      estado,
    } = body

    const estadoVal = estado === 'pendiente' ? 'pendiente' : 'completado'

    const result = await query(
      `INSERT INTO ingresos (
        monto, descripcion, proyecto_id, tipo_proyecto,
        pago_desarrollador, porcentaje_carlitos, porcentaje_joaco, porcentaje_hymperium, fecha, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        monto,
        descripcion || null,
        proyecto_id || null,
        tipo_proyecto || null,
        pago_desarrollador || 0,
        porcentaje_carlitos || 0,
        porcentaje_joaco || 0,
        porcentaje_hymperium || 0,
        fecha || new Date().toISOString(),
        estadoVal,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear ingreso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
