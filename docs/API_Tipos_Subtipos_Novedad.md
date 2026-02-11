# API - Tipos y Subtipos de Novedad

Documentación para consumo externo de los endpoints de catálogos de Tipos y Subtipos de Novedad.

## URL Base

```
https://{HOST}/api/v1
```

## Autenticación

Todas las rutas requieren token JWT:

```
Authorization: Bearer {token}
```

Permiso requerido: `catalogos.tipos_novedad.read` (lectura), `catalogos.tipos_novedad.create/update/delete` (escritura).

---

## 1. Tipos de Novedad

Categorías principales de novedades/incidentes (ej: "ACCIDENTE DE TRÁNSITO", "ALARMA ACTIVADA", "ROBO").

### 1.1 Listar Tipos de Novedad

```http
GET /tipos-novedad
```

**Query Params (opcionales):**

| Param    | Tipo    | Descripción                          |
|----------|---------|--------------------------------------|
| `estado` | boolean | `true` = activos, `false` = inactivos |
| `search` | string  | Busca por `nombre` o `tipo_code`     |

**Response 200:**

```json
{
  "success": true,
  "message": "Tipos de novedad obtenidos exitosamente",
  "data": [
    {
      "id": 7,
      "tipo_code": "T007",
      "nombre": "ALARMA ACTIVADA",
      "descripcion": "Alarmas de seguridad activadas",
      "icono": "bell-alert",
      "color_hex": "#EF4444",
      "orden": 1,
      "requiere_unidad": true,
      "estado": true,
      "created_at": "2026-01-15 10:00:00",
      "updated_at": "2026-01-15 10:00:00"
    }
  ]
}
```

### 1.2 Obtener Tipo por ID

```http
GET /tipos-novedad/:id
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 7,
    "tipo_code": "T007",
    "nombre": "ALARMA ACTIVADA",
    "descripcion": "Alarmas de seguridad activadas",
    "icono": "bell-alert",
    "color_hex": "#EF4444",
    "orden": 1,
    "requiere_unidad": true,
    "estado": true
  }
}
```

### 1.3 Crear Tipo de Novedad

```http
POST /tipos-novedad
```

**Body:**

```json
{
  "nombre": "VIOLENCIA FAMILIAR",
  "tipo_code": "T015",
  "descripcion": "Casos de violencia doméstica",
  "icono": "shield-exclamation",
  "color_hex": "#DC2626",
  "orden": 15,
  "requiere_unidad": true
}
```

| Campo             | Tipo    | Requerido | Descripción                         |
|-------------------|---------|-----------|-------------------------------------|
| `nombre`          | string  | Sí        | Nombre del tipo (max 100)           |
| `tipo_code`       | string  | No        | Código único (max 10). Auto-genera si no se envía (T001, T002...) |
| `descripcion`     | string  | No        | Descripción detallada               |
| `icono`           | string  | No        | Nombre del ícono UI (max 50)        |
| `color_hex`       | string  | No        | Color hexadecimal (default: #6B7280)|
| `orden`           | integer | No        | Orden de visualización (default: 0) |
| `requiere_unidad` | boolean | No        | Si requiere unidad asignada (default: true) |

**Response 201:**

```json
{
  "success": true,
  "message": "Tipo de novedad creado exitosamente",
  "data": { ... }
}
```

### 1.4 Actualizar Tipo de Novedad

```http
PUT /tipos-novedad/:id
```

**Body:** Mismos campos que crear (todos opcionales, enviar solo los que cambian).

**Response 200:**

```json
{
  "success": true,
  "message": "Tipo de novedad actualizado exitosamente",
  "data": { ... }
}
```

### 1.5 Eliminar Tipo de Novedad (Soft Delete)

```http
DELETE /tipos-novedad/:id
```

> No se puede eliminar si tiene subtipos asociados activos.

**Response 200:**

```json
{
  "success": true,
  "message": "Tipo de novedad eliminado exitosamente"
}
```

**Response 400 (tiene subtipos):**

```json
{
  "success": false,
  "message": "No se puede eliminar: tiene subtipos asociados"
}
```

### 1.6 Reactivar Tipo Eliminado

```http
PATCH /tipos-novedad/:id/reactivar
```

### 1.7 Listar Tipos Eliminados

```http
GET /tipos-novedad/eliminadas
```

---

## 2. Subtipos de Novedad

Subcategorías vinculadas a un Tipo de Novedad (ej: bajo "ALARMA ACTIVADA" → "DE DOMICILIO", "DE VEHÍCULO", "COMERCIAL").

### 2.1 Listar Subtipos de Novedad

```http
GET /subtipos-novedad
```

**Query Params (opcionales):**

| Param             | Tipo    | Descripción                                    |
|-------------------|---------|------------------------------------------------|
| `tipo_novedad_id` | integer | Filtrar por tipo padre                         |
| `estado`          | boolean | `true` = activos, `false` = inactivos          |
| `search`          | string  | Busca por `nombre` o `subtipo_code`            |

**Response 200:**

```json
{
  "success": true,
  "message": "Subtipos de novedad obtenidos exitosamente",
  "data": [
    {
      "id": 28,
      "tipo_novedad_id": 7,
      "subtipo_code": "ST028",
      "nombre": "DE DOMICILIO",
      "descripcion": "Alarma activada en domicilio particular",
      "prioridad": "ALTA",
      "tiempo_respuesta_min": 10,
      "requiere_ambulancia": false,
      "requiere_bomberos": false,
      "requiere_pnp": false,
      "orden": 1,
      "estado": true,
      "subtipoNovedadTipoNovedad": {
        "id": 7,
        "nombre": "ALARMA ACTIVADA",
        "tipo_code": "T007"
      }
    }
  ]
}
```

### 2.2 Obtener Subtipo por ID

```http
GET /subtipos-novedad/:id
```

### 2.3 Crear Subtipo de Novedad

```http
POST /subtipos-novedad
```

**Body:**

```json
{
  "nombre": "DE DOMICILIO",
  "tipo_novedad_id": 7,
  "subtipo_code": "ST028",
  "descripcion": "Alarma activada en domicilio particular",
  "prioridad": "ALTA",
  "tiempo_respuesta_min": 10,
  "requiere_ambulancia": false,
  "requiere_bomberos": false,
  "requiere_pnp": false,
  "orden": 1
}
```

| Campo                  | Tipo    | Requerido | Descripción                          |
|------------------------|---------|-----------|--------------------------------------|
| `nombre`               | string  | Sí        | Nombre del subtipo (max 150)         |
| `tipo_novedad_id`      | integer | Sí        | ID del tipo padre (debe existir y estar activo) |
| `subtipo_code`         | string  | No        | Código único (max 10). Auto-genera si no se envía (ST001, ST002...) |
| `descripcion`          | string  | No        | Descripción detallada                |
| `prioridad`            | enum    | No        | `ALTA`, `MEDIA`, `BAJA` (default: MEDIA) |
| `tiempo_respuesta_min` | integer | No        | Tiempo esperado de respuesta (minutos) |
| `requiere_ambulancia`  | boolean | No        | Default: false                       |
| `requiere_bomberos`    | boolean | No        | Default: false                       |
| `requiere_pnp`         | boolean | No        | Default: false                       |
| `orden`                | integer | No        | Orden de visualización (default: 0)  |

**Response 201:**

```json
{
  "success": true,
  "message": "Subtipo de novedad creado exitosamente",
  "data": { ... }
}
```

### 2.4 Actualizar Subtipo

```http
PUT /subtipos-novedad/:id
```

**Body:** Mismos campos que crear (todos opcionales).

### 2.5 Eliminar Subtipo (Soft Delete)

```http
DELETE /subtipos-novedad/:id
```

> No se puede eliminar si tiene novedades asociadas.

### 2.6 Reactivar Subtipo Eliminado

```http
PATCH /subtipos-novedad/:id/reactivar
```

### 2.7 Listar Subtipos Eliminados

```http
GET /subtipos-novedad/eliminados?tipo_novedad_id=7
```

---

## 3. Flujo típico de consumo

### Paso 1: Obtener todos los tipos activos

```http
GET /tipos-novedad?estado=true
```

### Paso 2: Obtener subtipos de un tipo específico

```http
GET /subtipos-novedad?tipo_novedad_id=7&estado=true
```

### Paso 3: Crear novedad usando tipo + subtipo

```http
POST /novedades
{
  "tipo_novedad_id": 7,
  "subtipo_novedad_id": 28,
  "fecha_hora_ocurrencia": "2026-02-08 22:28:00",
  ...
}
```

---

## 4. Valores de referencia

### Prioridades (SubtipoNovedad.prioridad)

| Valor  | Descripción              |
|--------|--------------------------|
| `ALTA` | Requiere respuesta inmediata |
| `MEDIA`| Respuesta en tiempo estándar |
| `BAJA` | Sin urgencia             |

### Campos de requerimiento (SubtipoNovedad)

| Campo                 | Uso                                      |
|-----------------------|------------------------------------------|
| `requiere_ambulancia` | Indica si el subtipo necesita ambulancia  |
| `requiere_bomberos`   | Indica si el subtipo necesita bomberos    |
| `requiere_pnp`        | Indica si el subtipo necesita PNP         |
| `tiempo_respuesta_min`| Tiempo máximo esperado de respuesta (min) |

---

## 5. Errores comunes

| Status | Mensaje | Causa |
|--------|---------|-------|
| 400 | "No se puede eliminar: tiene subtipos asociados" | DELETE tipo que tiene subtipos activos |
| 400 | "No se puede eliminar: tiene novedades asociadas" | DELETE subtipo con novedades |
| 400 | "El código ya existe" | POST/PUT con tipo_code o subtipo_code duplicado |
| 404 | "Tipo de novedad no encontrado" | ID inválido o eliminado |
| 404 | "Subtipo de novedad no encontrado" | ID inválido o eliminado |
| 400 | "El tipo de novedad padre no existe o no está activo" | POST subtipo con tipo_novedad_id inválido |
