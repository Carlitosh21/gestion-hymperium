import { NextResponse } from 'next/server'
import { requireClientSession } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireClientSession()
    
    const result = await query(
      'SELECT * FROM recursos_cliente WHERE cliente_id = $1 ORDER BY created_at DESC',
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
    console.error('Error al obtener recursos:', error)
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
    const { titulo, tipo, url, descripcion } = body

    if (!titulo) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO recursos_cliente (cliente_id, titulo, tipo, url, descripcion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [session.cliente_id, titulo, tipo || 'link', url || null, descripcion || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al obtener recursos:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
