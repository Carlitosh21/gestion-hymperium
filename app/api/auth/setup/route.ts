import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hasAdmin, createSession } from '@/lib/auth'
import { cookies } from 'next/headers'
const bcrypt = require('bcryptjs')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const adminExists = await hasAdmin()
  return NextResponse.json({ adminExists })
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

    // Crear el primer admin
    const result = await query(
      `INSERT INTO usuarios_internos (email, password_hash, role)
       VALUES ($1, $2, 'admin')
       RETURNING id, email, role`,
      [email, password_hash]
    )

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
