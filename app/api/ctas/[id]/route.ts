import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInternalSession()
    const { id } = await params
    const body = await request.json()
    const { accionable, detalles, recurso } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const result = await query(
      `UPDATE ctas SET 
        accionable = COALESCE($1, accionable),
        detalles = COALESCE($2, detalles),
        recurso = COALESCE($3, recurso)
       WHERE id = $4
       RETURNING *`,
      [accionable, detalles, recurso, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'CTA no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar CTA:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInternalSession()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const result = await query('DELETE FROM ctas WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'CTA no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al borrar CTA:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
