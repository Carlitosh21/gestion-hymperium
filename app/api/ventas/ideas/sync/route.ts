import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireInternalSession()
    
    const n8nUrl = process.env.N8N_IDEAS_URL
    if (!n8nUrl) {
      return NextResponse.json(
        { error: 'N8N_IDEAS_URL no configurada' },
        { status: 500 }
      )
    }

    // Fetch desde n8n
    const response = await fetch(n8nUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Error al obtener ideas de n8n: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Normalizar el JSON: el formato es un array donde cada elemento tiene "Ideas" que es un array
    let ideasData: any[] = []
    
    if (Array.isArray(data)) {
      // Aplanar el array: cada elemento puede tener "Ideas" que es un array
      data.forEach((item: any) => {
        if (item.Ideas && Array.isArray(item.Ideas)) {
          ideasData.push(...item.Ideas)
        } else if (item.documentId || item.idea) {
          // Si ya está aplanado
          ideasData.push(item)
        }
      })
    } else if (data.Ideas && Array.isArray(data.Ideas)) {
      ideasData = data.Ideas
    }

    let inserted = 0
    let updated = 0

    // Procesar cada idea
    for (const item of ideasData) {
      try {
        const documentId = item.documentId
        if (!documentId) {
          console.warn('Item sin documentId, saltando:', item)
          continue
        }

        // Parsear el campo "idea" que es un string JSON
        let ideaParsed: any = {}
        if (item.idea) {
          try {
            ideaParsed = typeof item.idea === 'string' ? JSON.parse(item.idea) : item.idea
          } catch (parseError) {
            console.error(`Error al parsear idea para documentId ${documentId}:`, parseError)
            continue
          }
        }

        const titulo = ideaParsed.titulo_video || item.titulo_video || 'Sin título'
        const descripcionEstrategica = ideaParsed.descripcion_estrategica || item.descripcion_estrategica || null
        const guionLongformUrl = `https://docs.google.com/document/d/${documentId}/edit`

        // Guardar el payload original de n8n para referencia
        const n8nPayload = JSON.stringify(item)

        // Upsert usando document_id como clave única
        const result = await query(
          `INSERT INTO ideas_contenido (
            titulo,
            descripcion_estrategica,
            document_id,
            guion_longform_url,
            n8n_payload,
            estado
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, 'pendiente')
          ON CONFLICT (document_id) 
          DO UPDATE SET
            titulo = EXCLUDED.titulo,
            descripcion_estrategica = EXCLUDED.descripcion_estrategica,
            guion_longform_url = EXCLUDED.guion_longform_url,
            n8n_payload = EXCLUDED.n8n_payload,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *`,
          [
            titulo,
            descripcionEstrategica,
            documentId,
            guionLongformUrl,
            n8nPayload
          ]
        )

        if (result.rows.length > 0) {
          // Verificar si fue insert o update comparando created_at y updated_at
          const row = result.rows[0]
          if (row.created_at === row.updated_at) {
            inserted++
          } else {
            updated++
          }
        }
      } catch (error: any) {
        console.error(`Error al procesar idea ${item.documentId}:`, error.message)
        // Continuar con la siguiente idea
        continue
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total: inserted + updated,
    })
  } catch (error: any) {
    console.error('Error al sincronizar ideas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al sincronizar ideas' },
      { status: 500 }
    )
  }
}
