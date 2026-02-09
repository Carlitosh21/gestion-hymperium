# Configuración de n8n para Importación de Ideas

## Objetivo
Evitar que el usuario espere 15 minutos en la página cuando hace click en "Crear más Ideas". En su lugar, n8n procesará las ideas en segundo plano y las enviará automáticamente a la aplicación.

## Endpoint de Importación

**URL**: `POST https://tu-dominio.com/api/ventas/ideas/import`

**Headers**:
```
x-api-key: <N8N_API_KEY>
Content-Type: application/json
```

**Body**: JSON con el formato que ya estás usando:
```json
[
  {
    "Ideas": [
      {
        "id_long_form": "1a0f9jeyyaYQ8jshvQzKOWMoyLFiwJypjaG9iTHisoBU",
        "idea": "{\"idea_titulo\":\"...\",\"descripcion_detallada\":\"...\"}",
        "id_reels": "1YZfLJGUcquUj5yB3YNEMLlWIV4NsgykRuAI3mKmVijw"
      }
    ]
  }
]
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "inserted": 5,
  "updated": 2,
  "total": 7,
  "procesadas": 7
}
```

## Configuración del Workflow en n8n

### Paso 1: Configurar el Trigger
- Usa el mismo trigger que ya tienes (Webhook, Manual, etc.)

### Paso 2: Procesar las Ideas
- Mantén toda la lógica actual de generación de ideas

### Paso 3: Agregar HTTP Request al Final
Después de generar las ideas, agrega un nodo **HTTP Request**:

1. **Method**: `POST`
2. **URL**: `https://tu-dominio.com/api/ventas/ideas/import`
3. **Authentication**: None (la API key va en headers)
4. **Headers**:
   - `x-api-key`: `<valor de N8N_API_KEY>`
   - `Content-Type`: `application/json`
5. **Body**: El JSON con las ideas generadas (el mismo formato que ya usas)

### Paso 4: Configurar Respuesta Rápida
- Si el trigger es un Webhook, configura el nodo de respuesta para que responda **inmediatamente** al recibir la petición
- Esto evita que el usuario espere mientras n8n procesa
- n8n puede responder con un mensaje simple como: `{ "status": "processing", "message": "Las ideas se están generando y se importarán automáticamente" }`

## Variable de Entorno Requerida

En tu aplicación (EasyPanel o donde esté deployada), asegúrate de tener configurada:

```
N8N_API_KEY=<una-clave-secreta-fuerte>
```

Esta misma clave debe usarse en el header `x-api-key` del HTTP Request en n8n.

## Flujo Completo

```
Usuario hace click → n8n recibe trigger → n8n responde inmediatamente → 
n8n procesa ideas en background → n8n POST a /api/ventas/ideas/import → 
Ideas aparecen en la app automáticamente
```

## Ventajas

1. **No hay espera**: El usuario recibe respuesta inmediata
2. **Procesamiento asíncrono**: n8n puede tardar lo que necesite sin bloquear
3. **Actualización automática**: Las ideas aparecen automáticamente en la app cuando n8n termine
4. **Mejor UX**: El usuario puede seguir trabajando mientras se generan las ideas
