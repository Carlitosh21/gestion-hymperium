import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  
  switch (range) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    case 'all':
    default:
      startDate.setFullYear(2000, 0, 1) // Fecha muy antigua
      break
  }
  
  startDate.setHours(0, 0, 0, 0)
  
  return { startDate, endDate }
}

export async function GET(request: Request) {
  try {
    await requireInternalSession()
    
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    const { startDate, endDate } = getDateRange(range)
    
    // PROSPECCIÓN: Timeseries de leads nuevos por día
    const leadsNuevosResult = await query(
      `SELECT 
        DATE(created_at) as dia,
        COUNT(*) as count
      FROM leads
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY dia ASC`,
      [startDate, endDate]
    )
    
    const timeseriesLeadsNuevos = leadsNuevosResult.rows.map((row: any) => ({
      dia: new Date(row.dia).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      count: parseInt(row.count)
    }))
    
    // PROSPECCIÓN: Total de leads creados en el período
    const totalLeadsResult = await query(
      `SELECT COUNT(*) as total FROM leads WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    )
    const totalLeads = parseInt(totalLeadsResult.rows[0]?.total || '0')
    
    // PROSPECCIÓN: Tasa de respuesta (mensaje_conexion → respondio)
    // Usar eventos si existen, sino aproximar con estado actual
    let tasaRespuesta = 0
    try {
      const respuestaResult = await query(
        `SELECT COUNT(DISTINCT lead_id) as count
         FROM lead_estado_eventos
         WHERE from_estado = 'mensaje_conexion' 
           AND to_estado = 'respondio'
           AND changed_at >= $1 AND changed_at <= $2`,
        [startDate, endDate]
      )
      const respuestas = parseInt(respuestaResult.rows[0]?.count || '0')
      tasaRespuesta = totalLeads > 0 ? respuestas / totalLeads : 0
    } catch (error: any) {
      // Si no existe la tabla de eventos, aproximar con estado actual
      if (error.code === '42P01') {
        const respuestaAproxResult = await query(
          `SELECT COUNT(*) as count FROM leads 
           WHERE estado = 'respondio' 
             AND created_at >= $1 AND created_at <= $2`,
          [startDate, endDate]
        )
        const respuestasAprox = parseInt(respuestaAproxResult.rows[0]?.count || '0')
        tasaRespuesta = totalLeads > 0 ? respuestasAprox / totalLeads : 0
      }
    }
    
    // PROSPECCIÓN: Tasa de agenda (transiciones a llamada_agendada o llamada_reagendada)
    let tasaAgenda = 0
    try {
      const agendaResult = await query(
        `SELECT COUNT(DISTINCT lead_id) as count
         FROM lead_estado_eventos
         WHERE to_estado IN ('llamada_agendada', 'llamada_reagendada')
           AND changed_at >= $1 AND changed_at <= $2`,
        [startDate, endDate]
      )
      const agendas = parseInt(agendaResult.rows[0]?.count || '0')
      tasaAgenda = totalLeads > 0 ? agendas / totalLeads : 0
    } catch (error: any) {
      if (error.code === '42P01') {
        const agendaAproxResult = await query(
          `SELECT COUNT(*) as count FROM leads 
           WHERE estado IN ('llamada_agendada', 'llamada_reagendada')
             AND created_at >= $1 AND created_at <= $2`,
          [startDate, endDate]
        )
        const agendasAprox = parseInt(agendaAproxResult.rows[0]?.count || '0')
        tasaAgenda = totalLeads > 0 ? agendasAprox / totalLeads : 0
      }
    }
    
    // PROSPECCIÓN: Tasa de cierre (leads convertidos a cliente)
    const cierreResult = await query(
      `SELECT COUNT(*) as count FROM leads 
       WHERE cliente_id IS NOT NULL 
         AND created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    )
    const cierres = parseInt(cierreResult.rows[0]?.count || '0')
    const tasaCierre = totalLeads > 0 ? cierres / totalLeads : 0
    
    // PROSPECCIÓN: Seguimientos enviados
    const seguimientosResult = await query(
      `SELECT COUNT(*) as count FROM seguimiento_envios 
       WHERE enviado_at >= $1 AND enviado_at <= $2`,
      [startDate, endDate]
    )
    const seguimientosEnviados = parseInt(seguimientosResult.rows[0]?.count || '0')
    
    // LLAMADAS: Agendadas (transiciones a llamada_agendada o llamada_reagendada)
    let agendadas = 0
    try {
      const agendadasResult = await query(
        `SELECT COUNT(DISTINCT lead_id) as count
         FROM lead_estado_eventos
         WHERE to_estado IN ('llamada_agendada', 'llamada_reagendada')
           AND changed_at >= $1 AND changed_at <= $2`,
        [startDate, endDate]
      )
      agendadas = parseInt(agendadasResult.rows[0]?.count || '0')
    } catch (error: any) {
      if (error.code === '42P01') {
        const agendadasAproxResult = await query(
          `SELECT COUNT(*) as count FROM leads 
           WHERE estado IN ('llamada_agendada', 'llamada_reagendada')
             AND created_at >= $1 AND created_at <= $2`,
          [startDate, endDate]
        )
        agendadas = parseInt(agendadasAproxResult.rows[0]?.count || '0')
      }
    }
    
    // LLAMADAS: Reagendadas
    let reagendadas = 0
    try {
      const reagendadasResult = await query(
        `SELECT COUNT(DISTINCT lead_id) as count
         FROM lead_estado_eventos
         WHERE to_estado = 'llamada_reagendada'
           AND changed_at >= $1 AND changed_at <= $2`,
        [startDate, endDate]
      )
      reagendadas = parseInt(reagendadasResult.rows[0]?.count || '0')
    } catch (error: any) {
      if (error.code === '42P01') {
        const reagendadasAproxResult = await query(
          `SELECT COUNT(*) as count FROM leads 
           WHERE estado = 'llamada_reagendada'
             AND created_at >= $1 AND created_at <= $2`,
          [startDate, endDate]
        )
        reagendadas = parseInt(reagendadasAproxResult.rows[0]?.count || '0')
      }
    }
    
    // LLAMADAS: Show-up (1 - no_se_presento / agendadas)
    let showUp = 0
    try {
      const noPresentoResult = await query(
        `SELECT COUNT(DISTINCT lead_id) as count
         FROM lead_estado_eventos
         WHERE to_estado = 'no_se_presento'
           AND changed_at >= $1 AND changed_at <= $2`,
        [startDate, endDate]
      )
      const noPresento = parseInt(noPresentoResult.rows[0]?.count || '0')
      showUp = agendadas > 0 ? 1 - (noPresento / agendadas) : 0
    } catch (error: any) {
      if (error.code === '42P01') {
        const noPresentoAproxResult = await query(
          `SELECT COUNT(*) as count FROM leads 
           WHERE estado = 'no_se_presento'
             AND created_at >= $1 AND created_at <= $2`,
          [startDate, endDate]
        )
        const noPresentoAprox = parseInt(noPresentoAproxResult.rows[0]?.count || '0')
        showUp = agendadas > 0 ? 1 - (noPresentoAprox / agendadas) : 0
      }
    }
    
    // LLAMADAS: Cierres post-llamada (leads convertidos que tienen al menos una llamada)
    const cierresPostLlamadaResult = await query(
      `SELECT COUNT(DISTINCT l.id) as count
       FROM leads l
       INNER JOIN llamadas ll ON ll.lead_id = l.id
       WHERE l.cliente_id IS NOT NULL
         AND l.created_at >= $1 AND l.created_at <= $2`,
      [startDate, endDate]
    )
    const cierresPostLlamada = parseInt(cierresPostLlamadaResult.rows[0]?.count || '0')
    
    // CONTENIDO (YouTube): Visitas totales
    const viewsTotalesResult = await query(
      `SELECT COALESCE(SUM(view_count), 0) as total
       FROM videos
       WHERE plataforma = 'youtube'
         AND created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    )
    const viewsTotales = parseInt(viewsTotalesResult.rows[0]?.total || '0')
    
    // CONTENIDO (YouTube): Top videos
    const topVideosResult = await query(
      `SELECT id, titulo, view_count, like_count, comment_count
       FROM videos
       WHERE plataforma = 'youtube'
         AND created_at >= $1 AND created_at <= $2
       ORDER BY view_count DESC NULLS LAST
       LIMIT 10`,
      [startDate, endDate]
    )
    
    const topVideos = topVideosResult.rows.map((row: any) => ({
      id: row.id,
      titulo: row.titulo || 'Sin título',
      view_count: parseInt(row.view_count || '0'),
      like_count: parseInt(row.like_count || '0'),
      comment_count: parseInt(row.comment_count || '0'),
    }))
    
    return NextResponse.json({
      prospeccion: {
        timeseriesLeadsNuevos,
        kpis: {
          tasaRespuesta,
          tasaAgenda,
          tasaCierre,
          seguimientosEnviados,
        },
      },
      llamadas: {
        kpis: {
          agendadas,
          reagendadas,
          showUp,
          cierresPostLlamada,
        },
      },
      contenido: {
        youtube: {
          viewsTotales,
          topVideos,
        },
      },
    })
  } catch (error: any) {
    console.error('Error al obtener estadísticas de ventas:', error)
    // Si hay error de tabla no existe, devolver estructura vacía
    if (error.code === '42P01') {
      return NextResponse.json({
        prospeccion: {
          timeseriesLeadsNuevos: [],
          kpis: {
            tasaRespuesta: 0,
            tasaAgenda: 0,
            tasaCierre: 0,
            seguimientosEnviados: 0,
          },
        },
        llamadas: {
          kpis: {
            agendadas: 0,
            reagendadas: 0,
            showUp: 0,
            cierresPostLlamada: 0,
          },
        },
        contenido: {
          youtube: {
            viewsTotales: 0,
            topVideos: [],
          },
        },
      })
    }
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
