import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireInternalSession } from '@/lib/auth'
import { getPool } from '@/lib/db'
const bcrypt = require('bcryptjs')

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await getPool().connect()
  
  try {
    await requireInternalSession()
    const body = await request.json()
    const { nombre, email, password, telefono } = body

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Iniciar transacción
    await client.query('BEGIN')

    // Obtener el lead
    const leadResult = await client.query(
      'SELECT * FROM leads WHERE id = $1',
      [params.id]
    )

    if (leadResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    const lead = leadResult.rows[0]

    // Verificar que el estado sea de conversión
    const estadosConversion = ['seña', 'downsell', 'cerrado']
    if (!estadosConversion.includes(lead.estado)) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'El lead no está en un estado de conversión' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Generar número de identificación único
    const numero_identificacion = `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Crear el cliente
    const clienteResult = await client.query(
      `INSERT INTO clientes (
        nombre, email, password_hash, telefono, numero_identificacion
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, email, telefono, estado_entrega, numero_identificacion, created_at`,
      [
        nombre,
        email,
        password_hash,
        telefono || null,
        numero_identificacion,
      ]
    )

    const cliente = clienteResult.rows[0]

    // Actualizar el lead para linkearlo al cliente
    await client.query(
      `UPDATE leads 
       SET cliente_id = $1
       WHERE id = $2`,
      [cliente.id, params.id]
    )

    // Commit de la transacción
    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      clienteId: cliente.id,
      cliente
    })
  } catch (error: any) {
    // Rollback en caso de error
    await client.query('ROLLBACK')
    
    console.error('Error al convertir lead:', error)
    
    if (error.code === '23505') {
      // Violación de unique constraint (email)
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al convertir lead a cliente' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
