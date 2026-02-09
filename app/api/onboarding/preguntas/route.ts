import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET público: lista preguntas activas ordenadas
// Si se pasa ?all=true y hay sesión interna, devuelve todas (activas e inactivas)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    
    // Si se pide todas, verificar sesión interna
    let includeInactivas = false
    if (all) {
      try {
        await requireInternalSession()
        includeInactivas = true
      } catch {
        // Si no hay sesión, solo devolver activas
        includeInactivas = false
      }
    }
    
    const querySQL = includeInactivas
      ? 'SELECT * FROM preguntas_onboarding ORDER BY orden ASC, created_at ASC'
      : 'SELECT id, titulo, descripcion, pregunta, tipo, opciones, orden FROM preguntas_onboarding WHERE activa = true ORDER BY orden ASC, created_at ASC'
    
    const result = await query(querySQL)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener preguntas:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST interno: crear pregunta (requiere sesión interna)
export async function POST(request: Request) {
  try {
    await requireInternalSession()
    
    const body = await request.json()
    const { titulo, descripcion, pregunta, tipo, opciones, orden } = body

    // Usar titulo si existe, sino pregunta (compatibilidad hacia atrás)
    const tituloFinal = titulo || pregunta
    if (!tituloFinal) {
      return NextResponse.json(
        { error: 'Título o pregunta es requerido' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO preguntas_onboarding (titulo, descripcion, pregunta, tipo, opciones, orden, activa)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        tituloFinal,
        descripcion || null,
        pregunta || tituloFinal, // Mantener pregunta para compatibilidad
        tipo || 'texto',
        opciones ? JSON.stringify(opciones) : null,
        orden || 0,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al crear pregunta:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
