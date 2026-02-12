import { NextResponse } from 'next/server'
import { hasAdmin, requireInternalSession } from '@/lib/auth'
import { ensureAuthTables } from '@/lib/auth-schema'
import { ensureConfigTable } from '@/lib/config-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Migración mínima: crea SOLO las tablas de autenticación (usuarios_internos, sessions)
 * y clientes (necesaria para FK de sessions). No toca tablas existentes del proyecto.
 */
export async function POST() {
  try {
    let adminExists = false
    try {
      adminExists = await hasAdmin()
    } catch (error: any) {
      console.error('Error al verificar admin:', error.message)
    }

    if (adminExists) {
      try {
        await requireInternalSession()
      } catch {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    await ensureAuthTables()
    await ensureConfigTable()

    return NextResponse.json({
      success: true,
      message: 'Tablas de autenticación creadas correctamente',
    })
  } catch (error: any) {
    console.error('Error en migración:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al ejecutar migración',
      },
      { status: 500 }
    )
  }
}
