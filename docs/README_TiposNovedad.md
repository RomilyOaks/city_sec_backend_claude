# 📋 CitySec - Tipos Novedad - Guía Postman

> **Versión:** 1.0.0  
> **Última actualización:** 2026-01-20  
> **Endpoints:** Tipos de Novedad y Subtipos de Novedad

---

## 🎯 **Objetivo**

Probar manualmente los endpoints de **Tipos de Novedad** y **Subtipos de Novedad** del sistema CitySec Backend v2.2.2.

---

## 🔧 **Configuración de Variables**

### **1. Crear Variables de Entorno**

En Postman, crea las siguientes variables de entorno:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | URL del servidor backend |
| `apiVersion` | `v1` | Versión de la API |
| `authToken` | `{{authToken}}` | Token JWT (se obtiene con login) |

---

## 🔐 **1. Autenticación**

### **POST Login - Obtener Token**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/auth/login`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "username_or_email": "admin",
  "password": "Admin123!"
}
```

**Response esperado:**
```json
{
  "success": true,
  "data": {
    "accessToken": "ACCESS_TOKEN_EXAMPLE",
    "refreshToken": "ACCESS_TOKEN_EXAMPLE",
    "user": {
      "id": 13,
      "username": "admin",
      "email": "admin@citysec.com"
    }
  }
}
```

**⚠️ Importante:** Copia el `accessToken` y pégalo en la variable `authToken` del entorno.

---

## 📋 **2. Tipos Novedad**

### **GET Listar Tipos Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/tipos-novedad`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{authToken}}
```

**Query Parameters (opcionales):**
```
estado=true
search=
```

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Robo Vehicular",
      "descripcion": "Hurto o robo de vehículos motorizados",
      "tipo_code": "T001",
      "color": "#FF5722",
      "icono": "car",
      "orden": 1,
      "estado": true,
      "created_at": "2026-01-20T20:00:00.000Z",
      "updated_at": "2026-01-20T20:00:00.000Z"
    }
  ]
}
```

---

### **GET Obtener Tipo Novedad por ID**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/tipos-novedad/1`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{authToken}}
```

---

### **POST Crear Tipo Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/tipos-novedad`

**Method:** `POST`

**Headers:**
```
Authorization: Bearer {{authToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "nombre": "Robo Vehicular",
  "descripcion": "Hurto o robo de vehículos motorizados",
  "tipo_code": "T001",
  "color": "#FF5722",
  "icono": "car",
  "orden": 1
}
```

**Response esperado:**
```json
{
  "success": true,
  "message": "Tipo de novedad creado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Robo Vehicular",
    "descripcion": "Hurto o robo de vehículos motorizados",
    "tipo_code": "T001",
    "color": "#FF5722",
    "icono": "car",
    "orden": 1,
    "estado": true,
    "created_by": 13,
    "updated_by": 13,
    "created_at": "2026-01-20T20:00:00.000Z",
    "updated_at": "2026-01-20T20:00:00.000Z"
  }
}
```

---

### **PUT Actualizar Tipo Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/tipos-novedad/1`

**Method:** `PUT`

**Headers:**
```
Authorization: Bearer {{authToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "nombre": "Robo Vehicular (Actualizado)",
  "descripcion": "Hurto o robo de vehículos motorizados - Actualizado",
  "color": "#F44336",
  "icono": "directions_car",
  "orden": 2
}
```

---

### **DELETE Eliminar Tipo Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/tipos-novedad/1`

**Method:** `DELETE`

**Headers:**
```
Authorization: Bearer {{authToken}}
```

**Response esperado:**
```json
{
  "success": true,
  "message": "Tipo de novedad eliminado exitosamente"
}
```

---

## 📝 **3. Subtipos Novedad**

### **GET Listar Subtipos Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/subtipos-novedad`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{authToken}}
```

**Query Parameters (opcionales):**
```
estado=true
search=
tipo_novedad_id=1
```

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Robo de Vehículo Liviano",
      "descripcion": "Hurto de automóviles, camionetas y motocicletas",
      "subtipo_code": "ST001",
      "tipo_novedad_id": 1,
      "color": "#FF9800",
      "icono": "motorcycle",
      "orden": 1,
      "prioridad": "ALTA",
      "estado": true,
      "created_at": "2026-01-20T20:00:00.000Z",
      "updated_at": "2026-01-20T20:00:00.000Z"
    }
  ]
}
```

---

### **POST Crear Subtipo Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/subtipos-novedad`

**Method:** `POST`

**Headers:**
```
Authorization: Bearer {{authToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "nombre": "Robo de Vehículo Liviano",
  "descripcion": "Hurto de automóviles, camionetas y motocicletas",
  "subtipo_code": "ST001",
  "tipo_novedad_id": 1,
  "color": "#FF9800",
  "icono": "motorcycle",
  "orden": 1,
  "prioridad": "ALTA"
}
```

---

### **PUT Actualizar Subtipo Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/subtipos-novedad/1`

**Method:** `PUT`

**Headers:**
```
Authorization: Bearer {{authToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "nombre": "Robo de Vehículo Liviano (Actualizado)",
  "descripcion": "Hurto de automóviles, camionetas y motocicletas - Actualizado",
  "color": "#FFC107",
  "icono": "electric_car",
  "orden": 2,
  "prioridad": "MEDIA"
}
```

---

### **DELETE Eliminar Subtipo Novedad**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/subtipos-novedad/1`

**Method:** `DELETE`

**Headers:**
```
Authorization: Bearer {{authToken}}
```

---

## 🔍 **4. Debugging**

### **GET Health Check**

**URL:** `{{baseUrl}}/api/{{apiVersion}}/health`

**Method:** `GET`

**Response esperado:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2026-01-20T20:00:00.000Z",
  "version": "2.2.2",
  "environment": "development"
}
```

---

### **GET Available Routes**

**URL:** `{{baseUrl}}/api/{{apiVersion}}`

**Method:** `GET`

**Response esperado:**
```json
{
  "success": true,
  "message": "Rutas disponibles",
  "availableRoutes": [
    "/auth",
    "/usuarios",
    "/personal",
    "/novedades",
    "/vehiculos",
    "/tipos-novedad",
    "/subtipos-novedad",
    "/estados-novedad"
  ]
}
```

---

## 🎯 **5. Flujo de Prueba Recomendado**

### **Paso 1: Verificar Conexión**
1. **GET Health Check** - Verificar que el servidor está corriendo
2. **GET Available Routes** - Verificar que las rutas están registradas

### **Paso 2: Autenticación**
1. **POST Login** - Obtener token JWT
2. **Configurar variable `authToken`** con el token obtenido

### **Paso 3: Tipos Novedad**
1. **GET Listar** - Ver tipos existentes
2. **POST Crear** - Crear nuevo tipo
3. **GET por ID** - Ver el tipo creado
4. **PUT Actualizar** - Modificar el tipo
5. **DELETE Eliminar** - Eliminar el tipo

### **Paso 4: Subtipos Novedad**
1. **GET Listar** - Ver subtipos existentes
2. **POST Crear** - Crear nuevo subtipo (usando tipo_novedad_id válido)
3. **GET por ID** - Ver el subtipo creado
4. **PUT Actualizar** - Modificar el subtipo
5. **DELETE Eliminar** - Eliminar el subtipo

---

## 🚨 **6. Códigos de Error Comunes**

| Código | Descripción | Solución |
|--------|-------------|----------|
| `401` | No autorizado | Verificar token JWT |
| `403` | Prohibido | Verificar roles de usuario |
| `404` | No encontrado | Verificar URL y ID |
| `422` | Error de validación | Verificar datos del body |
| `500` | Error del servidor | Revisar logs del servidor |

---

## 👤 **7. Roles y Permisos**

| Endpoint | Roles Requeridos |
|----------|------------------|
| **GET** (todos) | Todos los usuarios autenticados |
| **POST** (crear) | admin, supervisor, super_admin |
| **PUT** (actualizar) | admin, supervisor, super_admin |
| **DELETE** (eliminar) | admin, super_admin |

---

## 📝 **8. Notas Importantes**

### **✅ Recordar:**
- **Actualizar `authToken`** después de cada login
- **Usar IDs válidos** en las peticiones PUT y DELETE
- **Verificar roles** del usuario para operaciones de escritura
- **Revisar logs del servidor** para debugging

### **⚠️ Precauciones:**
- **No eliminar tipos** que tengan subtipos asociados
- **Usar `tipo_code` únicos** para cada tipo
- **Mantener consistencia** en colores e iconos
- **Validar `tipo_novedad_id`** al crear subtipos

---

## 🎉 **9. Verificación Final**

Después de probar todos los endpoints, verifica:

1. ✅ **Health Check** responde correctamente
2. ✅ **Login** genera token válido
3. ✅ **Tipos Novedad** CRUD completo funciona
4. ✅ **Subtipos Novedad** CRUD completo funciona
5. ✅ **Permisos** funcionan correctamente
6. ✅ **Validaciones** previenen datos incorrectos

---

## 📞 **10. Soporte**

Si encuentras problemas:

1. **Revisa los logs del servidor** para errores detallados
2. **Verifica la conexión** a la base de datos
3. **Confirma las credenciales** de login
4. **Valida el formato JSON** de los requests
5. **Revisa los roles** del usuario

---

*Guía creada por: Windsurf AI*  
*Supervisor: Romily Oaks*  
*Fecha: 2026-01-20*  
*Versión: 1.0.0*
