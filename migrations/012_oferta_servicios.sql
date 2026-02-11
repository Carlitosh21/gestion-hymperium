-- Oferta y Servicios: Docs, Ofertas, SOPs y versionado

-- Docs (biblioteca de documentos útiles)
CREATE TABLE IF NOT EXISTS docs (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(500) NOT NULL,
  contenido_json JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  carpeta VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ofertas (catálogo)
CREATE TABLE IF NOT EXISTS ofertas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(500) NOT NULL,
  resumen TEXT,
  contenido_json JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Módulos/características de cada oferta
CREATE TABLE IF NOT EXISTS oferta_modulos (
  id SERIAL PRIMARY KEY,
  oferta_id INTEGER NOT NULL REFERENCES ofertas(id) ON DELETE CASCADE,
  titulo VARCHAR(500) NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hitos/cronograma de entrega por oferta
CREATE TABLE IF NOT EXISTS oferta_hitos (
  id SERIAL PRIMARY KEY,
  oferta_id INTEGER NOT NULL REFERENCES ofertas(id) ON DELETE CASCADE,
  titulo VARCHAR(500) NOT NULL,
  descripcion TEXT,
  dias_desde_inicio INTEGER,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOPs (procesos estandarizados)
CREATE TABLE IF NOT EXISTS sops (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(500) NOT NULL,
  objetivo TEXT,
  contenido_json JSONB DEFAULT '{}',
  frecuencia VARCHAR(100),
  owner VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pasos de cada SOP
CREATE TABLE IF NOT EXISTS sop_pasos (
  id SERIAL PRIMARY KEY,
  sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  titulo VARCHAR(500) NOT NULL,
  descripcion TEXT,
  checklist_json JSONB DEFAULT '[]',
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revisiones (versionado)
CREATE TABLE IF NOT EXISTS revisiones (
  id SERIAL PRIMARY KEY,
  entidad_tipo VARCHAR(50) NOT NULL,
  entidad_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revisiones_entidad ON revisiones(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_docs_tags ON docs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_oferta_modulos_oferta ON oferta_modulos(oferta_id);
CREATE INDEX IF NOT EXISTS idx_oferta_hitos_oferta ON oferta_hitos(oferta_id);
CREATE INDEX IF NOT EXISTS idx_sop_pasos_sop ON sop_pasos(sop_id);
