import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Validar API key
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.N8N_API_KEY

    if (!expectedApiKey) {
      console.error('N8N_API_KEY no configurada en variables de entorno')
      return NextResponse.json(
        { error: 'API key no configurada en el servidor' },
        { status: 500 }
      )
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 401 }
      )
    }

    // Obtener el body - puede venir como JSON o como string JSON
    let rawBody: any
    try {
      rawBody = await request.json()
    } catch (jsonError) {
      // Si falla el parse JSON, intentar como texto
      const textBody = await request.text()
      try {
        rawBody = JSON.parse(textBody)
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Body inválido: debe ser JSON válido' },
          { status: 400 }
        )
      }
    }

    // Si el body es un string, parsearlo
    let data: any = rawBody
    if (typeof rawBody === 'string') {
      try {
        data = JSON.parse(rawBody)
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Body debe ser JSON válido' },
          { status: 400 }
        )
      }
    }

    console.log('Datos recibidos de n8n (import):', JSON.stringify(data, null, 2))
    
    // Normalizar el JSON: el formato es un array donde cada elemento tiene "Ideas" o "ideas" que es un array
    let ideasData: any[] = []
    
    if (Array.isArray(data)) {
      // Aplanar el array: cada elemento puede tener "Ideas" o "ideas" que es un array
      data.forEach((item: any) => {
        // Manejar tanto "Ideas" (mayúscula) como "ideas" (minúscula)
        const ideasArray = item.Ideas || item.ideas
        if (ideasArray && Array.isArray(ideasArray)) {
          ideasData.push(...ideasArray)
        } else if (item.id_long_form || item.documentId || item.idea) {
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
        // Usar id_long_form como document_id (nuevo formato) o documentId (formato antiguo)
        const longDocId = item.id_long_form || item.documentId
        if (!longDocId) {
          console.warn('Item sin id_long_form/documentId, saltando:', item)
          continue
        }

        // Extraer id_reels (nuevo campo)
        const reelsDocId = item.id_reels || null

        // Parsear el campo "idea" que es un string JSON
        let ideaParsed: any = {}
        if (item.idea) {
          try {
            ideaParsed = typeof item.idea === 'string' ? JSON.parse(item.idea) : item.idea
          } catch (parseError) {
            console.error(`Error al parsear idea para documentId ${longDocId}:`, parseError)
            continue
          }
        }

        // Mapear título: priorizar ideaParsed.titulo (formato actual de n8n)
        const titulo = ideaParsed.titulo || ideaParsed.titulo_propuesto || ideaParsed.idea_titulo || ideaParsed.titulo_video || item.titulo_video || item.idea_titulo || item.titulo_propuesto || 'Sin título'
        // Descripción: si no viene, construir desde el resto del JSON
        let descripcionEstrategica = ideaParsed.descripcion_detallada || ideaParsed.descripcion_estrategica || item.descripcion_estrategica || item.descripcion_detallada || null
        if (!descripcionEstrategica && Object.keys(ideaParsed).length > 0) {
          const partes: string[] = []
          if (ideaParsed.pilar) partes.push(`Pilar: ${ideaParsed.pilar}`)
          if (ideaParsed.objetivo) partes.push(`Objetivo: ${ideaParsed.objetivo}`)
          if (ideaParsed.curiosity_gap) partes.push(`Curiosity Gap: ${ideaParsed.curiosity_gap}`)
          if (ideaParsed.que_valor_aporta) partes.push(`Valor que aporta: ${ideaParsed.que_valor_aporta}`)
          if (ideaParsed.parte_solucion_que_toca) partes.push(`Parte de solución: ${ideaParsed.parte_solucion_que_toca}`)
          if (ideaParsed.formato_recomendado) partes.push(`Formato recomendado: ${ideaParsed.formato_recomendado}`)
          if (ideaParsed.notas_extra) partes.push(`Notas extra: ${ideaParsed.notas_extra}`)
          descripcionEstrategica = partes.length > 0 ? partes.join('\n\n') : null
        }
        
        // Construir URLs de Google Docs
        const guionLongformUrl = `https://docs.google.com/document/d/${longDocId}/edit`
        const guionReelsUrl = reelsDocId ? `https://docs.google.com/document/d/${reelsDocId}/edit` : null
        
        console.log(`Procesando idea: documentId=${longDocId}, reelsDocId=${reelsDocId || 'N/A'}, titulo=${titulo.substring(0, 50)}...`)

        // Guardar el payload original de n8n para referencia
        const n8nPayload = JSON.stringify(item)

        // Upsert usando document_id como clave única
        console.log(`Intentando insertar/actualizar idea con documentId: ${longDocId}`)
        
        let result
        // Verificar primero si existe (fallback más robusto)
        const existing = await query(
          'SELECT id, created_at FROM ideas_contenido WHERE document_id = $1',
          [longDocId]
        )
        
        if (existing.rows.length > 0) {
          // Actualizar existente
          console.log(`Idea existente encontrada, actualizando...`)
          result = await query(
            `UPDATE ideas_contenido SET
              titulo = $1,
              descripcion_estrategica = $2,
              guion_longform_url = $3,
              reels_document_id = $4,
              guion_reels_url = $5,
              n8n_payload = $6::jsonb,
              updated_at = CURRENT_TIMESTAMP
            WHERE document_id = $7
            RETURNING *`,
            [titulo, descripcionEstrategica, guionLongformUrl, reelsDocId, guionReelsUrl, n8nPayload, longDocId]
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
              reels_document_id,
              guion_reels_url,
              n8n_payload,
              estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'pendiente')
            RETURNING *`,
            [titulo, descripcionEstrategica, longDocId, guionLongformUrl, reelsDocId, guionReelsUrl, n8nPayload]
          )
        }

        if (result.rows.length > 0) {
          // Usar la verificación previa para determinar si fue insert o update
          if (existing.rows.length > 0) {
            updated++
            console.log(`✓ Idea actualizada: ${titulo.substring(0, 50)}... (documentId: ${longDocId})`)
          } else {
            inserted++
            console.log(`✓ Idea insertada: ${titulo.substring(0, 50)}... (documentId: ${longDocId})`)
          }
        } else {
          console.warn(`⚠ No se retornó fila después de insertar/actualizar idea con documentId: ${longDocId}`)
        }
      } catch (error: any) {
        console.error(`✗ Error al procesar idea con documentId ${item.id_long_form || item.documentId || 'desconocido'}:`, {
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

    console.log(`Importación completada: ${inserted} nuevas, ${updated} actualizadas, ${ideasData.length} procesadas`)
    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total: inserted + updated,
      procesadas: ideasData.length,
    })
  } catch (error: any) {
    console.error('Error al importar ideas:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: error.message || 'Error al importar ideas',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
