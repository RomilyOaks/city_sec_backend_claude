# 📋 CitySec Backend - Guía de Pruebas Postman
## Horarios Turnos API v1.0.0

---

## 🚀 **Configuración Inicial**

### **Variables de Entorno**
Configura estas variables en Postman:

```json
{
  "baseUrl": "http://localhost:3000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Autenticación**
Usa estas credenciales para obtener el token:

```json
POST {{baseUrl}}/api/v1/auth/login
{
  "username_or_email": "admin",
  "password": "Admin123!"
}
```

---

## 📚 **Endpoints API**

### **🔐 Autenticación**
```
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
  "username_or_email": "admin",
  "password": "Admin123!"
}
```

**Response Exitoso:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com",
      "rol": "ADMIN"
    }
  }
}
```

---

## 🕐 **Horarios Turnos - CRUD Completo**

### **📄 1. Listar Horarios Turnos**
```
GET {{baseUrl}}/api/v1/horarios-turnos?page=1&limit=20&estado=1&includeDeleted=false
Authorization: Bearer {{token}}
```

**Parámetros Query:**
- `page`: Número de página (default: 1)
- `limit`: Límite de resultados (default: 20, max: 100)
- `estado`: Filtrar por estado (0, 1, true, false)
- `includeDeleted`: Incluir eliminados (true, false)

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Horarios de turnos obtenidos exitosamente",
  "data": [
    {
      "turno": "MAÑANA",
      "hora_inicio": "06:00:00",
      "hora_fin": "14:00:00",
      "cruza_medianoche": 0,
      "estado": 1,
      "created_by": 1,
      "created_at": "2026-01-20T10:00:00.000Z",
      "updated_by": null,
      "updated_at": "2026-01-20T10:00:00.000Z",
      "deleted_by": null,
      "deleted_at": null,
      "creador": {
        "id": 1,
        "username": "admin",
        "email": "admin@citysec.com"
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### **🔍 2. Obtener Horario por ID**
```
GET {{baseUrl}}/api/v1/horarios-turnos/MAÑANA
Authorization: Bearer {{token}}
```

**Parámetros Path:**
- `turno`: ID del turno (MAÑANA, TARDE, NOCHE)

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Horario de turno obtenido exitosamente",
  "data": {
    "turno": "MAÑANA",
    "hora_inicio": "06:00:00",
    "hora_fin": "14:00:00",
    "cruza_medianoche": 0,
    "estado": 1,
    "created_by": 1,
    "created_at": "2026-01-20T10:00:00.000Z",
    "updated_by": null,
    "updated_at": "2026-01-20T10:00:00.000Z",
    "deleted_by": null,
    "deleted_at": null,
    "creador": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com"
    },
    "actualizador": null,
    "eliminador": null
  }
}
```

---

### **➕ 3. Crear Horario Turno**
```
POST {{baseUrl}}/api/v1/horarios-turnos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "turno": "MAÑANA",
  "hora_inicio": "06:00:00",
  "hora_fin": "14:00:00",
  "cruza_medianoche": false
}
```

**Campos Obligatorios:**
- `turno`: Tipo de turno (MAÑANA, TARDE, NOCHE)
- `hora_inicio`: Hora de inicio (HH:MM:SS)
- `hora_fin`: Hora de fin (HH:MM:SS)

**Campos Opcionales:**
- `cruza_medianoche`: Si cruza medianoche (default: false)

**Response Exitoso (201):**
```json
{
  "success": true,
  "message": "Horario de turno creado exitosamente",
  "data": {
    "turno": "MAÑANA",
    "hora_inicio": "06:00:00",
    "hora_fin": "14:00:00",
    "cruza_medianoche": 0,
    "estado": 1,
    "created_by": 1,
    "created_at": "2026-01-20T10:00:00.000Z",
    "updated_by": null,
    "updated_at": "2026-01-20T10:00:00.000Z",
    "deleted_by": null,
    "deleted_at": null,
    "creador": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com"
    }
  }
}
```

---

### **✏️ 4. Actualizar Horario Turno**
```
PUT {{baseUrl}}/api/v1/horarios-turnos/MAÑANA
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "hora_inicio": "06:30:00",
  "hora_fin": "14:30:00",
  "cruza_medianoche": false,
  "estado": true
}
```

**Campos Opcionales:**
- `hora_inicio`: Hora de inicio (HH:MM:SS)
- `hora_fin`: Hora de fin (HH:MM:SS)
- `cruza_medianoche`: Si cruza medianoche (true/false)
- `estado`: Estado del horario (true/false)

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Horario de turno actualizado exitosamente",
  "data": {
    "turno": "MAÑANA",
    "hora_inicio": "06:30:00",
    "hora_fin": "14:30:00",
    "cruza_medianoche": 0,
    "estado": 1,
    "created_by": 1,
    "created_at": "2026-01-20T10:00:00.000Z",
    "updated_by": 1,
    "updated_at": "2026-01-20T11:00:00.000Z",
    "deleted_by": null,
    "deleted_at": null,
    "creador": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com"
    },
    "actualizador": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com"
    }
  }
}
```

---

### **🗑️ 5. Eliminar Horario Turno (Soft Delete)**
```
DELETE {{baseUrl}}/api/v1/horarios-turnos/MAÑANA
Authorization: Bearer {{token}}
```

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Horario de turno eliminado exitosamente"
}
```

---

## 🔄 **Endpoints Especiales**

### **♻️ 6. Reactivar Horario Turno**
```
POST {{baseUrl}}/api/v1/horarios-turnos/MAÑANA/reactivar
Authorization: Bearer {{token}}
```

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Horario de turno reactivado exitosamente",
  "data": {
    "turno": "MAÑANA",
    "hora_inicio": "06:00:00",
    "hora_fin": "14:00:00",
    "cruza_medianoche": 0,
    "estado": 1,
    "created_by": 1,
    "created_at": "2026-01-20T10:00:00.000Z",
    "updated_by": 1,
    "updated_at": "2026-01-20T11:30:00.000Z",
    "deleted_by": null,
    "deleted_at": null,
    "creador": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com"
    },
    "actualizador": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com"
    }
  }
}
```

---

### **⏰ 7. Obtener Horario Activo Actual**
```
GET {{baseUrl}}/api/v1/horarios-turnos/activo
Authorization: Bearer {{token}}
```

**Parámetros Query (Opcional):**
- `timestamp`: Timestamp ISO8601 para pruebas

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Horario activo obtenido exitosamente",
  "data": {
    "turno": "MAÑANA",
    "hora_inicio": "06:00:00",
    "hora_fin": "14:00:00",
    "cruza_medianoche": 0,
    "estado": 1,
    "created_by": 1,
    "created_at": "2026-01-20T10:00:00.000Z",
    "updated_by": null,
    "updated_at": "2026-01-20T10:00:00.000Z",
    "deleted_by": null,
    "deleted_at": null,
    "creador": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com"
    },
    "actualizador": null,
    "hora_actual": "08:30:00",
    "esta_en_turno": true
  }
}
```

**Response Sin Horario Activo (404):**
```json
{
  "success": false,
  "message": "No hay horario activo en este momento",
  "data": {
    "hora_actual": "22:30:00",
    "horarios_disponibles": [
      {
        "turno": "MAÑANA",
        "hora_inicio": "06:00:00",
        "hora_fin": "14:00:00",
        "cruza_medianoche": 0
      },
      {
        "turno": "TARDE",
        "hora_inicio": "14:00:00",
        "hora_fin": "22:00:00",
        "cruza_medianoche": 0
      },
      {
        "turno": "NOCHE",
        "hora_inicio": "22:00:00",
        "hora_fin": "06:00:00",
        "cruza_medianoche": 1
      }
    ]
  }
}
```

---

## 🧪 **Casos de Prueba Recomendados**

### **✅ Pruebas Positivas**

1. **Creación Exitosa:**
   - Crear horario MAÑANA: 06:00:00 - 14:00:00
   - Crear horario TARDE: 14:00:00 - 22:00:00
   - Crear horario NOCHE: 22:00:00 - 06:00:00 (cruza medianoche)

2. **Actualización Parcial:**
   - Modificar solo hora_inicio
   - Modificar solo hora_fin
   - Cambiar cruza_medianoche a true

3. **Detección de Horario Activo:**
   - Probar a diferentes horas del día
   - Verificar horario que cruza medianoche

4. **Reactivación:**
   - Eliminar un horario
   - Reactivar el mismo horario

### **❌ Pruebas Negativas**

1. **Validaciones:**
   - Turno duplicado
   - Hora fin anterior a hora inicio (sin cruzar medianoche)
   - Formato de hora inválido
   - Turno inválido

2. **Permisos:**
   - Acceder sin token
   - Acceder con token inválido
   - Operaciones con rol inadecuado

3. **Recursos No Existentes:**
   - Obtener horario inexistente
   - Actualizar horario inexistente
   - Eliminar horario inexistente

---

## 📊 **Ejemplos de Datos de Prueba**

### **Horarios Típicos:**
```json
// Turno Mañana
{
  "turno": "MAÑANA",
  "hora_inicio": "06:00:00",
  "hora_fin": "14:00:00",
  "cruza_medianoche": false
}

// Turno Tarde
{
  "turno": "TARDE",
  "hora_inicio": "14:00:00",
  "hora_fin": "22:00:00",
  "cruza_medianoche": false
}

// Turno Noche (cruza medianoche)
{
  "turno": "NOCHE",
  "hora_inicio": "22:00:00",
  "hora_fin": "06:00:00",
  "cruza_medianoche": true
}
```

---

## 🔧 **Troubleshooting**

### **Errores Comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | Token inválido o expirado | Obtener nuevo token con login |
| `400 Bad Request` | Datos inválidos | Verificar formato de horas y campos |
| `404 Not Found` | Recurso no existe | Verificar que el turno exista |
| `403 Forbidden` | Permisos insuficientes | Usar usuario con rol ADMIN/SUPERVISOR |

### **Tips:**

1. **Formato de Horas:** Usar siempre `HH:MM:SS` (24 horas)
2. **Cruce de Medianoche:** Setear `cruza_medianoche: true` cuando hora_fin < hora_inicio
3. **Soft Delete:** Los registros eliminados no aparecen por defecto
4. **Token:** Renovar token cada 1 hora para evitar expiración

---

## 📝 **Notas Importantes**

- **Versión API:** v1.0.0
- **Base URL:** `http://localhost:3000`
- **Autenticación:** Bearer Token JWT
- **Formato:** JSON
- **Encoding:** UTF-8
- **Timezone:** America/Lima (GMT-5)

---

## 🚀 **Próximos Pasos**

1. **Importar Colección Postman**
2. **Configurar Variables de Entorno**
3. **Obtener Token de Autenticación**
4. **Ejecutar Pruebas CRUD**
5. **Validar Endpoints Especiales**
6. **Probar Casos de Error**

---

**📞 Soporte:** Si encuentras algún problema, revisa los logs del servidor o contacta al equipo de desarrollo.

---

*Documento creado por: Windsurf AI*  
*Supervisor: Romily Oaks*  
*Fecha: 2026-01-20*  
*Versión: 1.0.0*
