import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET público: valida si existe numero_identificacion sin exponer info adicional
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const numeroIdentificacion = searchParams.get('numero_identificacion')

    if (!numeroIdentificacion) {
      return NextResponse.json(
        { error: 'numero_identificacion es requerido' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT id FROM clientes WHERE numero_identificacion = $1',
      [numeroIdentificacion]
    )

    return NextResponse.json({
      valid: result.rows.length > 0,
    })
  } catch (error: any) {
    console.error('Error al validar ID:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
