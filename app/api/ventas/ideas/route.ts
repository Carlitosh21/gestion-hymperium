import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')

    let sql = 'SELECT * FROM ideas_contenido'
    const params: any[] = []

    if (estado) {
      sql += ' WHERE estado = $1'
      params.push(estado)
    }

    sql += ' ORDER BY created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener ideas:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { titulo, descripcion } = body

    const result = await query(
      `INSERT INTO ideas_contenido (titulo, descripcion, estado)
       VALUES ($1, $2, 'pendiente')
       RETURNING *`,
      [titulo, descripcion || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear idea:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
