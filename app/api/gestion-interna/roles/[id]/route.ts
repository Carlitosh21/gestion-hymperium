import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

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
    const { name, description, permissionIds } = body

    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (name !== undefined && name.trim()) {
      updates.push(`name = $${idx}`)
      values.push(name.trim())
      idx++
    }
    if (description !== undefined) {
      updates.push(`description = $${idx}`)
      values.push(description?.trim() || null)
      idx++
    }

    if (updates.length > 0) {
      values.push(id)
      await query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      )
    }

    if (permissionIds !== undefined && Array.isArray(permissionIds)) {
      await query('DELETE FROM role_permissions WHERE role_id = $1', [id])
      for (const pid of permissionIds) {
        await query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [id, pid]
        )
      }
    }

    const result = await query(
      'SELECT id, name, description, created_at FROM roles WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 })
    }
    console.error('Error al actualizar rol:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
