import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireInternalSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let sql = 'SELECT * FROM ofertas WHERE 1=1'
    const values: any[] = []

    if (search) {
      sql += ' AND (nombre ILIKE $1 OR resumen ILIKE $1 OR contenido_json::text ILIKE $1)'
      values.push(`%${search}%`)
    }

    sql += ' ORDER BY updated_at DESC'

    const result = await query(sql, values.length ? values : undefined)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener ofertas:', error)
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
    const { nombre, resumen, contenido_json, modulos, hitos } = body

    const ofertaResult = await query(
      `INSERT INTO ofertas (nombre, resumen, contenido_json)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        nombre || '',
        resumen || null,
        contenido_json ? JSON.stringify(contenido_json) : '{}',
      ]
    )
    const oferta = ofertaResult.rows[0]
    const ofertaId = oferta.id

    if (modulos && Array.isArray(modulos)) {
      for (let i = 0; i < modulos.length; i++) {
        const m = modulos[i]
        await query(
          `INSERT INTO oferta_modulos (oferta_id, titulo, descripcion, orden)
           VALUES ($1, $2, $3, $4)`,
          [ofertaId, m.titulo || '', m.descripcion || null, m.orden ?? i]
        )
      }
    }

    if (hitos && Array.isArray(hitos)) {
      for (let i = 0; i < hitos.length; i++) {
        const h = hitos[i]
        await query(
          `INSERT INTO oferta_hitos (oferta_id, titulo, descripcion, dias_desde_inicio, orden)
           VALUES ($1, $2, $3, $4, $5)`,
          [ofertaId, h.titulo || '', h.descripcion || null, h.dias_desde_inicio ?? null, h.orden ?? i]
        )
      }
    }

    const full = await query(
      `SELECT o.*,
         (SELECT json_agg(m ORDER BY m.orden) FROM oferta_modulos m WHERE m.oferta_id = o.id) as modulos,
         (SELECT json_agg(h ORDER BY h.orden) FROM oferta_hitos h WHERE h.oferta_id = o.id) as hitos
       FROM ofertas o WHERE o.id = $1`,
      [ofertaId]
    )

    return NextResponse.json(full.rows[0])
  } catch (error: any) {
    console.error('Error al crear oferta:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
