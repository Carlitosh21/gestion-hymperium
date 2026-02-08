import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT * FROM tareas WHERE cliente_id = $1 ORDER BY fecha_limite NULLS LAST, created_at DESC',
      [params.id]
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener tareas:', error)
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
    const { titulo, descripcion, responsable, fecha_limite } = body

    const result = await query(
      `INSERT INTO tareas (cliente_id, titulo, descripcion, responsable, fecha_limite)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        params.id,
        titulo,
        descripcion || null,
        responsable,
        fecha_limite || null,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear tarea:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
