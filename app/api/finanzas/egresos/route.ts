import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT * FROM egresos ORDER BY fecha DESC, created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener egresos:', error)
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
    const { monto, descripcion, categoria, proyecto_id, fecha } = body

    const result = await query(
      `INSERT INTO egresos (monto, descripcion, categoria, proyecto_id, fecha)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        monto,
        descripcion,
        categoria,
        proyecto_id || null,
        fecha || new Date().toISOString(),
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear egreso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
