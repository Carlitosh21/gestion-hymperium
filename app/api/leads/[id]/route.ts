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
    const { estado, nombre, username } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex++}`)
      values.push(estado)
    }
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`)
      values.push(nombre)
    }
    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`)
      values.push(username)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Ningún campo para actualizar' },
        { status: 400 }
      )
    }

    values.push(id)
    const result = await query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Error al actualizar lead:', error)
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

    const result = await query('DELETE FROM leads WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al borrar lead:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
