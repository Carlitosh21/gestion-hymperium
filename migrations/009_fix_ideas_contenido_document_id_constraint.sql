-- Migración 009: Arreglar constraint único en document_id para ideas_contenido
-- El índice único parcial no funciona correctamente con ON CONFLICT
-- Solución: Crear un índice único estándar que funcione con ON CONFLICT (document_id)

-- Eliminar el índice único parcial existente
DROP INDEX IF EXISTS idx_ideas_contenido_document_id_unique;

-- Crear índice único estándar (sin WHERE clause)
-- Esto permite usar ON CONFLICT (document_id) directamente en las queries
-- Nota: Este índice único estándar solo permite un NULL, pero como las ideas de n8n
-- siempre tienen document_id, esto no debería ser un problema.
-- Si hay ideas creadas manualmente sin document_id, solo puede haber una con NULL.
CREATE UNIQUE INDEX idx_ideas_contenido_document_id_unique 
ON ideas_contenido(document_id);

COMMENT ON INDEX idx_ideas_contenido_document_id_unique IS 'Índice único para document_id, permite usar ON CONFLICT (document_id) en queries de sincronización';
