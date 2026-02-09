import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireInternalSession()
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')

    let sql = 'SELECT * FROM ideas_contenido'
    const params: any[] = []
    const conditions: string[] = []

    if (estado) {
      // Soportar múltiples estados separados por coma
      const estados = estado.split(',').map(e => e.trim()).filter(e => e)
      if (estados.length > 0) {
        const placeholders = estados.map((_, i) => `$${params.length + i + 1}`).join(', ')
        conditions.push(`estado IN (${placeholders})`)
        params.push(...estados)
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error al obtener ideas:', error)
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
      titulo, 
      titulo_video, 
      descripcion, 
      descripcion_estrategica,
      documentId,
      document_id,
      guion_longform_url 
    } = body

    // Usar titulo_video si existe, sino titulo
    const tituloFinal = titulo_video || titulo
    if (!tituloFinal) {
      return NextResponse.json(
        { error: 'Título es requerido' },
        { status: 400 }
      )
    }

    // Construir guion_longform_url si viene documentId/document_id
    let guionUrl = guion_longform_url
    if (!guionUrl) {
      const docId = documentId || document_id
      if (docId) {
        guionUrl = `https://docs.google.com/document/d/${docId}/edit`
      }
    }

    const result = await query(
      `INSERT INTO ideas_contenido (
        titulo, 
        descripcion, 
        descripcion_estrategica,
        document_id,
        guion_longform_url,
        estado
      )
       VALUES ($1, $2, $3, $4, $5, 'pendiente')
       RETURNING *`,
      [
        tituloFinal,
        descripcion || null,
        descripcion_estrategica || null,
        documentId || document_id || null,
        guionUrl || null
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al crear idea:', error)
    // Si es error de duplicado por document_id, devolver error específico
    if (error.code === '23505' && error.constraint?.includes('document_id')) {
      return NextResponse.json(
        { error: 'Ya existe una idea con este document_id' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
