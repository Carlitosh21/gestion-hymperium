import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    const result = await query(
      `SELECT id, manychat_id, nombre, username, estado, ultima_interaccion, created_at
       FROM leads
       ORDER BY COALESCE(ultima_interaccion, created_at) DESC NULLS LAST, id DESC`
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
