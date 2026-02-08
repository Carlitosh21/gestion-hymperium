import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    // Solo devolver leads no convertidos (cliente_id IS NULL)
    const result = await query(
      `SELECT * FROM leads 
       WHERE cliente_id IS NULL 
       ORDER BY estado_editado_at DESC NULLS LAST, created_at DESC`
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
    const { usuario_ig, notas } = body

    if (!usuario_ig) {
      return NextResponse.json(
        { error: 'Usuario IG es requerido' },
        { status: 400 }
      )
    }

    // Usar usuario_ig como nombre por defecto si no hay nombre separado
    const nombre = usuario_ig

    const result = await query(
      `INSERT INTO leads (nombre, usuario_ig, origen, metodo_prospeccion, notas, estado, estado_editado_at)
       VALUES ($1, $2, 'prospeccion', 'Instagram', $3, 'mensaje_conexion', CURRENT_TIMESTAMP)
       RETURNING *`,
      [nombre, usuario_ig, notas || null]
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
