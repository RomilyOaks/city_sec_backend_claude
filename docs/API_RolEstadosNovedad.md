# API: Rol Estados Novedad

**Módulo:** Control de accesos a estados de novedades por roles  
**Base URL:** `/api/v1/rol-estados-novedad`  
**Versión:** 1.0.0  
**Fecha:** 2026-03-06  

---

## Descripción

Permite configurar qué estados de novedad están disponibles para cada rol del sistema. Reemplaza el hardcodeo de estados en el frontend, centralizando la lógica de acceso en el backend.

La tabla `rol_estados_novedad` actúa como una matriz de permisos: cada fila define que un **rol** tiene acceso a un **estado de novedad** determinado.

---

## Archivos involucrados

| Tipo | Ruta |
|------|------|
| Modelo | `src/models/RolEstadoNovedad.js` |
| Controlador | `src/controllers/rolEstadosNovedadController.js` |
| Validador | `src/validators/rol-estado-novedad.validator.js` |
| Rutas | `src/routes/rol-estados-novedad.routes.js` |
| Asociaciones | `src/models/index.js` |

---

## Control de Acceso (RBAC)

| Operación | Roles permitidos |
|-----------|-----------------|
| CRUD completo | `super_admin`, `admin` |
| Consultar estados por rol | Todos los roles autenticados |

---

## Endpoints

### 1. Listar configuraciones

```
GET /api/v1/rol-estados-novedad
```

**Acceso:** `super_admin`, `admin`

**Query params opcionales:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `rol_id` | integer | Filtrar por rol |
| `estado_novedad_id` | integer | Filtrar por estado de novedad |
| `estado` | `0` o `1` | Filtrar por activo/inactivo |
| `page` | integer | Página (default: 1) |
| `limit` | integer | Registros por página (default: 50, max: 200) |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rol_id": 3,
      "estado_novedad_id": 2,
      "descripcion": "El supervisor puede marcar novedades como despachadas",
      "observaciones": null,
      "estado": 1,
      "created_at": "2026-03-06 15:00:00",
      "updated_at": "2026-03-06 15:00:00",
      "rolRolEstadoNovedad": {
        "id": 3,
        "nombre": "supervisor",
        "descripcion": "Supervisor de turno"
      },
      "estadoNovedadRolEstadoNovedad": {
        "id": 2,
        "nombre": "DESPACHADA",
        "color_hex": "#FF9800",
        "es_final": false,
        "es_inicial": false
      },
      "creadorRolEstadoNovedad": {
        "id": 1,
        "username": "admin",
        "nombres": "Administrador",
        "apellidos": "Sistema"
      },
      "actualizadorRolEstadoNovedad": null
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### 2. Obtener uno por ID

```
GET /api/v1/rol-estados-novedad/:id
```

**Acceso:** `super_admin`, `admin`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Registro no encontrado"
}
```

---

### 3. ⭐ Estados disponibles para un rol (uso principal del frontend)

```
GET /api/v1/rol-estados-novedad/rol/:rolId/estados
```

**Acceso:** Todos los roles autenticados

**Descripción:** Retorna los estados de novedad habilitados para el rol indicado. Es el endpoint que el frontend debe consumir para construir los dropdowns y controlar el flujo de acciones por rol, sin hardcodear nada.

**Params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `rolId` | integer | ID del rol a consultar |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "rol": {
    "id": 3,
    "nombre": "supervisor"
  },
  "data": [
    {
      "id": 1,
      "nombre": "PENDIENTE",
      "color_hex": "#9E9E9E",
      "es_final": false,
      "es_inicial": true,
      "requiere_unidad": false,
      "descripcion_acceso": "El supervisor puede ver novedades pendientes"
    },
    {
      "id": 2,
      "nombre": "DESPACHADA",
      "color_hex": "#FF9800",
      "es_final": false,
      "es_inicial": false,
      "requiere_unidad": true,
      "descripcion_acceso": "El supervisor puede marcar novedades como despachadas"
    }
  ],
  "total": 2
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Rol no encontrado o inactivo"
}
```

**Ejemplo de uso en frontend:**
```js
// Al cargar el modal de atender/despachar novedad
const { data: estados } = await api.get(`/rol-estados-novedad/rol/${user.rol_id}/estados`);
// estados es el array listo para renderizar el dropdown
```

---

### 4. Crear configuración

```
POST /api/v1/rol-estados-novedad
```

**Acceso:** `super_admin`, `admin`

**Body (application/json):**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `rol_id` | integer | ✅ | ID del rol |
| `estado_novedad_id` | integer | ✅ | ID del estado de novedad |
| `descripcion` | string | ❌ | Descripción del acceso |
| `observaciones` | string | ❌ | Observaciones adicionales |

**Ejemplo:**
```json
{
  "rol_id": 3,
  "estado_novedad_id": 2,
  "descripcion": "El supervisor puede marcar novedades como despachadas",
  "observaciones": null
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Configuración creada exitosamente",
  "data": { ... }
}
```

**Error duplicado (409):**
```json
{
  "success": false,
  "message": "Ya existe una configuración para este rol y estado de novedad"
}
```

---

### 5. Actualizar configuración

```
PUT /api/v1/rol-estados-novedad/:id
```

**Acceso:** `super_admin`, `admin`

**Body (campos opcionales):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `descripcion` | string | Nueva descripción |
| `observaciones` | string | Nuevas observaciones |
| `estado` | boolean | Activar/desactivar |

**Nota:** `rol_id` y `estado_novedad_id` no son modificables (constraint único). Si se necesita cambiar la combinación, eliminar y crear.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Configuración actualizada exitosamente",
  "data": { ... }
}
```

---

### 6. Cambiar estado (activar/desactivar)

```
PATCH /api/v1/rol-estados-novedad/:id/estado
```

**Acceso:** `super_admin`, `admin`

**Body:**
```json
{
  "estado": false
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Configuración desactivada exitosamente",
  "data": {
    "id": 1,
    "estado": 0
  }
}
```

---

### 7. Eliminar (soft-delete)

```
DELETE /api/v1/rol-estados-novedad/:id
```

**Acceso:** `super_admin`, `admin`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Configuración eliminada exitosamente"
}
```

---

## Estructura de la tabla

```sql
CREATE TABLE `rol_estados_novedad` (
  `id`               int NOT NULL AUTO_INCREMENT,
  `rol_id`           int NOT NULL COMMENT 'FK a roles',
  `estado_novedad_id` int NOT NULL COMMENT 'FK a estados_novedad',
  `descripcion`      text,
  `observaciones`    text,
  `estado`           tinyint NOT NULL DEFAULT '1',
  `created_by`       int NOT NULL,
  `created_at`       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by`       int DEFAULT NULL,
  `updated_at`       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by`       int DEFAULT NULL,
  `deleted_at`       datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rol_estados_novedad_rol_estado` (`rol_id`, `estado_novedad_id`)
);
```

---

## Errores comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | Error de validación | Campos inválidos en el body |
| 401 | No autorizado | Token ausente o inválido |
| 403 | Acceso denegado | Rol sin permiso para la operación |
| 404 | Registro no encontrado | ID inexistente o eliminado |
| 409 | Ya existe una configuración | Combinación `rol_id + estado_novedad_id` duplicada |
| 500 | Error interno | Error del servidor |

---

## Flujo recomendado para el frontend

1. Al iniciar sesión, guardar el `rol_id` del usuario autenticado.
2. Al abrir cualquier modal de acción sobre novedades, llamar a:
   ```
   GET /api/v1/rol-estados-novedad/rol/{rol_id}/estados
   ```
3. Usar el array `data` resultante para construir el dropdown de estados disponibles.
4. Solo mostrar las acciones/botones que correspondan a los estados retornados para ese rol.

Esto elimina todo hardcodeo del frontend y centraliza la lógica de acceso en la base de datos, configurable por el administrador sin necesidad de deployar cambios.
