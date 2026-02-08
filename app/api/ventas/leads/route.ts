import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export async function GET() {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT * FROM leads ORDER BY created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener leads:', error)
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
    const { nombre, email, telefono, origen, metodo_prospeccion, notas } = body

    const result = await query(
      `INSERT INTO leads (nombre, email, telefono, origen, metodo_prospeccion, notas, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'nuevo')
       RETURNING *`,
      [nombre, email || null, telefono || null, origen, metodo_prospeccion || null, notas || null]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear lead:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
