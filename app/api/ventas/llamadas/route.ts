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
        c.nombre as cliente_nombre
      FROM llamadas l
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
    const { cliente_id, fecha, link_grabacion, notas } = body

    if (!cliente_id) {
      return NextResponse.json(
        { error: 'Cliente es requerido' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO llamadas (
        cliente_id, fecha, duracion, link_grabacion, notas, resultado
      )
      VALUES ($1, $2, NULL, $3, $4, NULL)
      RETURNING *`,
      [
        cliente_id,
        fecha,
        link_grabacion || null,
        notas || null,
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
