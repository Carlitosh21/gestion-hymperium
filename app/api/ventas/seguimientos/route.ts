import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()

    // Obtener seguimientos con sus estados vinculados
    const seguimientosResult = await query(
      `SELECT s.*, 
       COALESCE(
         json_agg(
           json_build_object('estado', se.estado)
         ) FILTER (WHERE se.estado IS NOT NULL),
         '[]'::json
       ) as estados
       FROM seguimientos s
       LEFT JOIN seguimiento_estados se ON s.id = se.seguimiento_id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    )

    return NextResponse.json(seguimientosResult.rows)
  } catch (error: any) {
    console.error('Error al obtener seguimientos:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { nombre, mensaje, delay_horas, activo = true, estados } = body

    if (!nombre || !mensaje || !delay_horas || !Array.isArray(estados) || estados.length === 0) {
      return NextResponse.json(
        { error: 'Nombre, mensaje, delay_horas y al menos un estado son requeridos' },
        { status: 400 }
      )
    }

    if (delay_horas <= 0) {
      return NextResponse.json(
        { error: 'delay_horas debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Crear seguimiento
    const seguimientoResult = await query(
      `INSERT INTO seguimientos (nombre, mensaje, delay_horas, activo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre, mensaje, delay_horas, activo]
    )

    const seguimiento = seguimientoResult.rows[0]

    // Vincular estados
    if (estados.length > 0) {
      const estadosValues = estados.map((estado: string, index: number) => {
        const paramIndex = index * 2 + 1
        return `($${paramIndex}, $${paramIndex + 1})`
      }).join(', ')

      const estadosParams: any[] = []
      estados.forEach((estado: string) => {
        estadosParams.push(seguimiento.id, estado)
      })

      await query(
        `INSERT INTO seguimiento_estados (seguimiento_id, estado)
         VALUES ${estadosValues}`,
        estadosParams
      )
    }

    // Obtener seguimiento completo con estados
    const completoResult = await query(
      `SELECT s.*, 
       COALESCE(
         json_agg(
           json_build_object('estado', se.estado)
         ) FILTER (WHERE se.estado IS NOT NULL),
         '[]'::json
       ) as estados
       FROM seguimientos s
       LEFT JOIN seguimiento_estados se ON s.id = se.seguimiento_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [seguimiento.id]
    )

    return NextResponse.json(completoResult.rows[0])
  } catch (error: any) {
    console.error('Error al crear seguimiento:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
