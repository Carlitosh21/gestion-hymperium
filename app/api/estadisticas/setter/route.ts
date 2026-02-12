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

    // Costímetro: costo mensual actual (mes en curso)
    let costoMesActualUsd = 0
    try {
      const costimetroResult = await query(
        `SELECT SUM(mensajes_salientes) * 0.018 AS costo_mes_actual_usd
         FROM agent_daily_stats
         WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)`
      )
      const row = costimetroResult.rows[0]
      costoMesActualUsd = parseFloat(row?.costo_mes_actual_usd || '0') || 0
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    // Costo diario: por día en el rango
    let costoDiario: { dia: string; costo_diario_usd: number }[] = []
    try {
      const costoDiarioResult = await query(
        `SELECT
           DATE_TRUNC('day', date)::DATE AS dia,
           ROUND(SUM(mensajes_salientes) * 0.018, 2) AS costo_diario_usd
         FROM agent_daily_stats
         WHERE date >= $1 AND date <= $2
         GROUP BY 1
         ORDER BY 1`,
        [startDate, endDate]
      )
      costoDiario = costoDiarioResult.rows.map((r: any) => ({
        dia: new Date(r.dia).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
        costo_diario_usd: parseFloat(r.costo_diario_usd || '0'),
      }))
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    // agent_daily_stats: series por día (para KPIs existentes)
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

    // Dolores normalizados (último mes)
    let doloresRanking: { dolor_normalizado: string; cantidad: number }[] = []
    try {
      const doloresResult = await query(
        `SELECT
           CASE
             WHEN tipo_dolor ILIKE '%rutina%' THEN 'RUTINA / HABITOS'
             WHEN tipo_dolor ILIKE '%disciplina%' THEN 'DISCIPLINA'
             WHEN tipo_dolor ILIKE '%habito%' OR tipo_dolor ILIKE '%aliment%' THEN 'HABITOS / ALIMENTACION'
             WHEN tipo_dolor ILIKE '%fisic%' OR tipo_dolor ILIKE '%energia%' THEN 'ENERGIA / FISICO'
             WHEN tipo_dolor ILIKE '%claridad%' OR tipo_dolor ILIKE '%inform%' THEN 'CLARIDAD / INFORMACION'
             WHEN tipo_dolor ILIKE '%confianza%' THEN 'CONFIANZA'
             WHEN tipo_dolor ILIKE '%tiempo%' THEN 'TIEMPO'
             WHEN tipo_dolor ILIKE '%dinero%' THEN 'DINERO'
             ELSE 'OTROS'
           END AS dolor_normalizado,
           COUNT(*) AS cantidad
         FROM dolores
         WHERE created_at >= NOW() - INTERVAL '1 month'
         GROUP BY 1
         ORDER BY 2 DESC
         LIMIT 15`
      )
      doloresRanking = doloresResult.rows.map((r: any) => ({
        dolor_normalizado: r.dolor_normalizado || 'OTROS',
        cantidad: parseInt(r.cantidad),
      }))
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    // Objeciones limpias (último mes)
    let objecionesRanking: { objecion_limpia: string; cantidad: number }[] = []
    try {
      const objecionesResult = await query(
        `SELECT
           UPPER(REPLACE(tipo_objecion, '_', ' ')) AS objecion_limpia,
           COUNT(*) AS cantidad
         FROM objeciones
         WHERE created_at >= NOW() - INTERVAL '1 month'
         GROUP BY 1
         ORDER BY 2 DESC
         LIMIT 15`
      )
      objecionesRanking = objecionesResult.rows.map((r: any) => ({
        objecion_limpia: r.objecion_limpia || 'SIN TIPO',
        cantidad: parseInt(r.cantidad),
      }))
    } catch (err: any) {
      if (err.code !== '42P01') throw err
    }

    // ctas: listado (sin filtro por fecha)
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
      costoMesActualUsd,
      costoDiario,
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
