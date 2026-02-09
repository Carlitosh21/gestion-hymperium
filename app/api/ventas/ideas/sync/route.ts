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
    console.log('Datos recibidos de n8n:', JSON.stringify(data, null, 2))
    
    // Normalizar el JSON: el formato es un array donde cada elemento tiene "Ideas" o "ideas" que es un array
    let ideasData: any[] = []
    
    if (Array.isArray(data)) {
      // Aplanar el array: cada elemento puede tener "Ideas" o "ideas" que es un array
      data.forEach((item: any) => {
        // Manejar tanto "Ideas" (mayúscula) como "ideas" (minúscula)
        const ideasArray = item.Ideas || item.ideas
        if (ideasArray && Array.isArray(ideasArray)) {
          ideasData.push(...ideasArray)
        } else if (item.documentId || item.idea) {
          // Si ya está aplanado
          ideasData.push(item)
        }
      })
    } else {
      // Manejar tanto "Ideas" (mayúscula) como "ideas" (minúscula)
      const ideasArray = data.Ideas || data.ideas
      if (ideasArray && Array.isArray(ideasArray)) {
        ideasData = ideasArray
      }
    }
    
    console.log(`Total de ideas normalizadas: ${ideasData.length}`)

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

        // Mapear campos: n8n usa idea_titulo y descripcion_detallada
        const titulo = ideaParsed.idea_titulo || ideaParsed.titulo_video || item.titulo_video || item.idea_titulo || 'Sin título'
        const descripcionEstrategica = ideaParsed.descripcion_detallada || ideaParsed.descripcion_estrategica || item.descripcion_estrategica || item.descripcion_detallada || null
        const guionLongformUrl = `https://docs.google.com/document/d/${documentId}/edit`
        
        console.log(`Procesando idea: documentId=${documentId}, titulo=${titulo.substring(0, 50)}...`)

        // Guardar el payload original de n8n para referencia
        const n8nPayload = JSON.stringify(item)

        // Upsert usando document_id como clave única
        console.log(`Intentando insertar/actualizar idea con documentId: ${documentId}`)
        
        let result
        // Verificar primero si existe (fallback más robusto)
        const existing = await query(
          'SELECT id, created_at FROM ideas_contenido WHERE document_id = $1',
          [documentId]
        )
        
        if (existing.rows.length > 0) {
          // Actualizar existente
          console.log(`Idea existente encontrada, actualizando...`)
          result = await query(
            `UPDATE ideas_contenido SET
              titulo = $1,
              descripcion_estrategica = $2,
              guion_longform_url = $3,
              n8n_payload = $4::jsonb,
              updated_at = CURRENT_TIMESTAMP
            WHERE document_id = $5
            RETURNING *`,
            [titulo, descripcionEstrategica, guionLongformUrl, n8nPayload, documentId]
          )
        } else {
          // Insertar nuevo
          console.log(`Idea nueva, insertando...`)
          result = await query(
            `INSERT INTO ideas_contenido (
              titulo,
              descripcion_estrategica,
              document_id,
              guion_longform_url,
              n8n_payload,
              estado
            )
            VALUES ($1, $2, $3, $4, $5::jsonb, 'pendiente')
            RETURNING *`,
            [titulo, descripcionEstrategica, documentId, guionLongformUrl, n8nPayload]
          )
        }

        if (result.rows.length > 0) {
          const row = result.rows[0]
          // Usar la verificación previa para determinar si fue insert o update
          if (existing.rows.length > 0) {
            updated++
            console.log(`✓ Idea actualizada: ${titulo.substring(0, 50)}... (documentId: ${documentId})`)
          } else {
            inserted++
            console.log(`✓ Idea insertada: ${titulo.substring(0, 50)}... (documentId: ${documentId})`)
          }
        } else {
          console.warn(`⚠ No se retornó fila después de insertar/actualizar idea con documentId: ${documentId}`)
        }
      } catch (error: any) {
        console.error(`✗ Error al procesar idea con documentId ${item.documentId || 'desconocido'}:`, {
          message: error.message,
          code: error.code,
          detail: error.detail,
          constraint: error.constraint,
          stack: error.stack
        })
        // Continuar con la siguiente idea
        continue
      }
    }

    console.log(`Sincronización completada: ${inserted} nuevas, ${updated} actualizadas, ${ideasData.length} procesadas`)
    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total: inserted + updated,
      procesadas: ideasData.length,
    })
  } catch (error: any) {
    console.error('Error al sincronizar ideas:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: error.message || 'Error al sincronizar ideas',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
