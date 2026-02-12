import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()

    const clienteId = params.id
    if (!clienteId || !/^\d+$/.test(clienteId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    // 1) Buscar lead con cliente_id directo
    let result = await query(
      `SELECT id, manychat_id, nombre, username, estado, ultima_interaccion, created_at
       FROM leads
       WHERE cliente_id = $1
       LIMIT 1`,
      [clienteId]
    )

    if (result.rows.length > 0) {
      return NextResponse.json(result.rows[0])
    }

    // 2) Buscar vía llamadas: lead_id desde llamadas con cliente_id
    try {
      result = await query(
        `SELECT l.id, l.manychat_id, l.nombre, l.username, l.estado, l.ultima_interaccion, l.created_at
         FROM leads l
         INNER JOIN llamadas ll ON ll.lead_id = l.id
         WHERE ll.cliente_id = $1
         ORDER BY ll.fecha DESC
         LIMIT 1`,
        [clienteId]
      )

      if (result.rows.length > 0) {
        return NextResponse.json(result.rows[0])
      }
    } catch (err: any) {
      if (err.code === '42P01') {
        // Tabla llamadas no existe
      } else {
        throw err
      }
    }

    return NextResponse.json(
      { error: 'No hay lead asociado a este cliente' },
      { status: 404 }
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en /api/clientes/[id]/lead:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener lead' },
      { status: 500 }
    )
  }
}
