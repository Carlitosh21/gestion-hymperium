-- Migración 013: Seguimiento "Ya enviado" no se repite por ese seguimiento
-- Un lead marcado como enviado para un seguimiento no vuelve a aparecer en ese mismo seguimiento,
-- aunque cambie de estado o pasen más horas (comportamiento: nunca más para ese seguimiento)

-- Eliminar duplicados manteniendo solo el más reciente por (seguimiento_id, lead_id)
DELETE FROM seguimiento_envios a
USING seguimiento_envios b
WHERE a.seguimiento_id = b.seguimiento_id
  AND a.lead_id = b.lead_id
  AND a.id < b.id;

-- Dropear el UNIQUE constraint anterior (snapshot)
ALTER TABLE seguimiento_envios
DROP CONSTRAINT IF EXISTS seguimiento_envios_seguimiento_id_lead_id_estado_editado_at_snapshot_key;

-- Nuevo UNIQUE: un lead solo puede estar marcado una vez por seguimiento
ALTER TABLE seguimiento_envios
ADD CONSTRAINT seguimiento_envios_seguimiento_lead_unique UNIQUE (seguimiento_id, lead_id);

COMMENT ON CONSTRAINT seguimiento_envios_seguimiento_lead_unique ON seguimiento_envios IS
'Un lead marcado como enviado para un seguimiento no vuelve a aparecer en ese seguimiento';
