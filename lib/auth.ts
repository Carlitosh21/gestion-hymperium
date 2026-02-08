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
