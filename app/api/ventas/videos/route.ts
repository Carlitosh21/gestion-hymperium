import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireInternalSession()
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const plataforma = searchParams.get('plataforma')

    let sql = 'SELECT * FROM videos'
    const params: any[] = []
    const conditions: string[] = []

    if (tipo) {
      conditions.push(`tipo = $${params.length + 1}`)
      params.push(tipo)
    }

    if (plataforma) {
      conditions.push(`plataforma = $${params.length + 1}`)
      params.push(plataforma)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY fecha_publicacion DESC NULLS LAST, created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener videos:', error)
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
    const {
      plataforma,
      tipo,
      titulo,
      url,
      video_id,
      idea_contenido_id,
      thumbnail_url,
      duracion,
      fecha_publicacion,
    } = body

    const result = await query(
      `INSERT INTO videos (
        plataforma, tipo, titulo, url, video_id, idea_contenido_id,
        thumbnail_url, duracion, fecha_publicacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        plataforma,
        tipo,
        titulo || null,
        url,
        video_id || null,
        idea_contenido_id || null,
        thumbnail_url || null,
        duracion || null,
        fecha_publicacion || null,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear video:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
