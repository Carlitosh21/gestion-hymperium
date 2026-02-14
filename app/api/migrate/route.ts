import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '@/lib/db'
import { hasAdmin, requireInternalSession, requirePermission } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Verificar si existe admin (con manejo de errores de conexión)
    let adminExists = false
    try {
      adminExists = await hasAdmin()
    } catch (error: any) {
      // Si hay error de conexión a la DB, permitir migraciones (setup inicial)
      console.error('Error al verificar admin (probablemente DB no conectada):', error.message)
      // Continuar con migraciones para permitir setup inicial
    }
    
    // Si ya hay admin, requiere permiso config.manage
    if (adminExists) {
      try {
        await requirePermission('config.manage')
      } catch (error: any) {
        if (error?.message === 'Forbidden') {
          return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
        }
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }
    // Si no hay admin, permitir ejecutar migraciones (setup inicial)
    // Ejecutar migraciones en orden
    const migrations = ['001_initial_schema.sql', '002_auth.sql', '003_leads_pipeline.sql', '004_videos_youtube_metrics.sql', '005_seguimientos.sql', '006_ideas_contenido_long_short_programado.sql', '007_onboarding_titulo_descripcion.sql', '008_onboarding_json_y_unique.sql', '009_fix_ideas_contenido_document_id_constraint.sql', '010_ideas_contenido_reels_guion.sql', '011_lead_estado_eventos.sql', '012_oferta_servicios.sql', '013_seguimientos_envios_no_repeat.sql', '014_egresos_estado.sql', '015_ingresos_estado.sql', '016_rbac.sql']
    
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
