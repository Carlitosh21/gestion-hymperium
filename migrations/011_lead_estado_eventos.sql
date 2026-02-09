-- Migración 011: Tracking de transiciones de estado de Leads
-- Permite medir tasas exactas de conversión entre estados del pipeline

-- Tabla de eventos de cambio de estado
CREATE TABLE IF NOT EXISTS lead_estado_eventos (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_estado VARCHAR(50), -- NULL si es el estado inicial
  to_estado VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_lead_estado_eventos_lead_id ON lead_estado_eventos(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_estado_eventos_changed_at ON lead_estado_eventos(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_estado_eventos_to_estado ON lead_estado_eventos(to_estado);
CREATE INDEX IF NOT EXISTS idx_lead_estado_eventos_from_estado ON lead_estado_eventos(from_estado) WHERE from_estado IS NOT NULL;

-- Backfill: crear eventos para leads existentes basados en su estado actual
-- Esto permite tener un punto de partida para el tracking, aunque no sea histórico exacto
INSERT INTO lead_estado_eventos (lead_id, from_estado, to_estado, changed_at)
SELECT 
  id,
  NULL as from_estado, -- Estado inicial, no sabemos de dónde vino
  estado as to_estado,
  COALESCE(estado_editado_at, created_at) as changed_at
FROM leads
WHERE NOT EXISTS (
  SELECT 1 FROM lead_estado_eventos 
  WHERE lead_estado_eventos.lead_id = leads.id
);

-- Comentarios para documentación
COMMENT ON TABLE lead_estado_eventos IS 'Registro histórico de cambios de estado en el pipeline de leads';
COMMENT ON COLUMN lead_estado_eventos.from_estado IS 'Estado anterior (NULL si es el estado inicial del lead)';
COMMENT ON COLUMN lead_estado_eventos.to_estado IS 'Estado nuevo al que cambió el lead';
COMMENT ON COLUMN lead_estado_eventos.changed_at IS 'Fecha y hora exacta del cambio de estado';
