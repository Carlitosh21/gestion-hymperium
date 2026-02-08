import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '@/lib/db'

export async function POST() {
  try {
    // Leer el archivo de migración
    const migrationPath = join(process.cwd(), 'migrations', '001_initial_schema.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Ejecutar la migración completa como una sola transacción
    // Esto asegura que si algo falla, todo se revierte
    await query('BEGIN')
    
    try {
      // Dividir por punto y coma, pero manejar bloques DO $$ ... END $$;
      const statements: string[] = []
      let currentStatement = ''
      let inDoBlock = false
      let dollarQuote = ''
      
      for (let i = 0; i < migrationSQL.length; i++) {
        const char = migrationSQL[i]
        const nextChars = migrationSQL.substring(i, i + 2)
        
        // Detectar inicio de bloque DO $$
        if (nextChars === 'DO' && !inDoBlock) {
          const afterDo = migrationSQL.substring(i + 2).trim()
          if (afterDo.startsWith('$$')) {
            inDoBlock = true
            dollarQuote = '$$'
            currentStatement += 'DO $$'
            i += 3 // Saltar 'DO $$'
            continue
          } else if (afterDo.match(/^\$[a-zA-Z_][a-zA-Z0-9_]*\$/)) {
            // Detectar delimitador personalizado como $tag$
            const match = afterDo.match(/^(\$[a-zA-Z_][a-zA-Z0-9_]*\$)/)
            if (match) {
              inDoBlock = true
              dollarQuote = match[1]
              currentStatement += 'DO ' + dollarQuote
              i += 2 + dollarQuote.length - 1
              continue
            }
          }
        }
        
        // Detectar fin de bloque DO
        if (inDoBlock && migrationSQL.substring(i).startsWith(dollarQuote + ';')) {
          currentStatement += dollarQuote + ';'
          statements.push(currentStatement.trim())
          currentStatement = ''
          inDoBlock = false
          dollarQuote = ''
          i += dollarQuote.length + 1 // Saltar el delimitador y el punto y coma
          continue
        }
        
        currentStatement += char
        
        // Si no estamos en un bloque DO, dividir por punto y coma
        if (!inDoBlock && char === ';') {
          const trimmed = currentStatement.trim()
          if (trimmed && !trimmed.startsWith('--')) {
            statements.push(trimmed)
          }
          currentStatement = ''
        }
      }
      
      // Agregar el último statement si existe
      if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
        statements.push(currentStatement.trim())
      }
      
      // Ejecutar cada statement
      for (const statement of statements) {
        if (statement.trim() && statement.trim().length > 0) {
          try {
            await query(statement)
          } catch (err: any) {
            // Si es un error de "ya existe", continuar
            if (err.message && (
              err.message.includes('already exists') ||
              err.message.includes('duplicate') ||
              err.message.includes('constraint') && err.message.includes('already exists')
            )) {
              console.log(`Saltando: ${err.message}`)
              continue
            }
            throw err
          }
        }
      }
      
      await query('COMMIT')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Migración ejecutada correctamente' 
      })
    } catch (error: any) {
      await query('ROLLBACK')
      throw error
    }
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
