import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireInternalSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let sql = 'SELECT * FROM sops WHERE 1=1'
    const values: any[] = []

    if (search) {
      sql += ' AND (titulo ILIKE $1 OR objetivo ILIKE $1 OR contenido_json::text ILIKE $1)'
      values.push(`%${search}%`)
    }

    sql += ' ORDER BY updated_at DESC'

    const result = await query(sql, values.length ? values : undefined)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener SOPs:', error)
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
    const { titulo, objetivo, contenido_json, frecuencia, owner, pasos } = body

    const sopResult = await query(
      `INSERT INTO sops (titulo, objetivo, contenido_json, frecuencia, owner)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        titulo || '',
        objetivo || null,
        contenido_json ? JSON.stringify(contenido_json) : '{}',
        frecuencia || null,
        owner || null,
      ]
    )
    const sop = sopResult.rows[0]
    const sopId = sop.id

    if (pasos && Array.isArray(pasos)) {
      for (let i = 0; i < pasos.length; i++) {
        const p = pasos[i]
        await query(
          `INSERT INTO sop_pasos (sop_id, titulo, descripcion, checklist_json, orden)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            sopId,
            p.titulo || '',
            p.descripcion || null,
            p.checklist_json ? JSON.stringify(p.checklist_json) : '[]',
            p.orden ?? i,
          ]
        )
      }
    }

    const full = await query(
      `SELECT s.*,
         (SELECT json_agg(p ORDER BY p.orden) FROM sop_pasos p WHERE p.sop_id = s.id) as pasos
       FROM sops s WHERE s.id = $1`,
      [sopId]
    )

    return NextResponse.json(full.rows[0])
  } catch (error: any) {
    console.error('Error al crear SOP:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
