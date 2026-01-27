# 📋 **API Documentation - Cuadrantes Vehículos Asignados**

## 🎯 **Overview**

API completa para la gestión de asignaciones de vehículos a cuadrantes específicos con operaciones CRUD y reactivación de soft-deletes.

---

## 📊 **Endpoints Disponibles**

### **🔍 Endpoints Principales**

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/cuadrantes-vehiculos-asignados` | Listar asignaciones con paginación | ✅ |
| `GET` | `/api/v1/cuadrantes-vehiculos-asignados/:id` | Obtener asignación por ID | ✅ |
| `POST` | `/api/v1/cuadrantes-vehiculos-asignados` | Crear nueva asignación | ✅ |
| `PUT` | `/api/v1/cuadrantes-vehiculos-asignados/:id` | Actualizar asignación | ✅ |
| `DELETE` | `/api/v1/cuadrantes-vehiculos-asignados/:id` | Eliminar asignación (soft delete) | ✅ |

### **🔄 Endpoints Especiales**

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `PATCH` | `/api/v1/cuadrantes-vehiculos-asignados/:id/reactivar` | Reactivar asignación eliminada | ✅ |
| `PATCH` | `/api/v1/cuadrantes-vehiculos-asignados/:id/estado` | Cambiar estado (activar/desactivar) | ✅ |
| `GET` | `/api/v1/cuadrantes-vehiculos-asignados/eliminadas` | Listar asignaciones eliminadas | ✅ |

---

## 📋 **Modelo de Datos**

### **CuadranteVehiculoAsignado**

```javascript
{
  id: INTEGER,                    // Primary Key
  cuadrante_id: INTEGER,          // FK → cuadrantes.id
  vehiculo_id: INTEGER,           // FK → vehiculos.id
  observaciones: VARCHAR(500),     // Observaciones opcionales
  estado: TINYINT,                // 1=ACTIVO, 0=INACTIVO
  created_by: INTEGER,             // FK → usuarios.id
  updated_by: INTEGER,             // FK → usuarios.id (nullable)
  deleted_by: INTEGER,             // FK → usuarios.id (nullable)
  created_at: DATETIME,
  updated_at: DATETIME,
  deleted_at: DATETIME,            // Soft delete
  // Relaciones:
  cuadrante: { id, nombre, codigo },
  vehiculo: { id, placa, marca, modelo },
  creadorAsignacion: { id, username, nombres, apellidos },
  actualizadorAsignacion: { id, username, nombres, apellidos },
  eliminadorAsignacion: { id, username, nombres, apellidos }
}
```

---

## 🔍 **Ejemplos de Uso**

### **1. Listar Asignaciones**

```bash
GET /api/v1/cuadrantes-vehiculos-asignados?page=1&limit=10&estado=true
```

**Response:**
```json
{
  "success": true,
  "message": "Asignaciones obtenidas exitosamente",
  "data": {
    "asignaciones": [
      {
        "id": 1,
        "cuadrante_id": 5,
        "vehiculo_id": 12,
        "observaciones": "Vehículo patrulla sector norte",
        "estado": 1,
        "created_at": "2026-01-27T04:00:00.000Z",
        "updated_at": "2026-01-27T04:00:00.000Z",
        "deleted_at": null,
        "cuadrante": {
          "id": 5,
          "nombre": "Centro Norte",
          "codigo": "CEN-001"
        },
        "vehiculo": {
          "id": 12,
          "placa": "ABC-123",
          "marca": "Toyota",
          "modelo": "Hilux"
        },
        "creadorAsignacion": {
          "id": 1,
          "username": "admin",
          "nombres": "Administrador",
          "apellidos": "Sistema"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "total": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### **2. Crear Asignación**

```bash
POST /api/v1/cuadrantes-vehiculos-asignados
Content-Type: application/json
Authorization: Bearer <token>

{
  "cuadrante_id": 5,
  "vehiculo_id": 12,
  "observaciones": "Vehículo patrulla sector norte",
  "estado": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asignación creada exitosamente",
  "data": {
    "id": 2,
    "cuadrante_id": 5,
    "vehiculo_id": 12,
    "observaciones": "Vehículo patrulla sector norte",
    "estado": 1,
    "created_at": "2026-01-27T04:15:00.000Z",
    "updated_at": "2026-01-27T04:15:00.000Z",
    "deleted_at": null,
    "cuadrante": {
      "id": 5,
      "nombre": "Centro Norte",
      "codigo": "CEN-001"
    },
    "vehiculo": {
      "id": 12,
      "placa": "ABC-123",
      "marca": "Toyota",
      "modelo": "Hilux"
    }
  }
}
```

### **3. Reactivar Asignación Eliminada**

```bash
PATCH /api/v1/cuadrantes-vehiculos-asignados/2/reactivar
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Asignación reactivada exitosamente",
  "data": {
    "id": 2,
    "cuadrante_id": 5,
    "vehiculo_id": 12,
    "observaciones": "Vehículo patrulla sector norte",
    "estado": 1,
    "deleted_at": null,
    "cuadrante": { ... },
    "vehiculo": { ... }
  }
}
```

---

## 🔧 **Parámetros de Query**

### **Para Listado Principal**

| Parámetro | Tipo | Descripción | Ejemplo |
|------------|------|-------------|---------|
| `page` | integer | Número de página (default: 1) | `1` |
| `limit` | integer | Registros por página (default: 10, max: 100) | `20` |
| `search` | string | Búsqueda en observaciones | `"patrulla"` |
| `estado` | boolean | Filtrar por estado | `true` |
| `cuadrante_id` | integer | Filtrar por cuadrante | `5` |
| `vehiculo_id` | integer | Filtrar por vehículo | `12` |
| `sort` | string | Campo de ordenación | `created_at` |
| `order` | string | Dirección de ordenación (ASC/DESC) | `DESC` |

### **Para Asignaciones Eliminadas**

| Parámetro | Tipo | Descripción | Ejemplo |
|------------|------|-------------|---------|
| `page` | integer | Número de página (default: 1) | `1` |
| `limit` | integer | Registros por página (default: 10) | `20` |
| `search` | string | Búsqueda en observaciones | `"patrulla"` |
| `sort` | string | Campo de ordenación | `deleted_at` |
| `order` | string | Dirección de ordenación | `DESC` |

---

## 🚨 **Códigos de Error**

### **Errores de Validación**

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "cuadrante_id",
      "message": "El ID del cuadrante es requerido"
    }
  ]
}
```

### **Errores de Negocio**

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `DUPLICATE_ASSIGNMENT` | Ya existe una asignación para este cuadrante y vehículo | Violación de constraint único |
| `CUADRANTE_NOT_FOUND` | El cuadrante especificado no existe | FK inválida |
| `VEHICULO_NOT_FOUND` | El vehículo especificado no existe | FK inválida |
| `FOREIGN_KEY_ERROR` | Error de referencia: El ID proporcionado no existe | FK inválida |

### **Errores HTTP**

| Código | Descripción |
|--------|-------------|
| `400` | Error de validación o parámetros inválidos |
| `401` | No autorizado (token inválido o ausente) |
| `403` | Prohibido (permisos insuficientes) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (asignación duplicada) |
| `500` | Error interno del servidor |

---

## 🔐 **Autenticación y Permisos**

### **Headers Requeridos**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### **Permisos Necesarios**

| Operación | Permisos Requeridos |
|-----------|-------------------|
| Listar asignaciones | `catalogos.read` o `cuadrantes.read` o `vehiculos.read` |
| Crear asignación | `catalogos.create` o `cuadrantes.create` o `vehiculos.create` |
| Actualizar asignación | `catalogos.update` o `cuadrantes.update` o `vehiculos.update` |
| Eliminar asignación | `catalogos.delete` o `cuadrantes.delete` o `vehiculos.delete` |
| Reactivar asignación | `catalogos.create` o `cuadrantes.create` o `vehiculos.create` |

---

## 📝 **Auditoría**

Todas las operaciones de creación, actualización y eliminación registran automáticamente:

- **Usuario que realiza la acción** (ID, username, nombres, apellidos)
- **Timestamp** de la acción
- **Entidad afectada** (CuadranteVehiculoAsignado)
- **Severidad** según el tipo de operación
- **Módulo** (Catálogos)

---

## 🔄 **Flujo Completo de Asignación**

1. **Verificar disponibilidad** - Validar que no exista asignación duplicada
2. **Validar FKs** - Comprobar que existan cuadrante y vehículo
3. **Crear registro** - Insertar con auditoría completa
4. **Retornar datos** - Incluir relaciones completas
5. **Manejar errores** - Respuestas específicas según el caso

---

## 🎯 **Best Practices**

1. **Validar unique constraint** antes de crear
2. **Usar transacciones** para operaciones complejas
3. **Implementar reactivación** en lugar de hard delete
4. **Incluir relaciones** en respuestas para mejor UX
5. **Registrar auditoría** en todas las operaciones importantes

---

**📋 Esta API está lista para integración frontend completa.**
