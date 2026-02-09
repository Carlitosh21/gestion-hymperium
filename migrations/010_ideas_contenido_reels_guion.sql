-- Migración 010: Agregar campos para guiones de Reels en ideas_contenido
-- Agrega reels_document_id y guion_reels_url para vincular con documentos de Google Docs de Reels

-- Agregar columna reels_document_id para vincular con documentos de Google Docs de Reels
ALTER TABLE ideas_contenido ADD COLUMN IF NOT EXISTS reels_document_id VARCHAR(255);

-- Agregar columna guion_reels_url para almacenar la URL del guion de Reels
ALTER TABLE ideas_contenido ADD COLUMN IF NOT EXISTS guion_reels_url VARCHAR(1000);

-- Crear índice único para evitar duplicados por reels_document_id (similar a document_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ideas_contenido_reels_document_id_unique 
ON ideas_contenido(reels_document_id) WHERE reels_document_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN ideas_contenido.reels_document_id IS 'ID del documento de Google Docs asociado para guiones de Reels (usado para construir guion_reels_url)';
COMMENT ON COLUMN ideas_contenido.guion_reels_url IS 'URL completa del guion de Reels en Google Docs';
