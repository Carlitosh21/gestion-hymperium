-- Migración 002: Sistema de autenticación
-- Tabla de usuarios internos (admin/staff)
CREATE TABLE IF NOT EXISTS usuarios_internos (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- 'admin' o 'staff'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones (para usuarios internos y clientes)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  kind VARCHAR(50) NOT NULL, -- 'internal' o 'client'
  internal_user_id INTEGER REFERENCES usuarios_internos(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_kind ON sessions(kind);
CREATE INDEX IF NOT EXISTS idx_sessions_internal_user ON sessions(internal_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_cliente ON sessions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
