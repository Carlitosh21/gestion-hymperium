-- Migración 008: Agregar onboarding_json a clientes y constraint único en datos_onboarding
-- Permite guardar un JSON agregado de respuestas en el cliente y evita duplicados en datos_onboarding

-- Agregar columna onboarding_json a clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS onboarding_json JSONB DEFAULT '{}'::jsonb;

-- Agregar constraint único en datos_onboarding para evitar duplicados
-- Primero eliminar posibles duplicados existentes (mantener el más reciente)
DELETE FROM datos_onboarding d1
WHERE EXISTS (
  SELECT 1 FROM datos_onboarding d2
  WHERE d2.cliente_id = d1.cliente_id
    AND d2.pregunta_id = d1.pregunta_id
    AND d2.id > d1.id
);

-- Crear constraint único si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_datos_onboarding_cliente_pregunta'
  ) THEN
    ALTER TABLE datos_onboarding
      ADD CONSTRAINT uq_datos_onboarding_cliente_pregunta
      UNIQUE (cliente_id, pregunta_id);
  END IF;
END $$;

-- Crear índice para mejorar rendimiento en consultas de onboarding_json
CREATE INDEX IF NOT EXISTS idx_clientes_onboarding_json ON clientes USING GIN (onboarding_json);

-- Comentarios para documentación
COMMENT ON COLUMN clientes.onboarding_json IS 'JSON agregado de respuestas del formulario de onboarding (estructura: {pregunta_id: respuesta})';
COMMENT ON CONSTRAINT uq_datos_onboarding_cliente_pregunta ON datos_onboarding IS 'Evita respuestas duplicadas para la misma pregunta del mismo cliente';
