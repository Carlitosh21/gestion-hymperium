import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'
const bcrypt = require('bcryptjs')

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    const result = await query(
      'SELECT id, nombre, email, telefono, estado_entrega, created_at FROM clientes ORDER BY created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const { nombre, email, password, telefono, llamada_id } = body

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Generar número de identificación único
    const numero_identificacion = `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const result = await query(
      `INSERT INTO clientes (
        nombre, email, password_hash, telefono, llamada_id, numero_identificacion
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, email, telefono, estado_entrega, numero_identificacion, created_at`,
      [
        nombre,
        email,
        password_hash,
        telefono || null,
        llamada_id || null,
        numero_identificacion,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    console.error('Error al crear cliente:', error)
    if (error.code === '23505') {
      // Violación de unique constraint (email)
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
