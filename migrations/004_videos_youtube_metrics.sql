-- Migración 004: Agregar métricas de YouTube a videos
-- Agrega campos para view_count, like_count, comment_count y índice único para plataforma+video_id

-- Agregar columnas de métricas si no existen
ALTER TABLE videos ADD COLUMN IF NOT EXISTS view_count INTEGER;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS like_count INTEGER;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS comment_count INTEGER;

-- Crear índice único para evitar duplicados por plataforma+video_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_plataforma_video_id_unique ON videos(plataforma, video_id);
