-- Migración inicial del esquema de base de datos
-- Ejecutar este script cuando se configure la base de datos por primera vez

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de leads (prospección)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  origen VARCHAR(100), -- 'prospeccion' o 'contenido'
  metodo_prospeccion VARCHAR(255),
  estado VARCHAR(50) DEFAULT 'nuevo',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ideas de contenido
CREATE TABLE IF NOT EXISTS ideas_contenido (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(500) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'aceptada', 'rechazada'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de videos
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  plataforma VARCHAR(50) NOT NULL, -- 'youtube' o 'instagram'
  tipo VARCHAR(50) NOT NULL, -- 'long_form' o 'short_form'
  titulo VARCHAR(500),
  url VARCHAR(1000) NOT NULL,
  video_id VARCHAR(255),
  idea_contenido_id INTEGER REFERENCES ideas_contenido(id) ON DELETE SET NULL,
  thumbnail_url VARCHAR(1000),
  duracion INTEGER, -- en segundos
  fecha_publicacion TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes (sin referencia a llamadas todavía)
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- para acceso al panel del cliente
  telefono VARCHAR(50),
  estado_entrega INTEGER DEFAULT 0, -- porcentaje 0-100
  cotizacion TEXT,
  entregables TEXT,
  llamada_id INTEGER, -- se agregará la foreign key después
  numero_identificacion VARCHAR(100) UNIQUE, -- para vincular formulario de onboarding
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de llamadas
CREATE TABLE IF NOT EXISTS llamadas (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  fecha TIMESTAMP NOT NULL,
  duracion INTEGER, -- en segundos
  link_grabacion VARCHAR(1000),
  notas TEXT,
  resultado VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar foreign key de clientes a llamadas después de crear ambas tablas
-- Usar IF NOT EXISTS con ALTER TABLE directamente (PostgreSQL 9.5+)
ALTER TABLE clientes 
  ADD CONSTRAINT IF NOT EXISTS fk_clientes_llamada 
  FOREIGN KEY (llamada_id) REFERENCES llamadas(id) ON DELETE SET NULL;

-- Tabla de recursos relacionados a clientes
CREATE TABLE IF NOT EXISTS recursos_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(100), -- 'archivo', 'link', 'nota'
  url VARCHAR(1000),
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  responsable VARCHAR(50) NOT NULL, -- 'nosotros' o 'ellos'
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_progreso', 'completada'
  fecha_limite TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de resultados del cliente
CREATE TABLE IF NOT EXISTS resultados_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de preguntas del formulario de onboarding (DEBE CREARSE ANTES de datos_onboarding)
CREATE TABLE IF NOT EXISTS preguntas_onboarding (
  id SERIAL PRIMARY KEY,
  pregunta TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'texto', -- 'texto', 'numero', 'opcion_multiple', etc.
  opciones JSONB, -- para preguntas de opción múltiple
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de datos de onboarding (DESPUÉS de preguntas_onboarding)
CREATE TABLE IF NOT EXISTS datos_onboarding (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  pregunta_id INTEGER REFERENCES preguntas_onboarding(id) ON DELETE CASCADE,
  respuesta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id SERIAL PRIMARY KEY,
  monto DECIMAL(12, 2) NOT NULL,
  descripcion VARCHAR(500),
  proyecto_id INTEGER, -- referencia flexible a proyectos/clientes
  tipo_proyecto VARCHAR(100),
  pago_desarrollador DECIMAL(12, 2) DEFAULT 0,
  porcentaje_carlitos DECIMAL(5, 2) DEFAULT 0,
  porcentaje_joaco DECIMAL(5, 2) DEFAULT 0,
  porcentaje_hymperium DECIMAL(5, 2) DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de egresos
CREATE TABLE IF NOT EXISTS egresos (
  id SERIAL PRIMARY KEY,
  monto DECIMAL(12, 2) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  categoria VARCHAR(100) NOT NULL, -- 'supervivencia', 'servicios', 'marketing', etc.
  proyecto_id INTEGER, -- referencia flexible
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías de billetera virtual
CREATE TABLE IF NOT EXISTS categorias_billetera (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  porcentaje DECIMAL(5, 2) NOT NULL, -- porcentaje del total asignado a esta categoría
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_origen ON leads(origen);
CREATE INDEX IF NOT EXISTS idx_ideas_contenido_estado ON ideas_contenido(estado);
CREATE INDEX IF NOT EXISTS idx_videos_plataforma ON videos(plataforma);
CREATE INDEX IF NOT EXISTS idx_videos_tipo ON videos(tipo);
CREATE INDEX IF NOT EXISTS idx_videos_idea ON videos(idea_contenido_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_lead ON llamadas(lead_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_cliente ON llamadas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_numero_id ON clientes(numero_identificacion);
CREATE INDEX IF NOT EXISTS idx_recursos_cliente ON recursos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tareas_cliente ON tareas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_resultados_cliente ON resultados_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_datos_onboarding_cliente ON datos_onboarding(cliente_id);
CREATE INDEX IF NOT EXISTS idx_egresos_categoria ON egresos(categoria);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha);
