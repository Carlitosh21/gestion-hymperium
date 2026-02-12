-- Migración 015: Estados en Ingresos (Pendiente/Completado)
-- Solo los ingresos completados suman a cuentas reales (billetera/KPIs)

ALTER TABLE ingresos
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'completado';

UPDATE ingresos
SET estado = 'completado'
WHERE estado IS NULL;

COMMENT ON COLUMN ingresos.estado IS 'pendiente: no suma en cuentas reales. completado: sí suma.';
