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
      startDate.setFullYear(2000, 0, 1)
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

    // agent_daily_stats: series por día
    let dailyStats: any[] = []
    let totals = {
      mensajes_entrantes: 0,
      mensajes_salientes: 0,
      links_skool_enviados: 0,
      ctas_enviados: 0,
      derivaciones: 0,
      links_whatsapp: 0,
      nuevos_leads: 0,
      ventas: 0,
    }

    try {
      const statsResult = await query(
        `SELECT date, mensajes_entrantes, mensajes_salientes, links_skool_enviados,
                ctas_enviados, derivaciones, links_whatsapp, nuevos_leads, ventas
         FROM agent_daily_stats
         WHERE date >= $1 AND date <= $2
         ORDER BY date ASC`,
        [startDate, endDate]
      )

      dailyStats = statsResult.rows.map((row: any) => ({
        dia: new Date(row.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
        mensajes_entrantes: parseInt(row.mensajes_entrantes || '0'),
        mensajes_salientes: parseInt(row.mensajes_salientes || '0'),
        links_skool_enviados: parseInt(row.links_skool_enviados || '0'),
        ctas_enviados: parseInt(row.ctas_enviados || '0'),
        derivaciones: parseInt(row.derivaciones || '0'),
        links_whatsapp: parseInt(row.links_whatsapp || '0'),
        nuevos_leads: parseInt(row.nuevos_leads || '0'),
        ventas: parseInt(row.ventas || '0'),
      }))

      totals = dailyStats.reduce(
        (acc, d) => ({
          mensajes_entrantes: acc.mensajes_entrantes + d.mensajes_entrantes,
          mensajes_salientes: acc.mensajes_salientes + d.mensajes_salientes,
          links_skool_enviados: acc.links_skool_enviados + d.links_skool_enviados,
          ctas_enviados: acc.ctas_enviados + d.ctas_enviados,
          derivaciones: acc.derivaciones + d.derivaciones,
          links_whatsapp: acc.links_whatsapp + d.links_whatsapp,
          nuevos_leads: acc.nuevos_leads + d.nuevos_leads,
          ventas: acc.ventas + d.ventas,
        }),
        totals
      )
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    // dolores: ranking por tipo_dolor
    let doloresRanking: { tipo_dolor: string; count: number }[] = []
    try {
      const doloresResult = await query(
        `SELECT tipo_dolor, COUNT(*) as count
         FROM dolores
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY tipo_dolor
         ORDER BY count DESC
         LIMIT 10`,
        [startDate, endDate]
      )
      doloresRanking = doloresResult.rows.map((r: any) => ({
        tipo_dolor: r.tipo_dolor || 'Sin tipo',
        count: parseInt(r.count),
      }))
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    // objeciones: ranking por tipo_objecion
    let objecionesRanking: { tipo_objecion: string; count: number }[] = []
    try {
      const objecionesResult = await query(
        `SELECT tipo_objecion, COUNT(*) as count
         FROM objeciones
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY tipo_objecion
         ORDER BY count DESC
         LIMIT 10`,
        [startDate, endDate]
      )
      objecionesRanking = objecionesResult.rows.map((r: any) => ({
        tipo_objecion: r.tipo_objecion || 'Sin tipo',
        count: parseInt(r.count),
      }))
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    // ctas: listado (sin filtro por fecha, tabla no tiene created_at)
    let ctasList: { accionable: string; detalles: string; recurso: string }[] = []
    try {
      const ctasResult = await query(
        `SELECT accionable, detalles, recurso FROM ctas LIMIT 20`
      )
      ctasList = ctasResult.rows.map((r: any) => ({
        accionable: r.accionable || '',
        detalles: r.detalles || '',
        recurso: r.recurso || '',
      }))
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    return NextResponse.json({
      dailyStats,
      totals,
      doloresRanking,
      objecionesRanking,
      ctasList,
    })
  } catch (error: any) {
    console.error('Error al obtener estadísticas setter:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
