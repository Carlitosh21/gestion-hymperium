-- Migración 019: Eliminar columnas de porcentajes en ingresos
-- Todo entra a la cuenta de la agencia (ingresos netos = monto - pago_desarrollador)

ALTER TABLE ingresos DROP COLUMN IF EXISTS porcentaje_carlitos;
ALTER TABLE ingresos DROP COLUMN IF EXISTS porcentaje_joaco;
ALTER TABLE ingresos DROP COLUMN IF EXISTS porcentaje_hymperium;
