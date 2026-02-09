import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Función para parsear duración ISO8601 (PTxxMxxS) a segundos
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}

export async function POST() {
  try {
    await requireInternalSession()
    
    const n8nUrl = process.env.N8N_VIDEOS_URL
    if (!n8nUrl) {
      return NextResponse.json(
        { error: 'N8N_VIDEOS_URL no configurada' },
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
      throw new Error(`Error al obtener videos de n8n: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Extraer items de "Videos Subidos Carlitos"
    let videosData: any[] = []
    if (data && typeof data === 'object') {
      // Buscar la propiedad que contiene los videos
      if (data['Videos Subidos Carlitos'] && Array.isArray(data['Videos Subidos Carlitos'])) {
        videosData = data['Videos Subidos Carlitos']
      } else if (Array.isArray(data)) {
        videosData = data
      } else if (data.items && Array.isArray(data.items)) {
        videosData = data.items
      }
    }

    let inserted = 0
    let updated = 0

    // Procesar cada video de YouTube
    for (const item of videosData) {
      try {
        const videoId = item.id
        if (!videoId) continue

        const titulo = item.snippet?.title || null
        const thumbnailUrl = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || null
        const fechaPublicacion = item.snippet?.publishedAt || null
        const duracionISO = item.contentDetails?.duration || 'PT0S'
        const duracionSegundos = parseISO8601Duration(duracionISO)
        const tipo = duracionSegundos <= 180 ? 'short_form' : 'long_form'
        
        const viewCount = item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null
        const likeCount = item.statistics?.likeCount ? parseInt(item.statistics.likeCount, 10) : null
        const commentCount = item.statistics?.commentCount ? parseInt(item.statistics.commentCount, 10) : null

        const url = `https://www.youtube.com/watch?v=${videoId}`

        // Upsert usando ON CONFLICT con el índice único
        const result = await query(
          `INSERT INTO videos (
            plataforma, tipo, titulo, url, video_id, thumbnail_url, 
            duracion, fecha_publicacion, view_count, like_count, comment_count
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (plataforma, video_id) 
          DO UPDATE SET
            tipo = EXCLUDED.tipo,
            titulo = EXCLUDED.titulo,
            url = EXCLUDED.url,
            thumbnail_url = EXCLUDED.thumbnail_url,
            duracion = EXCLUDED.duracion,
            fecha_publicacion = EXCLUDED.fecha_publicacion,
            view_count = EXCLUDED.view_count,
            like_count = EXCLUDED.like_count,
            comment_count = EXCLUDED.comment_count,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *`,
          [
            'youtube',
            tipo,
            titulo,
            url,
            videoId,
            thumbnailUrl,
            duracionSegundos || null,
            fechaPublicacion || null,
            viewCount,
            likeCount,
            commentCount,
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
        console.error(`Error al procesar video ${item.id}:`, error.message)
        // Continuar con el siguiente video
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
    console.error('Error al sincronizar videos:', error)
    return NextResponse.json(
      { error: error.message || 'Error al sincronizar videos' },
      { status: 500 }
    )
  }
}
