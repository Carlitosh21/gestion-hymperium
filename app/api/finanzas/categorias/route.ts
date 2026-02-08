import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM categorias_billetera ORDER BY nombre'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, porcentaje, descripcion } = body

    const result = await query(
      `INSERT INTO categorias_billetera (nombre, porcentaje, descripcion)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre, porcentaje, descripcion || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
