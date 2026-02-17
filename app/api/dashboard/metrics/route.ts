import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()

    const now = new Date()
    const mesStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const mesEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const hoyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const hoyEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const en7Dias = new Date(now)
    en7Dias.setDate(en7Dias.getDate() + 7)
    en7Dias.setHours(23, 59, 59, 999)

    const ingresosFilter = `fecha >= $1 AND fecha <= $2 AND COALESCE(estado, 'completado') = 'completado'`

    const [ingresosBrutosRes, cashCollectedRes, totalClientesRes, clientesActivosRes, llamadasHoyRes, llamadasProximosRes] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(monto), 0) as total FROM ingresos WHERE ${ingresosFilter}`,
        [mesStart, mesEnd]
      ),
      query(
        `SELECT COALESCE(SUM(monto - COALESCE(pago_desarrollador, 0)), 0) as total FROM ingresos WHERE ${ingresosFilter}`,
        [mesStart, mesEnd]
      ),
      query('SELECT COUNT(*) as total FROM clientes'),
      query('SELECT COUNT(*) as total FROM clientes WHERE estado_entrega < 100'),
      query(
        `SELECT COUNT(*) as total FROM llamadas WHERE fecha >= $1 AND fecha <= $2`,
        [hoyStart, hoyEnd]
      ),
      query(
        `SELECT COUNT(*) as total FROM llamadas WHERE fecha >= $1 AND fecha <= $2`,
        [now, en7Dias]
      ),
    ])

    return NextResponse.json({
      ingresosBrutosMes: parseFloat(ingresosBrutosRes.rows[0]?.total || '0'),
      cashCollectedMes: parseFloat(cashCollectedRes.rows[0]?.total || '0'),
      totalClientes: parseInt(totalClientesRes.rows[0]?.total || '0'),
      clientesActivos: parseInt(clientesActivosRes.rows[0]?.total || '0'),
      llamadasHoy: parseInt(llamadasHoyRes.rows[0]?.total || '0'),
      llamadasProximos7Dias: parseInt(llamadasProximosRes.rows[0]?.total || '0'),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error al obtener métricas del dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener métricas' },
      { status: 500 }
    )
  }
}
