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

    // KPIs: Totales en el período
    const ingresosBrutosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM ingresos
       WHERE fecha >= $1 AND fecha <= $2`,
      [startDate, endDate]
    )
    const totalIngresosBrutos = parseFloat(ingresosBrutosResult.rows[0]?.total || '0')

    const ingresosHymperiumResult = await query(
      `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
       FROM ingresos
       WHERE fecha >= $1 AND fecha <= $2`,
      [startDate, endDate]
    )
    const totalIngresosHymperium = parseFloat(ingresosHymperiumResult.rows[0]?.total || '0')

    const pagosDevsResult = await query(
      `SELECT COALESCE(SUM(pago_desarrollador), 0) as total FROM ingresos
       WHERE fecha >= $1 AND fecha <= $2`,
      [startDate, endDate]
    )
    const totalPagosDevs = parseFloat(pagosDevsResult.rows[0]?.total || '0')

    const ingresosCarlitosResult = await query(
      `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_carlitos, 0) / 100)), 0) as total
       FROM ingresos WHERE fecha >= $1 AND fecha <= $2`,
      [startDate, endDate]
    )
    const totalIngresosCarlitos = parseFloat(ingresosCarlitosResult.rows[0]?.total || '0')

    const ingresosJoacoResult = await query(
      `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_joaco, 0) / 100)), 0) as total
       FROM ingresos WHERE fecha >= $1 AND fecha <= $2`,
      [startDate, endDate]
    )
    const totalIngresosJoaco = parseFloat(ingresosJoacoResult.rows[0]?.total || '0')

    const egresosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos
       WHERE fecha >= $1 AND fecha <= $2`,
      [startDate, endDate]
    )
    const totalEgresos = parseFloat(egresosResult.rows[0]?.total || '0')

    const balance = totalIngresosHymperium - totalEgresos
    const margenHymperium = totalIngresosBrutos > 0 ? (totalIngresosHymperium / totalIngresosBrutos) * 100 : 0
    const tasaEgreso = totalIngresosHymperium > 0 ? (totalEgresos / totalIngresosHymperium) * 100 : 0

    // Timeseries: Ingresos por día (bruto, hymperium, carlitos, joaco, pagos_devs)
    const tsIngresosResult = await query(
      `SELECT d.dia::date as dia,
         COALESCE(i.bruto, 0) as bruto,
         COALESCE(i.hymperium, 0) as hymperium,
         COALESCE(i.carlitos, 0) as carlitos,
         COALESCE(i.joaco, 0) as joaco,
         COALESCE(i.pagos_devs, 0) as pagos_devs
       FROM generate_series($1::timestamp, $2::timestamp, '1 day'::interval) AS d(dia)
       LEFT JOIN (
         SELECT DATE(fecha) as dia,
           SUM(monto) as bruto,
           SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)) as hymperium,
           SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_carlitos, 0) / 100)) as carlitos,
           SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_joaco, 0) / 100)) as joaco,
           SUM(pago_desarrollador) as pagos_devs
         FROM ingresos
         WHERE fecha >= $1 AND fecha <= $2
         GROUP BY DATE(fecha)
       ) i ON i.dia = d.dia::date
       ORDER BY d.dia ASC`,
      [startDate, endDate]
    )

    const timeseriesIngresos = tsIngresosResult.rows.map((row: any) => ({
      dia: new Date(row.dia).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      bruto: parseFloat(row.bruto || '0'),
      hymperium: parseFloat(row.hymperium || '0'),
      carlitos: parseFloat(row.carlitos || '0'),
      joaco: parseFloat(row.joaco || '0'),
      pagos_devs: parseFloat(row.pagos_devs || '0'),
    }))

    // Timeseries: Egresos por día
    const tsEgresosResult = await query(
      `SELECT d.dia::date as dia, COALESCE(e.total, 0) as monto
       FROM generate_series($1::timestamp, $2::timestamp, '1 day'::interval) AS d(dia)
       LEFT JOIN (
         SELECT DATE(fecha) as dia, SUM(monto) as total
         FROM egresos
         WHERE fecha >= $1 AND fecha <= $2
         GROUP BY DATE(fecha)
       ) e ON e.dia = d.dia::date
       ORDER BY d.dia ASC`,
      [startDate, endDate]
    )

    const timeseriesEgresos = tsEgresosResult.rows.map((row: any) => ({
      dia: new Date(row.dia).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      monto: parseFloat(row.monto || '0'),
    }))

    // Flujo de caja: ingresos vs egresos por día ( mismo orden en ambas series )
    const flujoCaja = timeseriesIngresos.map((t: any, i: number) => ({
      dia: t.dia,
      ingresos: t.hymperium,
      egresos: timeseriesEgresos[i]?.monto ?? 0,
    }))

    // Egresos por categoría
    const egresosCatResult = await query(
      `SELECT categoria, COALESCE(SUM(monto), 0) as total
       FROM egresos
       WHERE fecha >= $1 AND fecha <= $2
       GROUP BY categoria
       ORDER BY total DESC`,
      [startDate, endDate]
    )

    const egresosPorCategoria = egresosCatResult.rows.map((row: any) => ({
      categoria: row.categoria,
      total: parseFloat(row.total),
      porcentaje: totalEgresos > 0 ? (parseFloat(row.total) / totalEgresos) * 100 : 0,
    }))

    // Top ingresos (por monto bruto)
    const topIngresosResult = await query(
      `SELECT id, descripcion, monto, pago_desarrollador, porcentaje_hymperium, fecha
       FROM ingresos
       WHERE fecha >= $1 AND fecha <= $2
       ORDER BY monto DESC
       LIMIT 10`,
      [startDate, endDate]
    )

    const topIngresos = topIngresosResult.rows.map((row: any) => ({
      id: row.id,
      descripcion: row.descripcion || 'Sin descripción',
      monto: parseFloat(row.monto),
      hymperium:
        (parseFloat(row.monto) - parseFloat(row.pago_desarrollador || '0')) *
        (parseFloat(row.porcentaje_hymperium || '0') / 100),
      fecha: row.fecha,
    }))

    // Top egresos
    const topEgresosResult = await query(
      `SELECT id, descripcion, categoria, monto, fecha
       FROM egresos
       WHERE fecha >= $1 AND fecha <= $2
       ORDER BY monto DESC
       LIMIT 10`,
      [startDate, endDate]
    )

    const topEgresos = topEgresosResult.rows.map((row: any) => ({
      id: row.id,
      descripcion: row.descripcion,
      categoria: row.categoria,
      monto: parseFloat(row.monto),
      fecha: row.fecha,
    }))

    // Comparativo mensual (si rango >= 30d)
    let comparativoMensual: {
      mesActual: { ingresos: number; egresos: number; balance: number }
      mesAnterior: { ingresos: number; egresos: number; balance: number }
    } | null = null

    if (range === '30d' || range === '90d' || range === 'all') {
      const now = new Date()
      const mesActualStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const mesActualEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const mesAnteriorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const mesAnteriorEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

      const [ingresosActual, egresosActual, ingresosAnterior, egresosAnterior] = await Promise.all([
        query(
          `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
           FROM ingresos WHERE fecha >= $1 AND fecha <= $2`,
          [mesActualStart, mesActualEnd]
        ),
        query(
          `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE fecha >= $1 AND fecha <= $2`,
          [mesActualStart, mesActualEnd]
        ),
        query(
          `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
           FROM ingresos WHERE fecha >= $1 AND fecha <= $2`,
          [mesAnteriorStart, mesAnteriorEnd]
        ),
        query(
          `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE fecha >= $1 AND fecha <= $2`,
          [mesAnteriorStart, mesAnteriorEnd]
        ),
      ])

      const ingActual = parseFloat(ingresosActual.rows[0]?.total || '0')
      const egrActual = parseFloat(egresosActual.rows[0]?.total || '0')
      const ingAnterior = parseFloat(ingresosAnterior.rows[0]?.total || '0')
      const egrAnterior = parseFloat(egresosAnterior.rows[0]?.total || '0')

      comparativoMensual = {
        mesActual: {
          ingresos: ingActual,
          egresos: egrActual,
          balance: ingActual - egrActual,
        },
        mesAnterior: {
          ingresos: ingAnterior,
          egresos: egrAnterior,
          balance: ingAnterior - egrAnterior,
        },
      }
    }

    return NextResponse.json({
      kpis: {
        totalIngresosBrutos: totalIngresosBrutos,
        totalIngresosHymperium: totalIngresosHymperium,
        totalIngresosCarlitos: totalIngresosCarlitos,
        totalIngresosJoaco: totalIngresosJoaco,
        totalPagosDevs: totalPagosDevs,
        totalEgresos: totalEgresos,
        balance,
        margenHymperium,
        tasaEgreso,
      },
      timeseriesIngresos,
      timeseriesEgresos,
      flujoCaja,
      egresosPorCategoria,
      topIngresos,
      topEgresos,
      comparativoMensual,
    })
  } catch (error: any) {
    console.error('Error al obtener estadísticas de finanzas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
