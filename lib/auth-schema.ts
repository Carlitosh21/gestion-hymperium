import { query } from './db'

/**
 * Crea solo las tablas necesarias para autenticación interna (usuarios_internos, sessions).
 * Incluye clientes porque sessions tiene FK a clientes(id).
 * Idempotente: CREATE TABLE IF NOT EXISTS.
 */
export async function ensureAuthTables(): Promise<void> {
  // clientes: necesaria para FK de sessions; crear mínima si no existe
  await query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255),
      email VARCHAR(255),
      password_hash VARCHAR(255),
      telefono VARCHAR(50),
      estado_entrega INTEGER DEFAULT 0,
      numero_identificacion VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // usuarios_internos
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios_internos (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // sessions (depende de usuarios_internos y clientes)
  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE NOT NULL,
      kind VARCHAR(50) NOT NULL,
      internal_user_id INTEGER REFERENCES usuarios_internos(id) ON DELETE CASCADE,
      cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Índices
  await query('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)')
  await query('CREATE INDEX IF NOT EXISTS idx_sessions_kind ON sessions(kind)')
  await query('CREATE INDEX IF NOT EXISTS idx_sessions_internal_user ON sessions(internal_user_id)')
  await query('CREATE INDEX IF NOT EXISTS idx_sessions_cliente ON sessions(cliente_id)')
  await query('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)')
}
