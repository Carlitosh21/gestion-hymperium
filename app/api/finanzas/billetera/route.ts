import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export async function GET() {
  try {
    await requireInternalSession()
    // Calcular total de ingresos
    const ingresosResult = await query(
      'SELECT COALESCE(SUM(monto), 0) as total FROM ingresos'
    )
    const totalIngresos = parseFloat(ingresosResult.rows[0].total)

    // Calcular total de egresos
    const egresosResult = await query(
      'SELECT COALESCE(SUM(monto), 0) as total FROM egresos'
    )
    const totalEgresos = parseFloat(egresosResult.rows[0].total)

    const totalDisponible = totalIngresos - totalEgresos

    // Obtener categorías
    const categoriasResult = await query(
      'SELECT * FROM categorias_billetera ORDER BY nombre'
    )

    // Calcular montos por categoría según porcentajes
    const categorias = categoriasResult.rows.map((cat) => ({
      ...cat,
      monto_asignado: (totalDisponible * parseFloat(cat.porcentaje)) / 100,
    }))

    // Calcular egresos por categoría
    const egresosPorCategoria = await query(`
      SELECT categoria, COALESCE(SUM(monto), 0) as total
      FROM egresos
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
      total_egresos: totalEgresos,
      total_disponible: totalDisponible,
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
