import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireInternalSession()
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || ''
    const id = searchParams.get('id') || ''

    if (!tipo || !id) {
      return NextResponse.json(
        { error: 'Se requieren tipo e id' },
        { status: 400 }
      )
    }

    const result = await query(
      `SELECT id, version, created_at
       FROM revisiones
       WHERE entidad_tipo = $1 AND entidad_id = $2
       ORDER BY version DESC`,
      [tipo, id]
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener revisiones:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
