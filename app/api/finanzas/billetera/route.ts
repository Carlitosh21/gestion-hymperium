import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission('finanzas.read')

    // Total ingresos brutos (solo completados)
    const ingresosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM ingresos WHERE COALESCE(estado, 'completado') = 'completado'`
    )
    const totalIngresos = parseFloat(ingresosResult.rows[0].total)

    // Ingresos netos agencia (monto - coste implementación), todo entra a la cuenta de la agencia
    const ingresosNetosResult = await query(`
      SELECT COALESCE(SUM(monto - COALESCE(pago_desarrollador, 0)), 0) as total
      FROM ingresos WHERE COALESCE(estado, 'completado') = 'completado'
    `)
    const totalIngresosNetos = parseFloat(ingresosNetosResult.rows[0].total)

    // Ingresos pendientes (no afectan cuentas reales)
    const ingresosPendientesResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM ingresos WHERE estado = 'pendiente'`
    )
    const totalIngresosPendientes = parseFloat(ingresosPendientesResult.rows[0].total)
    const ingresosNetosPendientesResult = await query(`
      SELECT COALESCE(SUM(monto - COALESCE(pago_desarrollador, 0)), 0) as total
      FROM ingresos WHERE estado = 'pendiente'
    `)
    const totalIngresosNetosPendientes = parseFloat(ingresosNetosPendientesResult.rows[0].total)

    // Total egresos (solo completados)
    const egresosResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE COALESCE(estado, 'completado') = 'completado'`
    )
    const totalEgresos = parseFloat(egresosResult.rows[0].total)

    const egresosPendientesResult = await query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE estado = 'pendiente'`
    )
    const totalEgresosPendientes = parseFloat(egresosPendientesResult.rows[0].total)

    const totalDisponible = totalIngresosNetos - totalEgresos

    // Obtener categorías
    const categoriasResult = await query(
      'SELECT * FROM categorias_billetera ORDER BY nombre'
    )

    // Calcular montos por categoría según porcentajes (usando disponible de agencia)
    const categorias = categoriasResult.rows.map((cat) => ({
      ...cat,
      monto_asignado: (totalDisponible * parseFloat(cat.porcentaje)) / 100,
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
        (totalDisponible * parseFloat(cat.porcentaje)) / 100 - (egresosMap[cat.nombre] || 0),
    }))

    return NextResponse.json({
      total_ingresos: totalIngresos,
      total_ingresos_netos: totalIngresosNetos,
      total_ingresos_pendientes: totalIngresosPendientes,
      total_ingresos_netos_pendientes: totalIngresosNetosPendientes,
      total_egresos: totalEgresos,
      total_egresos_pendientes: totalEgresosPendientes,
      total_disponible: totalDisponible,
      categorias: categoriasConEgresos,
    })
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al obtener billetera:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
