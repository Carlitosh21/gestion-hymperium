import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT * FROM recursos_cliente WHERE cliente_id = $1 ORDER BY created_at DESC',
      [params.id]
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener recursos:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { titulo, tipo, url, descripcion } = body

    const result = await query(
      `INSERT INTO recursos_cliente (cliente_id, titulo, tipo, url, descripcion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [params.id, titulo, tipo || 'link', url || null, descripcion || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear recurso:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
