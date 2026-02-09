-- Migración 007: Agregar título y descripción separados a preguntas de onboarding
-- Permite tener un título corto y una descripción más detallada para cada pregunta

-- Agregar columna titulo
ALTER TABLE preguntas_onboarding ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);

-- Agregar columna descripcion
ALTER TABLE preguntas_onboarding ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Migrar datos existentes: usar pregunta como titulo por defecto
UPDATE preguntas_onboarding SET titulo = pregunta WHERE titulo IS NULL;

-- Hacer titulo NOT NULL después de migrar (solo si hay datos)
-- Nota: No podemos hacer ALTER COLUMN SET NOT NULL directamente si hay NULLs
-- pero como ya migramos, debería estar bien. Si falla, se puede hacer manualmente.

-- Comentarios para documentación
COMMENT ON COLUMN preguntas_onboarding.titulo IS 'Título corto de la pregunta (se muestra como label principal)';
COMMENT ON COLUMN preguntas_onboarding.descripcion IS 'Descripción detallada de la pregunta (ayuda contextual para el usuario)';
