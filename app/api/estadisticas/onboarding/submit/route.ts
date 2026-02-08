import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { numero_identificacion, respuestas } = body

    if (!numero_identificacion) {
      return NextResponse.json(
        { error: 'Número de identificación requerido' },
        { status: 400 }
      )
    }

    // Buscar cliente por número de identificación
    const clienteResult = await query(
      'SELECT id FROM clientes WHERE numero_identificacion = $1',
      [numero_identificacion]
    )

    if (clienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Número de identificación no válido' },
        { status: 404 }
      )
    }

    const clienteId = clienteResult.rows[0].id

    // Guardar respuestas
    for (const respuesta of respuestas) {
      await query(
        `INSERT INTO datos_onboarding (cliente_id, pregunta_id, respuesta)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [clienteId, respuesta.pregunta_id, respuesta.respuesta]
      )
    }

    return NextResponse.json({ success: true, cliente_id: clienteId })
  } catch (error: any) {
    console.error('Error al guardar respuestas:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
