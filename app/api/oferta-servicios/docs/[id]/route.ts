import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function saveRevision(entidadId: number, snapshot: object) {
  const versionResult = await query(
    `SELECT COALESCE(MAX(version), 0) + 1 as next_version
     FROM revisiones WHERE entidad_tipo = 'doc' AND entidad_id = $1`,
    [entidadId]
  )
  const version = parseInt(versionResult.rows[0]?.next_version || '1')

  await query(
    `INSERT INTO revisiones (entidad_tipo, entidad_id, version, snapshot_json)
     VALUES ('doc', $1, $2, $3)`,
    [entidadId, version, JSON.stringify(snapshot)]
  )
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    const result = await query('SELECT * FROM docs WHERE id = $1', [params.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Doc no encontrado' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al obtener doc:', error)
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
    const { titulo, contenido_json, tags, carpeta } = body

    const current = await query('SELECT * FROM docs WHERE id = $1', [params.id])
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Doc no encontrado' }, { status: 404 })
    }

    await saveRevision(parseInt(params.id), current.rows[0])

    const result = await query(
      `UPDATE docs SET
        titulo = COALESCE($1, titulo),
        contenido_json = COALESCE($2, contenido_json),
        tags = COALESCE($3, tags),
        carpeta = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [
        titulo ?? current.rows[0].titulo,
        contenido_json !== undefined ? JSON.stringify(contenido_json) : current.rows[0].contenido_json,
        tags !== undefined ? (Array.isArray(tags) ? tags : []) : current.rows[0].tags,
        carpeta !== undefined ? carpeta : current.rows[0].carpeta,
        params.id,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar doc:', error)
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
    const result = await query('DELETE FROM docs WHERE id = $1', [params.id])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Doc no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar doc:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
