import { cookies } from 'next/headers'
import { query } from './db'
const bcrypt = require('bcryptjs')
import { randomBytes } from 'crypto'

const SESSION_COOKIE_NAME = 'gh_session'
const SESSION_DURATION_DAYS = 30

export interface Session {
  id: number
  token: string
  kind: 'internal' | 'client'
  internal_user_id: number | null
  cliente_id: number | null
  expires_at: Date
}

export async function createSession(
  kind: 'internal' | 'client',
  userId: number,
  clienteId?: number
): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  try {
    await query(
      `INSERT INTO sessions (token, kind, internal_user_id, cliente_id, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        token,
        kind,
        kind === 'internal' ? userId : null,
        kind === 'client' ? (clienteId || userId) : null,
        expiresAt,
      ]
    )
  } catch (error: any) {
    // Si aún no corrieron migraciones, la tabla sessions puede no existir.
    if (error?.code === '42P01') {
      throw new Error('DatabaseNotMigrated')
    }
    throw error
  }

  return token
}

export async function getSession(token: string): Promise<Session | null> {
  let result: any
  try {
    result = await query(
      `SELECT * FROM sessions 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    )
  } catch (error: any) {
    // Si aún no corrieron migraciones, la tabla sessions puede no existir.
    if (error?.code === '42P01') {
      return null
    }
    throw error
  }

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as Session
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await query('DELETE FROM sessions WHERE token = $1', [token])
  } catch (error: any) {
    // Si no existe la tabla todavía, no hay nada que borrar.
    if (error?.code === '42P01') {
      return
    }
    throw error
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return getSession(token)
}

export async function requireInternalSession(): Promise<Session> {
  const session = await getCurrentSession()

  if (!session || session.kind !== 'internal' || !session.internal_user_id) {
    throw new Error('Unauthorized')
  }

  return session
}

export async function requireClientSession(): Promise<Session> {
  const session = await getCurrentSession()

  if (!session || session.kind !== 'client' || !session.cliente_id) {
    throw new Error('Unauthorized')
  }

  return session
}

export async function hasAdmin(): Promise<boolean> {
  try {
    const result = await query('SELECT COUNT(*) as count FROM usuarios_internos')
    return parseInt(result.rows[0].count) > 0
  } catch (error: any) {
    // Si aún no corrieron migraciones, la tabla puede no existir.
    // En ese caso tratamos como "no hay admin" para permitir /api/migrate y /setup.
    if (error?.code === '42P01') {
      return false
    }
    throw error
  }
}

export interface InternalUser {
  id: number
  email: string
  role: string
  roleId: number | null
  roleName: string | null
  permissions: string[]
  activo: boolean
}

export async function getInternalUserFromSession(): Promise<InternalUser | null> {
  const session = await getCurrentSession()
  if (!session || session.kind !== 'internal' || !session.internal_user_id) {
    return null
  }

  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.role_id, u.activo,
              r.name AS role_name,
              COALESCE(
                (SELECT array_agg(p.key) FROM role_permissions rp
                 JOIN permissions p ON p.id = rp.permission_id
                 WHERE rp.role_id = u.role_id),
                ARRAY[]::text[]
              ) AS permissions
       FROM usuarios_internos u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1 AND COALESCE(u.activo, true) = true`,
      [session.internal_user_id]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    let permissions: string[] = row.permissions || []
    if (Array.isArray(permissions) && permissions.length === 1 && permissions[0] === null) {
      permissions = []
    }

    // Fallback: si no hay role_id (pre-RBAC) y role='admin', tiene todos los permisos
    if (!row.role_id && row.role === 'admin') {
      permissions = ['*']
    }

    return {
      id: row.id,
      email: row.email,
      role: row.role || 'staff',
      roleId: row.role_id,
      roleName: row.role_name,
      permissions: permissions || [],
      activo: row.activo !== false,
    }
  } catch (error: any) {
    if (error?.code === '42P01' || error?.code === '42703') {
      // Tablas RBAC no existen aún: fallback a role legacy
      const legacy = await query(
        'SELECT id, email, role FROM usuarios_internos WHERE id = $1',
        [session.internal_user_id]
      )
      if (legacy.rows.length === 0) return null
      const u = legacy.rows[0]
      return {
        id: u.id,
        email: u.email,
        role: u.role || 'admin',
        roleId: null,
        roleName: null,
        permissions: u.role === 'admin' ? ['*'] : [],
        activo: true,
      }
    }
    throw error
  }
}

export function userHasPermission(user: InternalUser, permission: string): boolean {
  if (!user) return false
  if (user.permissions.includes('*')) return true
  return user.permissions.includes(permission)
}

export async function requirePermission(permission: string): Promise<InternalUser> {
  await requireInternalSession()
  const user = await getInternalUserFromSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  if (userHasPermission(user, permission)) {
    return user
  }
  throw new Error('Forbidden')
}

export async function requireAnyPermission(permissions: string[]): Promise<InternalUser> {
  await requireInternalSession()
  const user = await getInternalUserFromSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  if (user.permissions.includes('*')) {
    return user
  }
  const hasAny = permissions.some((p) => user.permissions.includes(p))
  if (hasAny) {
    return user
  }
  throw new Error('Forbidden')
}
