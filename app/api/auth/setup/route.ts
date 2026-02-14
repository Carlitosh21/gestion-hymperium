import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hasAdmin, createSession } from '@/lib/auth'
import { cookies } from 'next/headers'
const bcrypt = require('bcryptjs')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const adminExists = await hasAdmin()
    return NextResponse.json({ adminExists })
  } catch (error: any) {
    // Si hay error (ej: tabla no existe), tratar como "no hay admin"
    console.error('Error al verificar admin:', error)
    return NextResponse.json({ adminExists: false })
  }
}

export async function POST(request: Request) {
  try {
    // Verificar que no haya admin existente
    const adminExists = await hasAdmin()
    if (adminExists) {
      return NextResponse.json(
        { error: 'Ya existe un administrador. Usa /login para iniciar sesión.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Crear el primer admin (con role_id si existe tabla roles y columna)
    let result: any
    try {
      let roleId: number | null = null
      try {
        const roleIdResult = await query(
          `SELECT id FROM roles WHERE name = 'admin' LIMIT 1`
        )
        roleId = roleIdResult?.rows?.[0]?.id ?? null
      } catch {
        // Tabla roles puede no existir (migración 016 no corrida)
      }

      try {
        if (roleId != null) {
          result = await query(
            `INSERT INTO usuarios_internos (email, password_hash, role, role_id)
             VALUES ($1, $2, 'admin', $3)
             RETURNING id, email, role`,
            [email, password_hash, roleId]
          )
        } else {
          throw new Error('NO_ROLE_ID')
        }
      } catch (insertErr: any) {
        if (insertErr.message === 'NO_ROLE_ID' || insertErr?.code === '42703') {
          result = await query(
            `INSERT INTO usuarios_internos (email, password_hash, role)
             VALUES ($1, $2, 'admin')
             RETURNING id, email, role`,
            [email, password_hash]
          )
        } else {
          throw insertErr
        }
      }
    } catch (error: any) {
      // Migraciones no corridas: la tabla puede no existir todavía.
      if (error?.code === '42P01') {
        return NextResponse.json(
          { error: 'Base de datos sin migrar. Ejecutá primero POST /api/migrate.' },
          { status: 503 }
        )
      }
      throw error
    }

    const user = result.rows[0]

    // Crear sesión
    const token = await createSession('internal', user.id)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('gh_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (error: any) {
    console.error('Error en setup:', error)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Error al crear administrador' },
      { status: 500 }
    )
  }
}
