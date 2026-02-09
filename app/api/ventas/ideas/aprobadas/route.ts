import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Validar API key (igual que el POST)
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.N8N_API_KEY

    if (!expectedApiKey) {
      console.error('N8N_API_KEY no configurada en variables de entorno')
      return NextResponse.json(
        { error: 'API key no configurada en el servidor' },
        { status: 500 }
      )
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 401 }
      )
    }

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
