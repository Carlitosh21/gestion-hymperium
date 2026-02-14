import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
const bcrypt = require('bcryptjs')

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission('users.manage')
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { roleId, activo, password } = body

    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (roleId !== undefined) {
      updates.push(`role_id = $${idx}`)
      values.push(roleId)
      idx++
      if (roleId != null) {
        const roleResult = await query(
          'SELECT name FROM roles WHERE id = $1',
          [roleId]
        )
        if (roleResult.rows[0]) {
          updates.push(`role = $${idx}`)
          values.push(roleResult.rows[0].name)
          idx++
        }
      } else {
        updates.push(`role = $${idx}`)
        values.push('staff')
        idx++
      }
    }
    if (activo !== undefined) {
      updates.push(`activo = $${idx}`)
      values.push(!!activo)
      idx++
    }
    if (password !== undefined && password !== '') {
      const password_hash = await bcrypt.hash(password, 10)
      updates.push(`password_hash = $${idx}`)
      values.push(password_hash)
      idx++
    }

    if (updates.length === 0) {
      const existing = await query(
        'SELECT id, email, role, role_id, activo FROM usuarios_internos WHERE id = $1',
        [id]
      )
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
      return NextResponse.json(existing.rows[0])
    }

    values.push(id)
    const result = await query(
      `UPDATE usuarios_internos SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, email, role, role_id, activo`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission('users.manage')
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Desactivar en lugar de borrar (soft delete)
    const result = await query(
      'UPDATE usuarios_internos SET activo = false WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al desactivar usuario:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
