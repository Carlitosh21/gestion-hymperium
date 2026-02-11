import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireInternalSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''
    const folder = searchParams.get('folder') || ''

    let sql = 'SELECT * FROM docs WHERE 1=1'
    const values: any[] = []
    let paramIndex = 1

    if (search) {
      sql += ` AND (titulo ILIKE $${paramIndex} OR contenido_json::text ILIKE $${paramIndex})`
      values.push(`%${search}%`)
      paramIndex++
    }
    if (tag) {
      sql += ` AND $${paramIndex} = ANY(tags)`
      values.push(tag)
      paramIndex++
    }
    if (folder) {
      sql += ` AND carpeta = $${paramIndex}`
      values.push(folder)
      paramIndex++
    }

    sql += ' ORDER BY updated_at DESC'

    const result = await query(sql, values)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener docs:', error)
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
    const { titulo, contenido_json, tags, carpeta } = body

    const result = await query(
      `INSERT INTO docs (titulo, contenido_json, tags, carpeta)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        titulo || '',
        contenido_json ? JSON.stringify(contenido_json) : '{}',
        tags && Array.isArray(tags) ? tags : [],
        carpeta || null,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear doc:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
