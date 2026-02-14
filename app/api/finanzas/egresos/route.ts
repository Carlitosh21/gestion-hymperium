import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission('finanzas.read')
    const result = await query(
      'SELECT * FROM egresos ORDER BY fecha DESC, created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al obtener egresos:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('finanzas.write')
    const body = await request.json()
    const { monto, descripcion, categoria, proyecto_id, fecha, estado } = body

    const estadoVal = estado === 'pendiente' ? 'pendiente' : 'completado'

    const result = await query(
      `INSERT INTO egresos (monto, descripcion, categoria, proyecto_id, fecha, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        monto,
        descripcion,
        categoria,
        proyecto_id || null,
        fecha || new Date().toISOString(),
        estadoVal,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al crear egreso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
