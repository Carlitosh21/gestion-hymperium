import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    // Asegurarse de que la contraseña siempre sea un string válido
    let password = ''
    if (process.env.PGPASSWORD !== undefined && process.env.PGPASSWORD !== null) {
      password = String(process.env.PGPASSWORD)
    }

    // Validar que todos los parámetros requeridos estén presentes
    const host = process.env.PGHOST || 'localhost'
    const port = parseInt(process.env.PGPORT || '5432')
    const user = process.env.PGUSER || 'postgres'
    const database = process.env.PGDATABASE || 'hymperium'

    console.log('Configurando conexión DB:', {
      host,
      port,
      user,
      database,
      passwordLength: password.length,
      passwordDefined: !!process.env.PGPASSWORD
    })

    pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      // Importante para Easy Panel: min: 0 evita problemas de conexión cuando el contenedor está inactivo
      min: 0,
      max: 10,
    })

    // Manejar errores de conexión
    pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL:', err)
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  try {
    const db = getPool()
    return await db.query(text, params)
  } catch (error: any) {
    // Log detallado para debugging
    console.error('Error en query DB:', {
      message: error.message,
      code: error.code,
      query: text.substring(0, 100),
    })
    throw error
  }
}
