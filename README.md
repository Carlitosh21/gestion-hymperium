# Gestión Hymperium

Sistema de gestión integral para Hymperium con diseño minimalista estilo Apple.

## Stack Tecnológico

- **Next.js 14** (App Router) - Framework React con SSR
- **PostgreSQL** - Base de datos
- **Tailwind CSS** - Estilos con diseño custom estilo Apple
- **TypeScript** - Tipado estático

## Características

- **Ventas**: Prospección, gestión de contenido (ideas y videos), llamadas
- **Clientes**: Gestión completa de clientes con perfiles, tareas y seguimiento
- **Estadísticas**: Análisis y reportes por módulos
- **Proyecciones**: Creador de proyecciones basado en datos
- **Gestión Interna**: Finanzas, servicios y configuración

## Desarrollo Local

### Prerrequisitos

- Node.js 20 o superior
- PostgreSQL

### Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (crear `.env.local`):
```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=tu_password
PGDATABASE=hymperium

# URLs de n8n (opcional, para integraciones futuras)
N8N_IDEAS_URL=
N8N_VIDEOS_URL=
```

4. Ejecutar migración de base de datos:
   - Acceder a `/gestion-interna/config` en la aplicación
   - Hacer clic en "Migrar Estructura"

5. Iniciar servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Desplegar en Easy Panel

### Paso 1: Preparar el Repositorio

Asegúrate de que tu código esté en un repositorio Git (GitHub, GitLab, etc.).

### Paso 2: Crear Proyecto en Easy Panel

1. Inicia sesión en tu instancia de Easy Panel
2. Haz clic en "New" para crear un nuevo proyecto
3. Proporciona un nombre para el proyecto (ej: "gestion-hymperium")
4. Haz clic en "Create"

### Paso 3: Configurar el Servicio App

1. Dentro del proyecto, haz clic en "+ Service"
2. Selecciona "App" como tipo de servicio

### Paso 4: Configurar el Source (Git)

1. En la pestaña "Source", selecciona tu repositorio Git
2. Especifica la rama (generalmente `main` o `master`)

### Paso 5: Configurar el Build

1. Ve a la pestaña "Build"
2. Selecciona **Dockerfile** como método de build
3. El Dockerfile está en la raíz del proyecto

### Paso 6: Configurar Variables de Entorno

1. Ve a la pestaña "Environment"
2. Agrega las siguientes variables:

```
PGHOST=tu_host_postgres
PGPORT=5432
PGUSER=tu_usuario
PGPASSWORD=tu_password
PGDATABASE=hymperium
```

Si tienes configuradas las URLs de n8n:
```
N8N_IDEAS_URL=https://tu-n8n.com/webhook/ideas
N8N_VIDEOS_URL=https://tu-n8n.com/webhook/videos
```

### Paso 7: Configurar Dominio y Proxy

1. Ve a la pestaña "Domains & Proxy"
2. Agrega tu dominio (ej: `gestion.hymperium.com`)
3. **Importante**: Configura el **Proxy Port** a **3000**
4. Easy Panel configurará automáticamente HTTPS con Let's Encrypt

### Paso 8: Desplegar

1. Haz clic en "Deploy"
2. Espera a que el build y despliegue se complete
3. Una vez completado, tu aplicación estará disponible en el dominio configurado

### Paso 9: Ejecutar Migración Inicial

1. Accede a tu aplicación desplegada
2. Ve a `/gestion-interna/config`
3. Haz clic en "Migrar Estructura" para crear todas las tablas necesarias

## Notas Importantes

- **Conexión a PostgreSQL**: La aplicación está configurada con `pool: { min: 0 }` para evitar problemas de conexión cuando el contenedor está inactivo (según [documentación de Easy Panel](https://easypanel.io/docs/services/app))
- **Puerto**: La aplicación escucha en el puerto 3000 por defecto
- **Auto-deploy**: Puedes habilitar auto-deploy en la pestaña "Auto Deploy" para que se despliegue automáticamente cuando hagas push al repositorio

## Estructura del Proyecto

```
/app                    # Rutas y páginas (Next.js App Router)
  /api                  # API routes
  /ventas               # Módulo de ventas
  /clientes             # Módulo de clientes
  /estadisticas         # Módulo de estadísticas
  /proyecciones         # Creador de proyecciones
  /gestion-interna      # Gestión interna (finanzas, config)
/components             # Componentes React reutilizables
/lib                    # Utilidades y servicios (DB, n8n)
/migrations             # Scripts SQL de migración
/styles                 # Estilos globales
```

## Integraciones n8n

La aplicación está preparada para consumir datos de n8n mediante GET requests:

- **Ideas de contenido**: `getIdeasFromN8n()` - Consume desde `N8N_IDEAS_URL`
- **Videos**: `getVideosFromN8n()` - Consume desde `N8N_VIDEOS_URL`

Los flujos n8n deben configurarse para exponer endpoints que devuelvan JSON con los datos esperados.

## Licencia

Privado - Hymperium
