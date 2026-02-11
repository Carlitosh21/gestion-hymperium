import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function saveRevision(entidadId: number, snapshot: object) {
  const versionResult = await query(
    `SELECT COALESCE(MAX(version), 0) + 1 as next_version
     FROM revisiones WHERE entidad_tipo = 'sop' AND entidad_id = $1`,
    [entidadId]
  )
  const version = parseInt(versionResult.rows[0]?.next_version || '1')

  await query(
    `INSERT INTO revisiones (entidad_tipo, entidad_id, version, snapshot_json)
     VALUES ('sop', $1, $2, $3)`,
    [entidadId, version, JSON.stringify(snapshot)]
  )
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const result = await query(
      `SELECT s.*,
         (SELECT json_agg(p ORDER BY p.orden) FROM sop_pasos p WHERE p.sop_id = s.id) as pasos
       FROM sops s WHERE s.id = $1`,
      [params.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'SOP no encontrado' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al obtener SOP:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { titulo, objetivo, contenido_json, frecuencia, owner, pasos } = body

    const current = await query(
      `SELECT s.*,
         (SELECT json_agg(p ORDER BY p.orden) FROM sop_pasos p WHERE p.sop_id = s.id) as pasos
       FROM sops s WHERE s.id = $1`,
      [params.id]
    )
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'SOP no encontrado' }, { status: 404 })
    }

    await saveRevision(parseInt(params.id), current.rows[0])

    const s = current.rows[0]
    await query(
      `UPDATE sops SET
        titulo = COALESCE($1, titulo),
        objetivo = COALESCE($2, objetivo),
        contenido_json = COALESCE($3, contenido_json),
        frecuencia = COALESCE($4, frecuencia),
        owner = COALESCE($5, owner),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6`,
      [
        titulo ?? s.titulo,
        objetivo !== undefined ? objetivo : s.objetivo,
        contenido_json !== undefined ? JSON.stringify(contenido_json) : s.contenido_json,
        frecuencia !== undefined ? frecuencia : s.frecuencia,
        owner !== undefined ? owner : s.owner,
        params.id,
      ]
    )

    if (pasos !== undefined && Array.isArray(pasos)) {
      await query('DELETE FROM sop_pasos WHERE sop_id = $1', [params.id])
      for (let i = 0; i < pasos.length; i++) {
        const p = pasos[i]
        await query(
          `INSERT INTO sop_pasos (sop_id, titulo, descripcion, checklist_json, orden)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            params.id,
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
      [params.id]
    )

    return NextResponse.json(full.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar SOP:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const result = await query('DELETE FROM sops WHERE id = $1', [params.id])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'SOP no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar SOP:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
