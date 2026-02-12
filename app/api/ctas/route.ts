import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT id, accionable, detalles, recurso FROM ctas ORDER BY id ASC'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener CTAs:', error)
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
    const { accionable, detalles, recurso } = body

    const result = await query(
      `INSERT INTO ctas (accionable, detalles, recurso)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [accionable || '', detalles || '', recurso || '']
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear CTA:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
