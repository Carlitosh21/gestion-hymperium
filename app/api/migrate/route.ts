import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '@/lib/db'

export async function POST() {
  try {
    // Ejecutar migraciones en orden
    const migrations = ['001_initial_schema.sql', '002_auth.sql']
    
    for (const migrationFile of migrations) {
      const migrationPath = join(process.cwd(), 'migrations', migrationFile)
      const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Ejecutar usando el cliente pg directamente para mejor control
    const db = query as any
    
    // Dividir el SQL en statements, manejando bloques DO $$ correctamente
    const statements: string[] = []
    let current = ''
    let inDoBlock = false
    let dollarTag = ''
    let depth = 0
    
    const lines = migrationSQL.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Detectar inicio de DO $$
      if (trimmed.match(/^\s*DO\s+\$\$/) || trimmed.match(/^\s*DO\s+\$[a-zA-Z_]/)) {
        inDoBlock = true
        const match = trimmed.match(/DO\s+(\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$)/)
        if (match) {
          dollarTag = match[1]
        }
        current += line + '\n'
        continue
      }
      
      // Si estamos en un bloque DO, acumular hasta encontrar el cierre
      if (inDoBlock) {
        current += line + '\n'
        // Buscar el cierre del bloque (END seguido del dollar tag y punto y coma)
        if (trimmed.includes('END') && trimmed.includes(dollarTag + ';')) {
          statements.push(current.trim())
          current = ''
          inDoBlock = false
          dollarTag = ''
        }
        continue
      }
      
      // Statement normal
      if (trimmed && !trimmed.startsWith('--')) {
        current += line + '\n'
        if (trimmed.endsWith(';')) {
          statements.push(current.trim())
          current = ''
        }
      }
    }
    
    // Agregar el último statement si existe
    if (current.trim() && !current.trim().startsWith('--')) {
      statements.push(current.trim())
    }
    
      // Ejecutar cada statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await query(statement)
          } catch (error: any) {
            // Ignorar errores de "ya existe"
            if (error.message && (
              error.message.includes('already exists') ||
              error.message.includes('duplicate') ||
              error.message.includes('constraint') && error.message.includes('already exists')
            )) {
              console.log(`Saltando (ya existe): ${error.message.substring(0, 80)}`)
              continue
            }
            // Re-lanzar otros errores
            throw error
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migraciones ejecutadas correctamente' 
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
