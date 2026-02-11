import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function saveRevision(entidadId: number, snapshot: object) {
  const versionResult = await query(
    `SELECT COALESCE(MAX(version), 0) + 1 as next_version
     FROM revisiones WHERE entidad_tipo = 'oferta' AND entidad_id = $1`,
    [entidadId]
  )
  const version = parseInt(versionResult.rows[0]?.next_version || '1')

  await query(
    `INSERT INTO revisiones (entidad_tipo, entidad_id, version, snapshot_json)
     VALUES ('oferta', $1, $2, $3)`,
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
      `SELECT o.*,
         (SELECT json_agg(m ORDER BY m.orden) FROM oferta_modulos m WHERE m.oferta_id = o.id) as modulos,
         (SELECT json_agg(h ORDER BY h.orden) FROM oferta_hitos h WHERE h.oferta_id = o.id) as hitos
       FROM ofertas o WHERE o.id = $1`,
      [params.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al obtener oferta:', error)
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
    const { nombre, resumen, contenido_json, modulos, hitos } = body

    const current = await query(
      `SELECT o.*,
         (SELECT json_agg(m ORDER BY m.orden) FROM oferta_modulos m WHERE m.oferta_id = o.id) as modulos,
         (SELECT json_agg(h ORDER BY h.orden) FROM oferta_hitos h WHERE h.oferta_id = o.id) as hitos
       FROM ofertas o WHERE o.id = $1`,
      [params.id]
    )
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    }

    await saveRevision(parseInt(params.id), current.rows[0])

    const o = current.rows[0]
    await query(
      `UPDATE ofertas SET
        nombre = COALESCE($1, nombre),
        resumen = COALESCE($2, resumen),
        contenido_json = COALESCE($3, contenido_json),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [
        nombre ?? o.nombre,
        resumen !== undefined ? resumen : o.resumen,
        contenido_json !== undefined ? JSON.stringify(contenido_json) : o.contenido_json,
        params.id,
      ]
    )

    if (modulos !== undefined && Array.isArray(modulos)) {
      await query('DELETE FROM oferta_modulos WHERE oferta_id = $1', [params.id])
      for (let i = 0; i < modulos.length; i++) {
        const m = modulos[i]
        await query(
          `INSERT INTO oferta_modulos (oferta_id, titulo, descripcion, orden)
           VALUES ($1, $2, $3, $4)`,
          [params.id, m.titulo || '', m.descripcion || null, m.orden ?? i]
        )
      }
    }

    if (hitos !== undefined && Array.isArray(hitos)) {
      await query('DELETE FROM oferta_hitos WHERE oferta_id = $1', [params.id])
      for (let i = 0; i < hitos.length; i++) {
        const h = hitos[i]
        await query(
          `INSERT INTO oferta_hitos (oferta_id, titulo, descripcion, dias_desde_inicio, orden)
           VALUES ($1, $2, $3, $4, $5)`,
          [params.id, h.titulo || '', h.descripcion || null, h.dias_desde_inicio ?? null, h.orden ?? i]
        )
      }
    }

    const full = await query(
      `SELECT o.*,
         (SELECT json_agg(m ORDER BY m.orden) FROM oferta_modulos m WHERE m.oferta_id = o.id) as modulos,
         (SELECT json_agg(h ORDER BY h.orden) FROM oferta_hitos h WHERE h.oferta_id = o.id) as hitos
       FROM ofertas o WHERE o.id = $1`,
      [params.id]
    )

    return NextResponse.json(full.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar oferta:', error)
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
    const result = await query('DELETE FROM ofertas WHERE id = $1', [params.id])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar oferta:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
