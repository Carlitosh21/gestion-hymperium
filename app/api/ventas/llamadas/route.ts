import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    const result = await query(`
      SELECT 
        l.*,
        le.nombre as lead_nombre,
        c.nombre as cliente_nombre
      FROM llamadas l
      LEFT JOIN leads le ON l.lead_id = le.id
      LEFT JOIN clientes c ON l.cliente_id = c.id
      ORDER BY l.fecha DESC
    `)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener llamadas:', error)
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
    const { lead_id, cliente_id, fecha, link_grabacion, notas, resultado } = body

    const result = await query(
      `INSERT INTO llamadas (
        lead_id, cliente_id, fecha, duracion, link_grabacion, notas, resultado
      )
      VALUES ($1, $2, $3, NULL, $4, $5, $6)
      RETURNING *`,
      [
        lead_id || null,
        cliente_id || null,
        fecha,
        link_grabacion || null,
        notas || null,
        resultado || null,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear llamada:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
