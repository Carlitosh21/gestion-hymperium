import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM preguntas_onboarding WHERE activa = true ORDER BY orden ASC, created_at ASC'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener preguntas:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pregunta, tipo, opciones, orden } = body

    const result = await query(
      `INSERT INTO preguntas_onboarding (pregunta, tipo, opciones, orden, activa)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [
        pregunta,
        tipo || 'texto',
        opciones ? JSON.stringify(opciones) : null,
        orden || 0,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear pregunta:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
