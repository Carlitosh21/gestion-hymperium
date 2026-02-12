-- Migración 014: Estados en Egresos (Pendiente/Completado)
-- Solo los egresos completados descuentan en cuentas reales

ALTER TABLE egresos
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'completado';

UPDATE egresos
SET estado = 'completado'
WHERE estado IS NULL;

COMMENT ON COLUMN egresos.estado IS 'pendiente: no descuenta en cuentas reales. completado: sí descuenta.';
