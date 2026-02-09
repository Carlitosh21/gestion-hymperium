import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

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

    if (!respuestas || !Array.isArray(respuestas)) {
      return NextResponse.json(
        { error: 'Respuestas es requerido y debe ser un array' },
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

    // Construir objeto JSON agregado de respuestas
    const onboardingJson: Record<string, string> = {}

    // Guardar respuestas con upsert usando el constraint único
    for (const respuesta of respuestas) {
      if (!respuesta.pregunta_id || respuesta.respuesta === undefined) {
        continue
      }

      // Upsert en datos_onboarding
      await query(
        `INSERT INTO datos_onboarding (cliente_id, pregunta_id, respuesta)
         VALUES ($1, $2, $3)
         ON CONFLICT (cliente_id, pregunta_id)
         DO UPDATE SET respuesta = EXCLUDED.respuesta, created_at = CURRENT_TIMESTAMP`,
        [clienteId, respuesta.pregunta_id, respuesta.respuesta.toString()]
      )

      // Agregar al JSON agregado
      onboardingJson[respuesta.pregunta_id.toString()] = respuesta.respuesta.toString()
    }

    // Actualizar onboarding_json en clientes
    await query(
      `UPDATE clientes 
       SET onboarding_json = onboarding_json || $1::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify(onboardingJson), clienteId]
    )

    return NextResponse.json({ 
      success: true, 
      cliente_id: clienteId,
      respuestas_guardadas: respuestas.length
    })
  } catch (error: any) {
    console.error('Error al guardar respuestas:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
