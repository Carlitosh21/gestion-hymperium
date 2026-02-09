import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()

    // Obtener solo ideas en estados posteriores a 'aceptada': long_form, short_form, programado
    const result = await query(
      `SELECT * FROM ideas_contenido 
       WHERE estado IN ('long_form', 'short_form', 'programado')
       ORDER BY updated_at DESC, created_at DESC`
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener ideas aprobadas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener ideas aprobadas' },
      { status: 500 }
    )
  }
}
