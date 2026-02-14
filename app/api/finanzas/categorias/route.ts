import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission('finanzas.read')
    const result = await query(
      'SELECT * FROM categorias_billetera ORDER BY nombre'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al obtener categorías:', error)
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
    const { nombre, porcentaje, descripcion } = body

    const result = await query(
      `INSERT INTO categorias_billetera (nombre, porcentaje, descripcion)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre, porcentaje, descripcion || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
