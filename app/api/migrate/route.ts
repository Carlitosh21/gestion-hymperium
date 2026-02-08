import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '@/lib/db'

export async function POST() {
  try {
    // Leer el archivo de migración
    const migrationPath = join(process.cwd(), 'migrations', '001_initial_schema.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Ejecutar la migración completa
    // Dividir por punto y coma y ejecutar cada statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    // Ejecutar cada statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement + ';')
        } catch (error: any) {
          // Ignorar errores de "ya existe" o "duplicate"
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('constraint') && error.message.includes('already exists') ||
            error.message.includes('IF NOT EXISTS')
          )) {
            console.log(`Saltando (ya existe): ${error.message.substring(0, 80)}`)
            continue
          }
          // Re-lanzar otros errores
          throw error
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migración ejecutada correctamente' 
    })
  } catch (error: any) {
    console.error('Error en migración:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al ejecutar migración' 
      },
      { status: 500 }
    )
  }
}
