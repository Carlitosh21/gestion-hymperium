import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      'SELECT * FROM resultados_cliente WHERE cliente_id = $1 ORDER BY created_at DESC',
      [params.id]
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener resultados:', error)
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
    const body = await request.json()
    const { titulo, descripcion } = body

    const result = await query(
      `INSERT INTO resultados_cliente (cliente_id, titulo, descripcion)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [params.id, titulo, descripcion || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear resultado:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
