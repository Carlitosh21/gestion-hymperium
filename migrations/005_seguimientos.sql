-- Migración 005: Sistema de Seguimientos para Pipeline de Leads
-- Permite configurar reglas de seguimiento que se disparan cuando un lead está en ciertos estados
-- y han pasado X horas desde la última edición del estado

-- Tabla principal de seguimientos
CREATE TABLE IF NOT EXISTS seguimientos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  delay_horas INTEGER NOT NULL CHECK (delay_horas > 0),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación N:N entre seguimientos y estados del pipeline
CREATE TABLE IF NOT EXISTS seguimiento_estados (
  seguimiento_id INTEGER NOT NULL REFERENCES seguimientos(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL,
  PRIMARY KEY (seguimiento_id, estado)
);

-- Tabla de log/envíos para evitar duplicados (idempotencia)
-- Guarda un snapshot del estado_editado_at del lead al momento de marcar como enviado
CREATE TABLE IF NOT EXISTS seguimiento_envios (
  id SERIAL PRIMARY KEY,
  seguimiento_id INTEGER NOT NULL REFERENCES seguimientos(id) ON DELETE CASCADE,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL,
  estado_editado_at_snapshot TIMESTAMP NOT NULL,
  enviado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(seguimiento_id, lead_id, estado_editado_at_snapshot)
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_seguimiento_envios_lead_id ON seguimiento_envios(lead_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_envios_seguimiento_id ON seguimiento_envios(seguimiento_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_estados_seguimiento_id ON seguimiento_estados(seguimiento_id);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado) WHERE cliente_id IS NULL;

-- Comentarios para documentación
COMMENT ON TABLE seguimientos IS 'Reglas configurables de seguimiento para leads en el pipeline';
COMMENT ON TABLE seguimiento_estados IS 'Estados del pipeline vinculados a cada seguimiento (N:N)';
COMMENT ON TABLE seguimiento_envios IS 'Registro de seguimientos marcados como enviados (evita duplicados por cambio de estado)';
COMMENT ON COLUMN seguimiento_envios.estado_editado_at_snapshot IS 'Snapshot del estado_editado_at del lead al momento de marcar como enviado';
