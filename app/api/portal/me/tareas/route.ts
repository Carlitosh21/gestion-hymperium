import { NextResponse } from 'next/server'
import { requireClientSession } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireClientSession()
    
    const result = await query(
      'SELECT * FROM tareas WHERE cliente_id = $1 ORDER BY fecha_limite NULLS LAST, created_at DESC',
      [session.cliente_id]
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al obtener tareas:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireClientSession()
    const body = await request.json()
    const { titulo, descripcion, fecha_limite } = body

    if (!titulo) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO tareas (cliente_id, titulo, descripcion, responsable, fecha_limite)
       VALUES ($1, $2, $3, 'ellos', $4)
       RETURNING *`,
      [session.cliente_id, titulo, descripcion || null, fecha_limite || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al crear tarea:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
