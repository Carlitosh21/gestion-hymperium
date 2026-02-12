import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()

    // Total ingresos brutos (para estadísticas, no se muestra en Finanzas)
    const ingresosResult = await query(
      'SELECT COALESCE(SUM(monto), 0) as total FROM ingresos'
    )
    const totalIngresos = parseFloat(ingresosResult.rows[0].total)

    // Ingresos Hymperium: (monto - pago_desarrollador) * (porcentaje_hymperium / 100)
    const hymperiumResult = await query(`
      SELECT COALESCE(SUM((monto - COALESCE(pago_desarrollador, 0)) * (COALESCE(porcentaje_hymperium, 0) / 100)), 0) as total
      FROM ingresos
    `)
    const totalIngresosHymperium = parseFloat(hymperiumResult.rows[0].total)

    // Total egresos (solo completados para cuentas reales)
    const egresosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE COALESCE(estado, 'completado') = 'completado'`
    )
    const totalEgresos = parseFloat(egresosResult.rows[0].total)

    const egresosPendientesResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE estado = 'pendiente'`
    )
    const totalEgresosPendientes = parseFloat(egresosPendientesResult.rows[0].total)

    const totalDisponible = totalIngresos - totalEgresos
    const totalDisponibleHymperium = totalIngresosHymperium - totalEgresos

    // Obtener categorías
    const categoriasResult = await query(
      'SELECT * FROM categorias_billetera ORDER BY nombre'
    )

    // Calcular montos por categoría según porcentajes (usando plata Hymperium)
    const categorias = categoriasResult.rows.map((cat) => ({
      ...cat,
      monto_asignado: (totalDisponibleHymperium * parseFloat(cat.porcentaje)) / 100,
    }))

    // Calcular egresos por categoría (solo completados)
    const egresosPorCategoria = await query(`
      SELECT categoria, COALESCE(SUM(monto), 0) as total
      FROM egresos
      WHERE COALESCE(estado, 'completado') = 'completado'
      GROUP BY categoria
    `)

    const egresosMap: Record<string, number> = {}
    egresosPorCategoria.rows.forEach((row) => {
      egresosMap[row.categoria] = parseFloat(row.total)
    })

    const categoriasConEgresos = categorias.map((cat) => ({
      ...cat,
      monto_gastado: egresosMap[cat.nombre] || 0,
      monto_disponible:
        (totalDisponibleHymperium * parseFloat(cat.porcentaje)) / 100 - (egresosMap[cat.nombre] || 0),
    }))

    return NextResponse.json({
      total_ingresos: totalIngresos,
      total_ingresos_hymperium: totalIngresosHymperium,
      total_egresos: totalEgresos,
      total_egresos_pendientes: totalEgresosPendientes,
      total_disponible: totalDisponible,
      total_disponible_hymperium: totalDisponibleHymperium,
      categorias: categoriasConEgresos,
    })
  } catch (error: any) {
    console.error('Error al obtener billetera:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
