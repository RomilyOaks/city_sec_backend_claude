# Colección Postman - Operativos: Vehículos

## 📋 Descripción

Esta colección contiene todos los endpoints para probar el módulo completo de **Vehículos Operativos**, incluyendo:
- Gestión de vehículos operativos (general)
- Asignación de vehículos a turnos
- Asignación de cuadrantes a vehículos
- Consulta de novedades por cuadrante

## 🚀 Importar la Colección

1. Abre Postman
2. Click en **Import**
3. Selecciona el archivo: `Operativos_Vehiculos.postman_collection.json`
4. Click en **Import**

## ⚙️ Configuración de Variables

### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `RemoteBase_Url` | URL base del servidor | `http://localhost:3000` |
| `apiVersion` | Versión de la API | `v1` |
| `authToken` | Token JWT de autenticación | `ACCESS_TOKEN_EXAMPLE` |
| `turnoId` | ID del turno operativo (auto-guardado) | `1` |
| `vehiculoAsignadoId` | ID de vehículo asignado (auto-guardado) | `5` |
| `cuadranteAsignadoId` | ID de cuadrante asignado (auto-guardado) | `3` |

### 🔑 Obtener el Token

**Endpoint:** `POST {{RemoteBase_Url}}/api/{{apiVersion}}/auth/login`

```json
{
  "usuario": "tu_usuario",
  "password": "tu_password"
}
```

Copia el campo `token` de la respuesta y úsalo como `authToken`.

## 📁 Estructura de la Colección

### 1️⃣ Vehículos Operativos (General) - 7 endpoints

Endpoints para consultar vehículos sin necesidad de especificar un turno:

```
GET /operativos-vehiculos
├── Parámetros de paginación: page, limit
├── Filtros disponibles:
│   ├── search (texto libre)
│   ├── turno_id
│   ├── vehiculo_id
│   ├── conductor_id
│   ├── copiloto_id
│   ├── estado_operativo_id
│   ├── fecha_inicio
│   └── fecha_fin
└── Ordenamiento: sort, order
```

**Endpoints incluidos:**
1. `GET /operativos-vehiculos` - Listar todos
2. `GET /operativos-vehiculos?search=ABC` - Buscar por texto
3. `GET /operativos-vehiculos?turno_id=1` - Filtrar por turno
4. `GET /operativos-vehiculos?vehiculo_id=1` - Filtrar por vehículo
5. `GET /operativos-vehiculos?estado_operativo_id=1` - Filtrar por estado
6. `GET /operativos-vehiculos?fecha_inicio=...&fecha_fin=...` - Filtrar por fechas
7. `GET /operativos-vehiculos?...` - Filtros combinados

**Búsqueda de texto incluye:**
- Placa del vehículo
- Marca del vehículo
- Nombres del conductor
- Apellidos del conductor
- Nombres del copiloto
- Apellidos del copiloto

### 2️⃣ Vehículos por Turno - 4 endpoints

Gestión de vehículos dentro de un turno específico:

```
/operativos/:turnoId/vehiculos
├── GET    /                    → Listar vehículos del turno
├── POST   /                    → Asignar vehículo al turno
├── PUT    /:id                 → Actualizar vehículo
└── DELETE /:id                 → Eliminar vehículo del turno
```

**Flujo típico:**
1. **Crear turno** (usar colección de Operativos-Turno)
2. **Asignar vehículo** → Guarda `vehiculoAsignadoId`
3. **Listar vehículos del turno**
4. **Actualizar** cuando termina el turno (kilometraje_fin, hora_fin)
5. **Eliminar** si la asignación fue incorrecta

### 3️⃣ Cuadrantes de Vehículos - 4 endpoints

Gestión de cuadrantes (zonas) asignados a vehículos:

```
/operativos/:turnoId/vehiculos/:id/cuadrantes
├── GET    /                    → Listar cuadrantes del vehículo
├── POST   /                    → Asignar cuadrante
├── PUT    /:cuadranteId        → Actualizar (registrar salida)
└── DELETE /:cuadranteId        → Eliminar cuadrante
```

**Flujo típico:**
1. Vehículo ingresa a cuadrante → **POST** con hora_ingreso
2. Consultar recorrido → **GET**
3. Vehículo sale del cuadrante → **PUT** con hora_salida
4. Corregir error → **DELETE**

### 4️⃣ Novedades de Cuadrantes - 1 endpoint

Consulta de novedades (incidentes) registrados:

```
GET /operativos/:turnoId/vehiculos/:id/cuadrantes/:cuadranteId/novedades
```

Muestra todas las novedades que el vehículo registró mientras patrullaba ese cuadrante.

## 🧪 Flujo de Prueba Completo

### Paso 1: Preparación

```bash
# 1. Obtener token de autenticación
POST /auth/login

# 2. Crear un turno operativo (o usar uno existente)
POST /operativos
→ Guardar turnoId
```

### Paso 2: Asignar Vehículo al Turno

```json
POST /operativos/{{turnoId}}/vehiculos
{
  "vehiculo_id": 1,
  "conductor_id": 1,
  "copiloto_id": 2,
  "kilometraje_inicio": 5000,
  "hora_inicio": "2026-01-11T08:00:00",
  "estado_operativo_id": 1
}
```

✅ **Auto-guarda**: `vehiculoAsignadoId`

### Paso 3: Asignar Cuadrante

```json
POST /operativos/{{turnoId}}/vehiculos/{{vehiculoAsignadoId}}/cuadrantes
{
  "cuadrante_id": 1,
  "hora_ingreso": "2026-01-11T08:30:00"
}
```

✅ **Auto-guarda**: `cuadranteAsignadoId`

### Paso 4: Registrar Salida del Cuadrante

```json
PUT /operativos/{{turnoId}}/vehiculos/{{vehiculoAsignadoId}}/cuadrantes/{{cuadranteAsignadoId}}
{
  "hora_salida": "2026-01-11T10:30:00"
}
```

### Paso 5: Consultar Novedades

```
GET /operativos/{{turnoId}}/vehiculos/{{vehiculoAsignadoId}}/cuadrantes/{{cuadranteAsignadoId}}/novedades
```

### Paso 6: Finalizar Turno del Vehículo

```json
PUT /operativos/{{turnoId}}/vehiculos/{{vehiculoAsignadoId}}
{
  "kilometraje_fin": 5150,
  "hora_fin": "2026-01-11T16:00:00",
  "estado_operativo_id": 2
}
```

### Paso 7: Consultar Historial General

```
GET /operativos-vehiculos?vehiculo_id=1&fecha_inicio=2026-01-01&fecha_fin=2026-01-31
```

## 🔍 Tests Automatizados

### Tests Globales (Todos los Requests)

```javascript
✅ Response time is less than 5000ms
✅ Error responses have error/errors property
```

### Tests Específicos por Endpoint

#### GET /operativos-vehiculos
```javascript
✅ Status code is 200
✅ Response has pagination
✅ Data is an array
✅ Vehicles have required fields (id, vehiculo, conductor, copiloto, estado_operativo)
```

#### GET /operativos-vehiculos?search=...
```javascript
✅ Status code is 200
✅ Search results contain search term in relevant fields
```

#### POST (Crear/Asignar)
```javascript
✅ Status code is 201
✅ Response has data with id
✅ ID saved to environment variable
```

#### PUT (Actualizar)
```javascript
✅ Status code is 200
✅ Success message includes "actualizado"
```

#### DELETE (Eliminar)
```javascript
✅ Status code is 200
✅ Success message includes "eliminado"
```

## 📊 Ejemplos de Respuestas

### GET /operativos-vehiculos (Exitosa)

```json
{
  "data": [
    {
      "id": 1,
      "operativo_turno_id": 5,
      "vehiculo_id": 1,
      "conductor_id": 3,
      "copiloto_id": 7,
      "kilometraje_inicio": 5000,
      "kilometraje_fin": 5150,
      "hora_inicio": "2026-01-11T08:00:00.000Z",
      "hora_fin": "2026-01-11T16:00:00.000Z",
      "estado_operativo_id": 1,
      "estado_registro": 1,
      "vehiculo": {
        "id": 1,
        "placa": "ABC-123",
        "marca": "Toyota",
        "modelo": "Hilux"
      },
      "conductor": {
        "id": 3,
        "nombres": "Juan",
        "apellido_paterno": "Pérez",
        "apellido_materno": "García"
      },
      "copiloto": {
        "id": 7,
        "nombres": "María",
        "apellido_paterno": "López",
        "apellido_materno": "Ruiz"
      },
      "estado_operativo": {
        "id": 1,
        "codigo": "DISP",
        "descripcion": "DISPONIBLE"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### POST /operativos/:turnoId/vehiculos (Exitosa)

```json
{
  "message": "Vehículo asignado al turno correctamente",
  "data": {
    "id": 12,
    "operativo_turno_id": 5,
    "vehiculo_id": 1,
    "conductor_id": 3,
    "copiloto_id": 7,
    "kilometraje_inicio": 5000,
    "hora_inicio": "2026-01-11T08:00:00.000Z",
    "estado_operativo_id": 1,
    "estado_registro": 1,
    "created_at": "2026-01-11T12:00:00.000Z"
  }
}
```

### POST /cuadrantes (Exitosa)

```json
{
  "message": "Cuadrante asignado correctamente",
  "data": {
    "id": 8,
    "operativo_vehiculo_id": 12,
    "cuadrante_id": 1,
    "hora_ingreso": "2026-01-11T08:30:00.000Z",
    "hora_salida": null,
    "created_at": "2026-01-11T12:05:00.000Z"
  }
}
```

### GET /novedades (Exitosa)

```json
{
  "data": [
    {
      "id": 25,
      "tipo_novedad": {
        "id": 1,
        "codigo": "INC",
        "descripcion": "Incidente"
      },
      "subtipo_novedad": {
        "id": 3,
        "codigo": "ROBO",
        "descripcion": "Robo"
      },
      "descripcion": "Intervención por robo en domicilio",
      "fecha_hora": "2026-01-11T09:15:00.000Z",
      "estado_novedad": {
        "id": 2,
        "codigo": "PROC",
        "descripcion": "En Proceso"
      }
    }
  ]
}
```

### Respuestas de Error

#### 400 - Validación

```json
{
  "errors": [
    {
      "msg": "ID de vehículo inválido",
      "param": "vehiculo_id",
      "location": "body"
    }
  ]
}
```

#### 401 - No autenticado

```json
{
  "error": "No se proporcionó un token de autenticación"
}
```

#### 403 - Sin permisos

```json
{
  "error": "No tienes permiso para realizar esta acción"
}
```

#### 404 - No encontrado

```json
{
  "error": "Vehículo operativo no encontrado"
}
```

## 🔐 Permisos RBAC Requeridos

Tu usuario debe tener estos permisos:

```
operativos.vehiculos.read      → GET (todos los endpoints de consulta)
operativos.vehiculos.create    → POST (asignar vehículos y cuadrantes)
operativos.vehiculos.update    → PUT (actualizar asignaciones)
operativos.vehiculos.delete    → DELETE (eliminar asignaciones)
```

## 📋 Validaciones de Campos

### POST /vehiculos - Campos Requeridos

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `vehiculo_id` | Integer | min: 1 | ID del vehículo |
| `kilometraje_inicio` | Integer | min: 0 | Kilometraje al inicio |
| `hora_inicio` | DateTime | ISO 8601 | Hora de inicio del turno |
| `estado_operativo_id` | Integer | min: 1 | Estado inicial del vehículo |

### POST /vehiculos - Campos Opcionales

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `conductor_id` | Integer | min: 1, nullable | ID del conductor |
| `copiloto_id` | Integer | min: 1, nullable | ID del copiloto |

### PUT /vehiculos - Campos Opcionales

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `kilometraje_fin` | Integer | min: 0, nullable | Kilometraje al finalizar |
| `hora_fin` | DateTime | ISO 8601, nullable | Hora de finalización |
| `estado_operativo_id` | Integer | min: 1 | Cambio de estado |

### POST /cuadrantes - Campos Requeridos

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `cuadrante_id` | Integer | min: 1 | ID del cuadrante |
| `hora_ingreso` | DateTime | ISO 8601 | Hora de ingreso al cuadrante |

### PUT /cuadrantes - Campos Requeridos

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `hora_salida` | DateTime | ISO 8601 | Hora de salida del cuadrante |

## 🛠️ Troubleshooting

### Error: "Vehículo no encontrado"
✅ Verifica que el `vehiculo_id` existe en la base de datos
✅ Verifica que el vehículo esté activo (estado_registro = 1)

### Error: "Turno operativo no encontrado"
✅ Verifica que el `turnoId` existe
✅ Usa la colección de Operativos-Turno para crear un turno primero

### Error: "Cuadrante no encontrado"
✅ Verifica que el `cuadrante_id` existe
✅ Usa la colección de Cuadrantes para crear cuadrantes

### Error: "hora_inicio debe ser formato ISO 8601"
✅ Formato correcto: `2026-01-11T08:00:00`
✅ También acepta: `2026-01-11T08:00:00.000Z`
❌ Incorrecto: `2026-01-11 08:00:00` o `11/01/2026`

### Búsqueda no retorna resultados
✅ El parámetro `search` busca coincidencias parciales (LIKE %term%)
✅ Verifica que existan vehículos con placas/conductores que coincidan
✅ Prueba con términos más cortos (ej: "ABC" en vez de "ABC-123-XYZ")

### Paginación no funciona correctamente
✅ `page` debe ser >= 1
✅ `limit` determina registros por página (default: 20)
✅ Verifica el campo `pagination.totalPages` en la respuesta

## 🔗 Endpoints Completos

### Vehículos Operativos General
```
GET {{RemoteBase_Url}}/api/{{apiVersion}}/operativos-vehiculos
```

### Vehículos por Turno
```
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos
POST   {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos
PUT    {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos/:id
DELETE {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos/:id
```

### Cuadrantes
```
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos/:id/cuadrantes
POST   {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos/:id/cuadrantes
PUT    {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos/:id/cuadrantes/:cuadranteId
DELETE {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos/:id/cuadrantes/:cuadranteId
```

### Novedades
```
GET {{RemoteBase_Url}}/api/{{apiVersion}}/operativos/:turnoId/vehiculos/:id/cuadrantes/:cuadranteId/novedades
```

## 📚 Documentación Relacionada

- **Operativos-Turno**: Para gestionar turnos operativos
- **Cuadrantes**: Para gestionar zonas de patrullaje
- **Novedades**: Para crear y gestionar incidentes
- **Catálogos**: Para estados operativos y tipos de copiloto

## 💡 Casos de Uso Comunes

### 1. Dashboard de Vehículos Activos
```
GET /operativos-vehiculos?estado_operativo_id=1&fecha_inicio=2026-01-11
```

### 2. Historial de un Vehículo
```
GET /operativos-vehiculos?vehiculo_id=1&sort=hora_inicio&order=DESC
```

### 3. Vehículos sin Copiloto
```
GET /operativos-vehiculos (filtrar en frontend donde copiloto_id es null)
```

### 4. Recorrido de un Vehículo en Turno
```
GET /operativos/:turnoId/vehiculos/:id/cuadrantes
```

### 5. Incidentes Reportados por un Vehículo en Zona
```
GET /operativos/:turnoId/vehiculos/:id/cuadrantes/:cuadranteId/novedades
```

### 6. Búsqueda Rápida por Placa
```
GET /operativos-vehiculos?search=ABC-123
```

## 📞 Soporte

Si encuentras problemas con estos endpoints, contacta al equipo de backend o abre un issue en el repositorio del proyecto.

---

**Última actualización:** 2026-01-11
**Versión de la API:** v1
**Endpoints totales:** 16
