# TRACKING_SETUP.md — Sistema de Tracking GPS de Vehículos de Patrullaje

**Versión:** 1.0.0  
**Fecha:** 2026-05-27  
**Módulo:** `tracking`  
**App origen:** CitySecure Tracking Patrol Units (app móvil de serenos)

---

## 1. Descripción General

El sistema de tracking GPS permite rastrear en tiempo real la posición de los vehículos de patrullaje del serenazgo. Cada sereno/chofer, desde la app móvil "CitySecure Tracking Patrol Units", envía su posición GPS periódicamente al backend, que la persiste y la difunde al dashboard de operaciones.

### Flujo de datos

```
App Patrol (sereno)
  │  POST /api/v1/tracking/ubicacion  cada 10s en movimiento / 30s detenido
  ▼
trackingController.updateUbicacion()
  │  1. Rate limit check (1 req / 3 s por vehiculo_id)
  │  2. UPSERT en tracking_vehiculos   ← snapshot de última posición
  │  3. INSERT en tracking_historial   ← registro histórico
  │  4. broadcastEvent('vehiculo:posicion', {...})
  ▼
SSE Manager → GET /api/v1/novedades/stream
  ▼
Dashboard frontend (React)
  EventSource.addEventListener('vehiculo:posicion', handler)
  → Actualiza marcador en el mapa en tiempo real
```

---

## 2. Tablas de Base de Datos

### 2.1 Ejecutar la migración SQL

El archivo de migración está en `migrations/003_tracking_tables_mysql.sql`.

**Opción A — Railway Query Editor** (recomendado):
1. Ir al dashboard de Railway → servicio MySQL → pestaña **Query**
2. Copiar y ejecutar el contenido de `migrations/003_tracking_tables_mysql.sql`

**Opción B — Cliente MySQL local** (requiere TCP Proxy habilitado en Railway):
```bash
mysql -h <PROXY_HOST> -P <PROXY_PORT> -u root -p railway < migrations/003_tracking_tables_mysql.sql
```

### 2.2 Tablas creadas

#### `tracking_vehiculos` — Snapshot de última posición

Una sola fila por vehículo (`UNIQUE vehiculo_id`). Siempre UPSERT, nunca INSERT múltiple.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AUTO | Identificador único |
| `vehiculo_id` | INT UNIQUE FK | → `vehiculos.id` |
| `personal_id` | INT FK NULL | → `personal_seguridad.id` (conductor activo) |
| `operativo_id` | BIGINT UNSIGNED FK NULL | → `operativos_turno.id` (turno activo) |
| `lat` | DECIMAL(10,8) | Latitud GPS |
| `lng` | DECIMAL(11,8) | Longitud GPS |
| `velocidad` | DECIMAL(5,2) NULL | km/h |
| `precision_gps` | DECIMAL(6,2) NULL | Precisión en metros |
| `bateria_dispositivo` | TINYINT NULL | Batería del móvil (0–100) |
| `activo` | BOOLEAN | true = en servicio activo |
| `updated_at` | TIMESTAMP | Última actualización (ON UPDATE) |
| `created_at` | TIMESTAMP | Primera posición recibida |

**Índices:**
- `uq_tracking_vehiculo_id` (UNIQUE vehiculo_id)
- `idx_tracking_operativo` (operativo_id)
- `idx_tracking_activo` (activo)
- `idx_tracking_updated_at` (updated_at) — para el filtro "últimos 10 min"

#### `tracking_historial` — Historial completo de posiciones

Tabla de alto volumen. Solo INSERT, nunca UPDATE.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK AUTO | PK BIGINT — alto volumen |
| `vehiculo_id` | INT FK | → `vehiculos.id` |
| `lat` | DECIMAL(10,8) | Latitud GPS en este punto |
| `lng` | DECIMAL(11,8) | Longitud GPS en este punto |
| `velocidad` | DECIMAL(5,2) NULL | km/h en este punto |
| `registrado_at` | DATETIME | Timestamp del **DISPOSITIVO** |
| `created_at` | DATETIME | Timestamp del **SERVIDOR** |

> ⚠️ `registrado_at` vs `created_at`: el dispositivo puede llegar con retraso de red.
> Usar `registrado_at` para reconstruir la ruta cronológica.

**Índices:**
- `idx_historial_vehiculo_tiempo` (vehiculo_id, registrado_at) — consulta principal de ruta
- `idx_historial_registrado_at` (registrado_at) — purga eficiente

### 2.3 Política de retención

El historial se purga a los **30 días**. Volumen estimado:
- ~5.760 registros/día por vehículo
- Con 10 unidades: ~57.600 reg/día → ~1.7M en 30 días

**Purga manual** (script incluido en la migración):
```sql
-- Ejecutar en lotes para evitar bloqueos en producción
DELETE FROM tracking_historial
WHERE registrado_at < NOW() - INTERVAL 30 DAY
LIMIT 10000;
```

**Automatización opcional** con MySQL Event Scheduler (también en la migración):
```sql
CREATE EVENT evt_purga_tracking_historial
  ON SCHEDULE EVERY 1 DAY STARTS CURRENT_TIMESTAMP
  DO DELETE FROM tracking_historial
     WHERE registrado_at < NOW() - INTERVAL 30 DAY LIMIT 50000;
```

---

## 3. Permisos RBAC

### 3.1 Permisos del módulo tracking

| Permiso | Slug | Descripción |
|---|---|---|
| `tracking.vehiculos.update` | `tracking.vehiculos.update` | Enviar posición GPS (app móvil serenos) |
| `tracking.vehiculos.read` | `tracking.vehiculos.read` | Ver posiciones en el dashboard |

### 3.2 Asignación por rol

| Rol | `update` (enviar GPS) | `read` (ver flota) |
|---|---|---|
| `super_admin` | ✅ | ✅ |
| `admin` | ✅ | ✅ |
| `supervisor` | ✅ | ✅ |
| `operador` | ✅ | ✅ |
| `consulta` | — | ✅ |
| `sereno` *(si existe)* | ✅ | ✅ |
| `usuario_basico` | — | — |

### 3.3 Aplicar permisos con el seeder

```bash
# Local (requiere MySQL corriendo en localhost:3306)
npm run db:seed:rbac

# Railway (producción)
npm run railway:seed:rbac
```

Los permisos se crean con `findOrCreate` — es seguro re-ejecutar el seeder.

---

## 4. Endpoints de la API

Base URL: `POST /api/v1` · Todos requieren `Authorization: Bearer <JWT>`

### 4.1 `POST /tracking/ubicacion`

Recibe la posición GPS del vehículo desde la app móvil.

**Permiso requerido:** `tracking.vehiculos.update`  
**Rate limit:** 1 request cada 3 segundos por `vehiculo_id`

**Request body:**
```json
{
  "vehiculo_id": 1,
  "lat": -12.1167,
  "lng": -76.9836,
  "velocidad": 35.5,
  "precision_gps": 4.2,
  "bateria_dispositivo": 82
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Posición actualizada correctamente",
  "data": {
    "vehiculo_id": 1,
    "placa": "ABC-123",
    "lat": -12.1167,
    "lng": -76.9836,
    "updated_at": "2026-05-27T10:30:00.000Z"
  }
}
```

**Response 429 (rate limit):**
```json
{
  "success": false,
  "message": "Demasiadas solicitudes para el vehículo 1. Espere 2 segundo(s).",
  "data": { "retryAfter": 2 }
}
```

---

### 4.2 `GET /tracking/activos`

Lista todos los vehículos con posición actualizada en los últimos 10 minutos.

**Permiso requerido:** `tracking.vehiculos.read`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "vehiculos": [
      {
        "vehiculo_id": 1,
        "placa": "ABC-123",
        "tipo": "Patrullero",
        "lat": -12.1167,
        "lng": -76.9836,
        "velocidad": 35.5,
        "precision_gps": 4.2,
        "bateria_dispositivo": 82,
        "personal": { "id": 5, "nombre": "Juan Pérez" },
        "operativo": { "id": 101, "turno": "MAÑANA", "fecha": "2026-05-27" },
        "ultima_actualizacion": "2026-05-27T10:30:00.000Z",
        "minutos_sin_actualizar": 2
      }
    ]
  }
}
```

---

### 4.3 `GET /tracking/vehiculo/:vehiculoId/ruta`

Historial de posiciones para reconstruir la ruta de un turno.

**Permiso requerido:** `tracking.vehiculos.read`  
**Query params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `fecha_inicio` | ISO 8601 | ✅ | Inicio del rango |
| `fecha_fin` | ISO 8601 | ✅ | Fin del rango |
| `limit` | integer 1–500 | — | Máx puntos a devolver (default 500) |

**Ejemplo:**
```
GET /tracking/vehiculo/1/ruta?fecha_inicio=2026-05-27T06:00:00Z&fecha_fin=2026-05-27T14:00:00Z&limit=500
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "vehiculo": { "id": 1, "placa": "ABC-123" },
    "fecha_inicio": "2026-05-27T06:00:00.000Z",
    "fecha_fin": "2026-05-27T14:00:00.000Z",
    "total_puntos": 287,
    "limit_aplicado": 500,
    "ruta": [
      {
        "id": 10042,
        "lat": -12.1167,
        "lng": -76.9836,
        "velocidad": 0,
        "registrado_at": "2026-05-27T06:00:10.000Z",
        "created_at": "2026-05-27T06:00:11.000Z"
      }
    ]
  }
}
```

---

### 4.4 `GET /tracking/novedad/:novedadId/vehiculos-cercanos`

Calcula los vehículos activos más próximos a una novedad usando Haversine en SQL.  
Solo considera vehículos con posición en los últimos 10 minutos. Devuelve máximo 5.

**Permiso requerido:** `tracking.vehiculos.read`

**Response 200:**
```json
{
  "success": true,
  "message": "3 vehículo(s) cercano(s) encontrado(s)",
  "data": {
    "novedad_id": 42,
    "coordenadas_novedad": { "lat": -12.118, "lng": -76.985 },
    "total": 3,
    "vehiculos_cercanos": [
      {
        "vehiculo_id": 2,
        "placa": "XYZ-789",
        "tipo": "Patrullero",
        "distancia_km": 1.24,
        "tiempo_estimado_minutos": 1.9,
        "lat": -12.109,
        "lng": -76.991,
        "velocidad": 0,
        "ultima_actualizacion": "2026-05-27T10:28:00.000Z",
        "personal": { "id": 7, "nombre": "Carlos Ríos" }
      }
    ]
  }
}
```

> ETA calculado con velocidad promedio de **40 km/h**.  
> `tiempo_estimado_minutos = (distancia_km / 40) * 60`

---

## 5. Evento SSE — `vehiculo:posicion`

El dashboard recibe actualizaciones en tiempo real a través del canal SSE unificado.

### 5.1 Conexión

```javascript
// El frontend se conecta UNA sola vez al inicio de la sesión
const token = localStorage.getItem('accessToken');
const eventSource = new EventSource(
  `/api/v1/novedades/stream?token=${token}`
);
```

### 5.2 Escuchar el evento

```javascript
eventSource.addEventListener('vehiculo:posicion', (event) => {
  const { vehiculo_id, placa, lat, lng, velocidad, timestamp } = JSON.parse(event.data);
  
  // Actualizar el marcador del vehículo en el mapa
  actualizarMarcadorFlota({ vehiculo_id, placa, lat, lng, velocidad, timestamp });
});
```

### 5.3 Shape del payload

```typescript
{
  vehiculo_id: number;    // ID del vehículo
  placa:       string;    // Ej: "ABC-123"
  lat:         number;    // Latitud decimal
  lng:         number;    // Longitud decimal
  velocidad:   number | null;  // km/h — null si no disponible
  timestamp:   string;    // ISO 8601 UTC — cuándo se procesó en el servidor
}
```

### 5.4 Otros eventos en el mismo canal

| Evento | Origen | Descripción |
|---|---|---|
| `connected` | Conexión inicial | Confirma que el SSE está activo |
| `nueva_novedad` | Módulo Novedades | Nuevo incidente registrado |
| `estado_novedad` | Módulo Novedades | Cambio de estado en una novedad |
| `vehiculo:posicion` | **Módulo Tracking** | Posición GPS actualizada |

---

## 6. Rate Limiting

El endpoint `POST /tracking/ubicacion` tiene un rate limiter in-memory adicional al rate limiter global de Express:

| Parámetro | Valor |
|---|---|
| Ventana | 3 segundos |
| Límite | 1 request por `vehiculo_id` |
| Implementación | `Map` en memoria (no Redis) |
| Auto-limpieza | Cada 60 segundos — elimina entradas expiradas |
| Respuesta al superar | HTTP 429 + `retryAfter` (segundos) |

> ⚠️ El rate limiter es **por proceso**. En deployments multi-instancia se recomienda migrar a Redis.

---

## 7. Archivos del Módulo

```
src/
├── models/
│   ├── TrackingVehiculo.js          # Snapshot última posición (UPSERT)
│   └── TrackingHistorial.js         # Historial de posiciones (INSERT-only)
├── controllers/
│   └── trackingController.js        # Lógica de los 4 endpoints
├── routes/
│   └── tracking.routes.js           # Definición de rutas + anotaciones Swagger
└── validators/
    └── tracking.validators.js       # Validaciones de entrada (express-validator)

migrations/
└── 003_tracking_tables_mysql.sql    # CREATE TABLE + índices + script de purga

supabase/migrations/
└── 003_tracking_tables.sql          # Equivalente PostgreSQL (referencia)

src/seeders/
└── seedRBAC.js                      # v2.4.0 — incluye permisos tracking.*
```

**Archivos modificados:**
- `src/models/index.js` — asociaciones TrackingVehiculo / TrackingHistorial
- `src/routes/index.routes.js` — registra `/tracking` en el router central
- `src/routes/novedades.routes.js` — documenta evento `vehiculo:posicion` en SSE
- `swagger.js` — agrega tracking.routes.js + 5 schemas
- `swagger_output.json` — regenerado (317 paths, tag "Tracking GPS")

---

## 8. Checklist de Instalación

- [x] **Fase 1** — Tablas SQL creadas en Railway (`tracking_vehiculos`, `tracking_historial`)
- [x] **Fase 2** — Controlador, validators y rutas implementados
- [x] **Fase 3** — Permisos RBAC creados y asignados en Railway
- [x] **Fase 4** — Evento SSE `vehiculo:posicion` documentado y operativo
- [x] **Fase 5** — Swagger regenerado con los 4 endpoints y 5 schemas
- [x] **Fase 6** — Documentación `TRACKING_SETUP.md` creada

**Pendiente (frontend):**
- [ ] Conectar `EventSource` al canal SSE y escuchar `vehiculo:posicion`
- [ ] Renderizar marcadores de flota en el mapa del dashboard
- [ ] Implementar vista de ruta de turno (`GET /tracking/vehiculo/:id/ruta`)
- [ ] Implementar panel de vehículos cercanos a novedades

---

## 9. Notas Técnicas

### FK `operativo_id` — BIGINT UNSIGNED

`operativos_turno.id` es `BIGINT UNSIGNED`. La columna `operativo_id` en `tracking_vehiculos` debe ser del mismo tipo o MySQL rechazará la FK con `Error Code: 3780`. Ver también `OperativosVehiculos.js` como referencia.

### UPSERT — `findOrCreate` + `update`

Se usa el patrón `findOrCreate` + `update` en lugar de `upsert()` de Sequelize porque en MySQL, `upsert()` no devuelve el registro actualizado de forma confiable en todas las versiones.

### Haversine — `LEAST(1.0, ACOS(...))`

El guard `LEAST(1.0, ...)` en la fórmula Haversine previene errores de dominio (`Domain error`) cuando la aritmética de punto flotante devuelve valores levemente mayores a 1.0 en `ACOS`.

### SSE — canal unificado

El evento `vehiculo:posicion` se emite por el mismo `sse-manager.broadcastEvent` que los eventos de novedades. **No** existe un endpoint SSE separado para tracking. El frontend filtra por nombre de evento usando `addEventListener('vehiculo:posicion', ...)`.
