-- Eliminar Pipeline de Leads y Contenido (tablas y columnas asociadas)
-- Ejecutar después de backup si hay datos a conservar

-- 1. Remover FK y columna lead_id de llamadas
ALTER TABLE llamadas DROP CONSTRAINT IF EXISTS llamadas_lead_id_fkey;
ALTER TABLE llamadas DROP COLUMN IF EXISTS lead_id;

-- 2. Drop tablas en orden (respetando FKs)
DROP TABLE IF EXISTS lead_estado_eventos CASCADE;
DROP TABLE IF EXISTS seguimiento_envios CASCADE;
DROP TABLE IF EXISTS seguimiento_estados CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS ideas_contenido CASCADE;
DROP TABLE IF EXISTS seguimientos CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
