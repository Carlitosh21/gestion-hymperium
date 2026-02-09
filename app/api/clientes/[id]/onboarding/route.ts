import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET interno: devuelve preguntas + respuestas del cliente + onboarding_json
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireInternalSession()
    
    const clienteId = params.id

    // Obtener cliente con onboarding_json
    const clienteResult = await query(
      'SELECT id, numero_identificacion, onboarding_json FROM clientes WHERE id = $1',
      [clienteId]
    )

    if (clienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const cliente = clienteResult.rows[0]

    // Obtener todas las preguntas (activas e inactivas) con sus respuestas
    const respuestasResult = await query(
      `SELECT 
        p.id as pregunta_id,
        p.titulo,
        p.descripcion,
        p.pregunta,
        p.tipo,
        p.opciones,
        p.orden,
        p.activa,
        d.respuesta,
        d.created_at as respuesta_fecha
      FROM preguntas_onboarding p
      LEFT JOIN datos_onboarding d ON p.id = d.pregunta_id AND d.cliente_id = $1
      ORDER BY p.orden ASC, p.created_at ASC`,
      [clienteId]
    )

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        numero_identificacion: cliente.numero_identificacion,
        onboarding_json: cliente.onboarding_json || {},
      },
      preguntas_respuestas: respuestasResult.rows.map((row: any) => ({
        pregunta_id: row.pregunta_id,
        titulo: row.titulo,
        descripcion: row.descripcion,
        pregunta: row.pregunta,
        tipo: row.tipo,
        opciones: typeof row.opciones === 'string' ? JSON.parse(row.opciones) : row.opciones,
        orden: row.orden,
        activa: row.activa,
        respuesta: row.respuesta,
        respuesta_fecha: row.respuesta_fecha,
      })),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al obtener onboarding del cliente:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
