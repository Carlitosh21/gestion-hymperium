-- Migración 003: Pipeline de Leads con Instagram y conversión a Cliente
-- Agrega columnas necesarias para el nuevo sistema de pipeline

-- Agregar columna usuario_ig (puede ser NULL para compatibilidad con datos existentes)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_ig VARCHAR(255);

-- Agregar columna estado_editado_at para tracking de última edición
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS estado_editado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Agregar columna cliente_id para linkear leads convertidos a clientes
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL;

-- Actualizar estado_editado_at para leads existentes (usar updated_at como fallback)
UPDATE leads 
SET estado_editado_at = COALESCE(updated_at, created_at) 
WHERE estado_editado_at IS NULL;

-- Migrar estados antiguos a nuevos estados del pipeline
-- Mapeo: nuevo -> mensaje_conexion, contactado -> respondio, calificado -> respuesta_positiva, 
-- propuesta -> video_enviado, ganado -> cerrado, perdido -> no_cualifica
UPDATE leads 
SET estado = CASE 
  WHEN estado = 'nuevo' THEN 'mensaje_conexion'
  WHEN estado = 'contactado' THEN 'respondio'
  WHEN estado = 'calificado' THEN 'respuesta_positiva'
  WHEN estado = 'propuesta' THEN 'video_enviado'
  WHEN estado = 'ganado' THEN 'cerrado'
  WHEN estado = 'perdido' THEN 'no_cualifica'
  ELSE 'mensaje_conexion'
END,
estado_editado_at = CURRENT_TIMESTAMP
WHERE estado IN ('nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido');

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_estado_editado_at ON leads(estado_editado_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_cliente_id ON leads(cliente_id);
CREATE INDEX IF NOT EXISTS idx_leads_usuario_ig ON leads(usuario_ig);

-- Comentarios para documentación
COMMENT ON COLUMN leads.usuario_ig IS 'Usuario de Instagram del lead (handle sin @)';
COMMENT ON COLUMN leads.estado_editado_at IS 'Fecha y hora del último cambio de estado';
COMMENT ON COLUMN leads.cliente_id IS 'ID del cliente si el lead fue convertido (NULL si aún es lead)';
