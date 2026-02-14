-- Migración 016: RBAC (roles y permisos)
-- Sistema de roles y permisos configurable para usuarios internos

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relación roles-permisos
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Agregar role_id a usuarios_internos
ALTER TABLE usuarios_internos ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE usuarios_internos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Índice para role_id
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_role ON usuarios_internos(role_id);

-- Seed: roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador con acceso total'),
  ('staff', 'Personal con acceso limitado por permisos')
ON CONFLICT (name) DO NOTHING;

-- Seed: permisos por módulo
INSERT INTO permissions (key, description) VALUES
  ('ventas.read', 'Ver ventas (leads, ideas, videos, llamadas)'),
  ('ventas.write', 'Crear/editar ventas'),
  ('clientes.read', 'Ver clientes'),
  ('clientes.write', 'Crear/editar clientes'),
  ('estadisticas.view', 'Ver estadísticas (ventas, finanzas)'),
  ('finanzas.read', 'Ver finanzas (ingresos, egresos, billetera)'),
  ('finanzas.write', 'Crear/editar ingresos, egresos, categorías'),
  ('proyecciones.view', 'Ver proyecciones'),
  ('proyecciones.write', 'Crear/editar proyecciones'),
  ('oferta_servicios.read', 'Ver oferta y servicios'),
  ('oferta_servicios.write', 'Crear/editar oferta y servicios'),
  ('config.manage', 'Configuración del sistema (branding, migraciones)'),
  ('users.manage', 'Gestión de usuarios internos y roles')
ON CONFLICT (key) DO NOTHING;

-- Asignar todos los permisos al rol admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Asignar permisos base al rol staff (lectura en ventas, clientes, estadísticas, finanzas)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'staff' AND p.key IN (
  'ventas.read', 'ventas.write', 'clientes.read', 'clientes.write',
  'estadisticas.view', 'finanzas.read', 'proyecciones.view', 'oferta_servicios.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Backfill: asignar role_id a usuarios existentes según su columna role
UPDATE usuarios_internos u
SET role_id = (SELECT id FROM roles WHERE name = u.role LIMIT 1)
WHERE role_id IS NULL AND u.role IN ('admin', 'staff');

-- Si algún usuario tiene role distinto a admin/staff, asignar admin por defecto
UPDATE usuarios_internos
SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
WHERE role_id IS NULL;
