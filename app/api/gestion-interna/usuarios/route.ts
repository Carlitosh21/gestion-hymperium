import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
const bcrypt = require('bcryptjs')

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission('users.manage')
    const result = await query(
      `SELECT u.id, u.email, u.role, u.role_id, u.activo, u.created_at,
              r.name AS role_name
       FROM usuarios_internos u
       LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.created_at DESC`
    )
    return NextResponse.json(
      result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        roleId: row.role_id,
        roleName: row.role_name,
        activo: row.activo !== false,
        createdAt: row.created_at,
      }))
    )
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    console.error('Error al listar usuarios:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('users.manage')
    const body = await request.json()
    const { email, password, roleId } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const password_hash = await bcrypt.hash(password, 10)

    const result = await query(
      `INSERT INTO usuarios_internos (email, password_hash, role, role_id)
       VALUES ($1, $2, COALESCE((SELECT name FROM roles WHERE id = $3), 'staff'), $3)
       RETURNING id, email, role, role_id, activo, created_at`,
      [email, password_hash, roleId || null]
    )

    const row = result.rows[0]
    const roleNameResult = await query(
      'SELECT name FROM roles WHERE id = $1',
      [row.role_id]
    )

    return NextResponse.json({
      id: row.id,
      email: row.email,
      role: row.role,
      roleId: row.role_id,
      roleName: roleNameResult.rows[0]?.name || null,
      activo: row.activo !== false,
      createdAt: row.created_at,
    })
  } catch (error: any) {
    if (error?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }
    console.error('Error al crear usuario:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
