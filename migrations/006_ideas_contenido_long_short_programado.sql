-- Migración 006: Extender Ideas de Contenido con nuevos estados y campos para guion Long Form
-- Agrega campos para document_id, guion_longform_url, descripcion_estrategica y n8n_payload

-- Agregar columna document_id para vincular con documentos de Google Docs
ALTER TABLE ideas_contenido ADD COLUMN IF NOT EXISTS document_id VARCHAR(255);

-- Agregar columna guion_longform_url para almacenar la URL del guion Long Form
ALTER TABLE ideas_contenido ADD COLUMN IF NOT EXISTS guion_longform_url VARCHAR(1000);

-- Agregar columna descripcion_estrategica para la descripción estratégica completa
ALTER TABLE ideas_contenido ADD COLUMN IF NOT EXISTS descripcion_estrategica TEXT;

-- Agregar columna n8n_payload para guardar el JSON original de n8n (útil para debug)
ALTER TABLE ideas_contenido ADD COLUMN IF NOT EXISTS n8n_payload JSONB;

-- Crear índice único para evitar duplicados por document_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ideas_contenido_document_id_unique ON ideas_contenido(document_id) WHERE document_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN ideas_contenido.document_id IS 'ID del documento de Google Docs asociado (usado para construir guion_longform_url)';
COMMENT ON COLUMN ideas_contenido.guion_longform_url IS 'URL completa del guion Long Form en Google Docs';
COMMENT ON COLUMN ideas_contenido.descripcion_estrategica IS 'Descripción estratégica completa de la idea (viene de n8n o se ingresa manualmente)';
COMMENT ON COLUMN ideas_contenido.n8n_payload IS 'Payload JSON original de n8n para referencia y debug';
