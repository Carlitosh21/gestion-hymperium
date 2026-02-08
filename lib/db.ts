import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'hymperium',
      // Importante para Easy Panel: min: 0 evita problemas de conexión cuando el contenedor está inactivo
      min: 0,
      max: 10,
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const db = getPool()
  return db.query(text, params)
}
