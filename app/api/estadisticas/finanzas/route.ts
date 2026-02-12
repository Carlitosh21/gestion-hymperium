import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Granularity = 'daily' | 'weekly' | 'monthly' | 'quarterly'

function getDateRange(
  range: string,
  granularity: Granularity,
  year?: number,
  quarter?: number
): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  const startDate = new Date()

  if (granularity === 'quarterly' && year != null && quarter != null && quarter >= 1 && quarter <= 4) {
    const monthStart = (quarter - 1) * 3
    startDate.setFullYear(year, monthStart, 1)
    startDate.setHours(0, 0, 0, 0)
    endDate.setFullYear(year, monthStart + 3, 0)
    endDate.setHours(23, 59, 59, 999)
    return { startDate, endDate }
  }

  if (granularity === 'daily') {
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
  } else if (granularity === 'weekly') {
    switch (range) {
      case '4w':
        startDate.setDate(startDate.getDate() - 28)
        break
      case '12w':
        startDate.setDate(startDate.getDate() - 84)
        break
      case '52w':
        startDate.setDate(startDate.getDate() - 364)
        break
      case 'all':
      default:
        startDate.setFullYear(2000, 0, 1)
        break
    }
  } else if (granularity === 'monthly') {
    switch (range) {
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '12m':
        startDate.setMonth(startDate.getMonth() - 12)
        break
      case 'all':
      default:
        startDate.setFullYear(2000, 0, 1)
        break
    }
  } else {
    startDate.setDate(startDate.getDate() - 30)
  }

  startDate.setHours(0, 0, 0, 0)

  return { startDate, endDate }
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatLabel(
  date: Date,
  granularity: Granularity
): string {
  if (granularity === 'daily') {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }
  if (granularity === 'weekly') {
    const weekEnd = new Date(date)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return `Sem ${date.getDate()}-${weekEnd.getDate()} ${date.toLocaleDateString('es-AR', { month: 'short' })}`
  }
  if (granularity === 'monthly' || granularity === 'quarterly') {
    return MESES[date.getMonth()]
  }
  return date.toLocaleDateString('es-AR')
}

export async function GET(request: Request) {
  try {
    await requireInternalSession()

    const { searchParams } = new URL(request.url)
    const granularity = (searchParams.get('granularity') || 'daily') as Granularity
    const range = searchParams.get('range') || (granularity === 'quarterly' ? '' : '30d')
    let year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined
    let quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!, 10) : undefined

    if (granularity === 'quarterly' && (year == null || quarter == null)) {
      const now = new Date()
      year = now.getFullYear()
      quarter = Math.floor(now.getMonth() / 3) + 1
    }

    const { startDate, endDate } = getDateRange(range, granularity, year, quarter)

    // KPIs: Totales en el período (solo completados para cuentas reales)
    const ingresosFilter = `fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'`
    const ingresosBrutosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM ingresos WHERE ${ingresosFilter}`,
      [startDate, endDate]
    )
    const totalIngresosBrutos = parseFloat(ingresosBrutosResult.rows[0]?.total || '0')

    const ingresosHymperiumResult = await query(
      `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
       FROM ingresos WHERE ${ingresosFilter}`,
      [startDate, endDate]
    )
    const totalIngresosHymperium = parseFloat(ingresosHymperiumResult.rows[0]?.total || '0')

    const pagosDevsResult = await query(
      `SELECT COALESCE(SUM(pago_desarrollador), 0) as total FROM ingresos WHERE ${ingresosFilter}`,
      [startDate, endDate]
    )
    const totalPagosDevs = parseFloat(pagosDevsResult.rows[0]?.total || '0')

    const ingresosCarlitosResult = await query(
      `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_carlitos, 0) / 100)), 0) as total
       FROM ingresos WHERE ${ingresosFilter}`,
      [startDate, endDate]
    )
    const totalIngresosCarlitos = parseFloat(ingresosCarlitosResult.rows[0]?.total || '0')

    const ingresosJoacoResult = await query(
      `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_joaco, 0) / 100)), 0) as total
       FROM ingresos WHERE ${ingresosFilter}`,
      [startDate, endDate]
    )
    const totalIngresosJoaco = parseFloat(ingresosJoacoResult.rows[0]?.total || '0')

    // Ingresos pendientes (no afectan balance)
    const ingresosPendientesBrutosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM ingresos
       WHERE fecha >= $1 AND fecha <= $2 AND estado = 'pendiente'`,
      [startDate, endDate]
    )
    const totalIngresosPendientesBrutos = parseFloat(ingresosPendientesBrutosResult.rows[0]?.total || '0')
    const ingresosPendientesHymperiumResult = await query(
      `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
       FROM ingresos WHERE fecha >= $1 AND fecha <= $2 AND estado = 'pendiente'`,
      [startDate, endDate]
    )
    const totalIngresosPendientesHymperium = parseFloat(ingresosPendientesHymperiumResult.rows[0]?.total || '0')

    const egresosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos
       WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'`,
      [startDate, endDate]
    )
    const totalEgresos = parseFloat(egresosResult.rows[0]?.total || '0')

    const egresosPendientesResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos
       WHERE fecha >= $1 AND fecha <= $2 AND estado = 'pendiente'`,
      [startDate, endDate]
    )
    const totalEgresosPendientes = parseFloat(egresosPendientesResult.rows[0]?.total || '0')

    const balance = totalIngresosHymperium - totalEgresos
    const margenHymperium = totalIngresosBrutos > 0 ? (totalIngresosHymperium / totalIngresosBrutos) * 100 : 0
    const tasaEgreso = totalIngresosHymperium > 0 ? (totalEgresos / totalIngresosHymperium) * 100 : 0

    // Timeseries: intervalo y GROUP BY según granularidad
    const intervalMap = { daily: '1 day', weekly: '1 week', monthly: '1 month', quarterly: '1 month' } as const
    const interval = intervalMap[granularity]

    let seriesStart = new Date(startDate)
    if (granularity === 'weekly') {
      const d = seriesStart.getDay()
      seriesStart.setDate(seriesStart.getDate() - (d === 0 ? 6 : d - 1))
      seriesStart.setHours(0, 0, 0, 0)
    } else if (granularity === 'monthly' || granularity === 'quarterly') {
      seriesStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    }

    const groupByDaily = `DATE(fecha)`
    const groupByWeekly = `date_trunc('week', fecha)::date`
    const groupByMonthly = `date_trunc('month', fecha)::date`
    const groupBy = granularity === 'daily' ? groupByDaily : granularity === 'weekly' ? groupByWeekly : groupByMonthly

    const joinCond = granularity === 'daily' ? 'i.dia = d.dia::date' : 'i.dia = d.dia::date'

    const tsIngresosResult = await query(
      `SELECT d.dia::date as dia,
         COALESCE(i.bruto, 0) as bruto,
         COALESCE(i.hymperium, 0) as hymperium,
         COALESCE(i.carlitos, 0) as carlitos,
         COALESCE(i.joaco, 0) as joaco,
         COALESCE(i.pagos_devs, 0) as pagos_devs
       FROM generate_series($1::timestamp, $2::timestamp, $3::interval) AS d(dia)
       LEFT JOIN (
         SELECT ${groupBy} as dia,
           SUM(monto) as bruto,
           SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)) as hymperium,
           SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_carlitos, 0) / 100)) as carlitos,
           SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_joaco, 0) / 100)) as joaco,
           SUM(pago_desarrollador) as pagos_devs
         FROM ingresos
         WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'
         GROUP BY ${groupBy}
       ) i ON ${joinCond}
       ORDER BY d.dia ASC`,
      [seriesStart, endDate, interval]
    )

    const tsIngresosPendientesResult = await query(
      `SELECT d.dia::date as dia,
         COALESCE(i.bruto, 0) as bruto,
         COALESCE(i.hymperium, 0) as hymperium
       FROM generate_series($1::timestamp, $2::timestamp, $3::interval) AS d(dia)
       LEFT JOIN (
         SELECT ${groupBy} as dia,
           SUM(monto) as bruto,
           SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)) as hymperium
         FROM ingresos
         WHERE fecha >= $1 AND fecha <= $2 AND estado = 'pendiente'
         GROUP BY ${groupBy}
       ) i ON ${joinCond}
       ORDER BY d.dia ASC`,
      [seriesStart, endDate, interval]
    )

    const timeseriesIngresos = tsIngresosResult.rows.map((row: any) => ({
      dia: formatLabel(new Date(row.dia), granularity),
      bruto: parseFloat(row.bruto || '0'),
      hymperium: parseFloat(row.hymperium || '0'),
      carlitos: parseFloat(row.carlitos || '0'),
      joaco: parseFloat(row.joaco || '0'),
      pagos_devs: parseFloat(row.pagos_devs || '0'),
    }))

    const timeseriesIngresosPendientes = tsIngresosPendientesResult.rows.map((row: any) => ({
      dia: formatLabel(new Date(row.dia), granularity),
      bruto: parseFloat(row.bruto || '0'),
      hymperium: parseFloat(row.hymperium || '0'),
    }))

    const tsEgresosResult = await query(
      `SELECT d.dia::date as dia, COALESCE(e.total, 0) as monto
       FROM generate_series($1::timestamp, $2::timestamp, $3::interval) AS d(dia)
       LEFT JOIN (
         SELECT ${groupBy} as dia, SUM(monto) as total
         FROM egresos
         WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'
         GROUP BY ${groupBy}
       ) e ON e.dia = d.dia::date
       ORDER BY d.dia ASC`,
      [seriesStart, endDate, interval]
    )

    const tsEgresosPendientesResult = await query(
      `SELECT d.dia::date as dia, COALESCE(e.total, 0) as monto
       FROM generate_series($1::timestamp, $2::timestamp, $3::interval) AS d(dia)
       LEFT JOIN (
         SELECT ${groupBy} as dia, SUM(monto) as total
         FROM egresos
         WHERE fecha >= $1 AND fecha <= $2 AND estado = 'pendiente'
         GROUP BY ${groupBy}
       ) e ON e.dia = d.dia::date
       ORDER BY d.dia ASC`,
      [seriesStart, endDate, interval]
    )

    const timeseriesEgresos = tsEgresosResult.rows.map((row: any) => ({
      dia: formatLabel(new Date(row.dia), granularity),
      monto: parseFloat(row.monto || '0'),
    }))

    const timeseriesEgresosPendientes = tsEgresosPendientesResult.rows.map((row: any) => ({
      dia: formatLabel(new Date(row.dia), granularity),
      monto: parseFloat(row.monto || '0'),
    }))

    // Flujo de caja: ingresos vs egresos completados vs pendientes
    const flujoCaja = timeseriesIngresos.map((t: any, i: number) => ({
      dia: t.dia,
      ingresos: t.hymperium,
      ingresos_pendientes: timeseriesIngresosPendientes[i]?.hymperium ?? 0,
      egresos: timeseriesEgresos[i]?.monto ?? 0,
      egresos_pendientes: timeseriesEgresosPendientes[i]?.monto ?? 0,
    }))

    // Egresos por categoría (solo completados)
    const egresosCatResult = await query(
      `SELECT categoria, COALESCE(SUM(monto), 0) as total
       FROM egresos
       WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'
       GROUP BY categoria
       ORDER BY total DESC`,
      [startDate, endDate]
    )

    const egresosPorCategoria = egresosCatResult.rows.map((row: any) => ({
      categoria: row.categoria,
      total: parseFloat(row.total),
      porcentaje: totalEgresos > 0 ? (parseFloat(row.total) / totalEgresos) * 100 : 0,
    }))

    // Top ingresos (solo completados)
    const topIngresosResult = await query(
      `SELECT id, descripcion, monto, pago_desarrollador, porcentaje_hymperium, fecha
       FROM ingresos
       WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'
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

    // Top egresos (solo completados)
    const topEgresosResult = await query(
      `SELECT id, descripcion, categoria, monto, fecha
       FROM egresos
       WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'
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

    const showComparativo = granularity !== 'quarterly' && (range === '30d' || range === '90d' || range === 'all' || range === '12m' || range === '52w')
    if (showComparativo) {
      const now = new Date()
      const mesActualStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const mesActualEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const mesAnteriorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const mesAnteriorEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

      const [ingresosActual, egresosActual, ingresosAnterior, egresosAnterior] = await Promise.all([
        query(
          `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
           FROM ingresos WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'`,
          [mesActualStart, mesActualEnd]
        ),
        query(
          `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'`,
          [mesActualStart, mesActualEnd]
        ),
        query(
          `SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
           FROM ingresos WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'`,
          [mesAnteriorStart, mesAnteriorEnd]
        ),
        query(
          `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'`,
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
      granularity,
      year: granularity === 'quarterly' ? year : undefined,
      quarter: granularity === 'quarterly' ? quarter : undefined,
      kpis: {
        totalIngresosBrutos: totalIngresosBrutos,
        totalIngresosHymperium: totalIngresosHymperium,
        totalIngresosPendientesBrutos: totalIngresosPendientesBrutos,
        totalIngresosPendientesHymperium: totalIngresosPendientesHymperium,
        totalIngresosCarlitos: totalIngresosCarlitos,
        totalIngresosJoaco: totalIngresosJoaco,
        totalPagosDevs: totalPagosDevs,
        totalEgresos: totalEgresos,
        totalEgresosPendientes: totalEgresosPendientes,
        balance,
        margenHymperium,
        tasaEgreso,
      },
      timeseriesIngresos,
      timeseriesIngresosPendientes,
      timeseriesEgresos,
      timeseriesEgresosPendientes,
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
