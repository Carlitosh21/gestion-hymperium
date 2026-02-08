import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { cookies } from 'next/headers'
const bcrypt = require('bcryptjs')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario interno
    const result = await query(
      'SELECT id, email, password_hash, role FROM usuarios_internos WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

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
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: error.message || 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
