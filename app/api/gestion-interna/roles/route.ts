import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission('users.manage')
    const rolesResult = await query(
      'SELECT id, name, description, created_at FROM roles ORDER BY name'
    )
    const permsResult = await query(
      'SELECT id, key, description FROM permissions ORDER BY key'
    )

    const rolePermsResult = await query(
      'SELECT role_id, permission_id FROM role_permissions'
    )
    const rolePermsMap: Record<number, number[]> = {}
    rolePermsResult.rows.forEach((r: any) => {
      if (!rolePermsMap[r.role_id]) rolePermsMap[r.role_id] = []
      rolePermsMap[r.role_id].push(r.permission_id)
    })

    const roles = rolesResult.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
      permissionIds: rolePermsMap[r.id] || [],
    }))

    const permissions = permsResult.rows.map((p: any) => ({
      id: p.id,
      key: p.key,
      description: p.description,
    }))

    return NextResponse.json({ roles, permissions })
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    if (error?.code === '42P01' || error?.code === '42703') {
      return NextResponse.json({ roles: [], permissions: [] })
    }
    console.error('Error al listar roles:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('users.manage')
    const body = await request.json()
    const { name, description, permissionIds } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del rol es requerido' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at`,
      [name.trim(), description?.trim() || null]
    )

    const role = result.rows[0]
    const permIds = Array.isArray(permissionIds) ? permissionIds : []

    if (permIds.length > 0) {
      for (const pid of permIds) {
        await query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [role.id, pid]
        )
      }
    }

    return NextResponse.json(role)
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 })
    }
    console.error('Error al crear rol:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
