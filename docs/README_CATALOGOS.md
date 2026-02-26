# Colección Postman - Catálogos: Estados Operativos & Tipos Copiloto

## 📋 Descripción

Esta colección contiene todos los endpoints para probar los catálogos de:
- **Estados Operativo Recurso** (`/estados-operativo-recurso`)
- **Tipos Copiloto** (`/tipos-copiloto`)

## 🚀 Importar la Colección

1. Abre Postman
2. Click en **Import**
3. Selecciona el archivo: `Catalogos_EstadosOperativos_TiposCopiloto.postman_collection.json`
4. Click en **Import**

## ⚙️ Configuración de Variables de Entorno

### Opción 1: Usar las variables de la colección (recomendado para pruebas rápidas)

La colección ya incluye variables predeterminadas:
- `RemoteBase_Url`: `http://localhost:3000`
- `apiVersion`: `v1`
- `authToken`: `your_jwt_token_here` ⚠️ **DEBES ACTUALIZAR ESTO**

Para actualizar el token:
1. Click derecho en la colección
2. Selecciona **Edit**
3. Ve a la pestaña **Variables**
4. Actualiza el valor de `authToken` con tu token JWT real

### Opción 2: Crear un Environment (recomendado para múltiples entornos)

1. Click en **Environments** (icono de ojo en la esquina superior derecha)
2. Click en **+** para crear nuevo environment
3. Nombra el environment (ej: "City Sec - Local" o "City Sec - Production")
4. Agrega las siguientes variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `RemoteBase_Url` | `http://localhost:3000` | `http://localhost:3000` |
| `apiVersion` | `v1` | `v1` |
| `authToken` | `tu_token_jwt_aqui` | `tu_token_jwt_aqui` |

5. Guarda el environment
6. Selecciónalo en el dropdown de environments

### 🔑 Obtener el Token de Autenticación

Para obtener tu `authToken`, primero debes autenticarte:

**Endpoint:** `POST {{RemoteBase_Url}}/api/{{apiVersion}}/auth/login`

**Body:**
```json
{
  "usuario": "tu_usuario",
  "password": "tu_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": { ... }
}
```

Copia el valor del campo `token` y úsalo como `authToken`.

## 📁 Estructura de la Colección

### 1️⃣ Estados Operativo Recurso

```
└── Estados Operativo Recurso/
    ├── Listar Estados Activos (Dropdown)    [GET]    /activos
    ├── Listar Todos los Estados (Paginado)  [GET]    /
    ├── Obtener Estado por ID                [GET]    /:id
    ├── Crear Estado Operativo               [POST]   /
    ├── Actualizar Estado Operativo          [PUT]    /:id
    └── Eliminar Estado Operativo            [DELETE] /:id
```

**Ejemplos de códigos comunes:**
- `DISP` - Disponible
- `PATR` - En Patrulla
- `MANT` - En Mantenimiento
- `FSERV` - Fuera de Servicio
- `REPOS` - En Reposo
- `ASIGN` - Asignado

### 2️⃣ Tipos Copiloto

```
└── Tipos Copiloto/
    ├── Listar Tipos Activos (Dropdown)      [GET]    /activos
    ├── Listar Todos los Tipos (Paginado)    [GET]    /
    ├── Obtener Tipo por ID                  [GET]    /:id
    ├── Crear Tipo Copiloto                  [POST]   /
    ├── Actualizar Tipo Copiloto             [PUT]    /:id
    └── Eliminar Tipo Copiloto               [DELETE] /:id
```

**Ejemplos de tipos comunes:**
- `SERENO` - Serenazgo
- `PNP` - Policía Nacional del Perú
- `BOMBERO` - Bombero
- `CIVIL` - Personal Civil
- `MUNIC` - Personal Municipalidad

## 🧪 Flujo de Prueba Recomendado

### Test Básico (Happy Path)

#### Para Estados Operativo Recurso:

1. **Crear un nuevo estado**
   ```
   POST /estados-operativo-recurso
   Body: { "codigo": "DISP", "descripcion": "DISPONIBLE", "estado": 1 }
   ```
   - ✅ Verifica que retorna status 201
   - ✅ Guarda el ID retornado en `estadoOperativoId`

2. **Listar estados activos**
   ```
   GET /estados-operativo-recurso/activos
   ```
   - ✅ Verifica que el nuevo estado aparece en la lista

3. **Obtener por ID**
   ```
   GET /estados-operativo-recurso/{{estadoOperativoId}}
   ```
   - ✅ Verifica que retorna el estado correcto

4. **Actualizar el estado**
   ```
   PUT /estados-operativo-recurso/{{estadoOperativoId}}
   Body: { "codigo": "DISP", "descripcion": "DISPONIBLE - ACTUALIZADO", "estado": 1 }
   ```
   - ✅ Verifica que retorna status 200

5. **Eliminar el estado**
   ```
   DELETE /estados-operativo-recurso/{{estadoOperativoId}}
   ```
   - ✅ Verifica que retorna status 200
   - ✅ Verifica que ya no aparece en `/activos`

#### Para Tipos Copiloto:

Sigue el mismo flujo usando los endpoints de `/tipos-copiloto`

## 🔍 Tests Automatizados

Cada request incluye tests automatizados que se ejecutan después de recibir la respuesta:

### Tests para endpoints GET /activos:
- ✅ Status code is 200
- ✅ Response has data array
- ✅ All records are active (estado = 1)

### Tests para endpoints GET / (paginado):
- ✅ Status code is 200
- ✅ Response has pagination
- ✅ Pagination has total, page, limit

### Tests para endpoints GET /:id:
- ✅ Status code is 200
- ✅ Response has correct data structure

### Tests para endpoints POST:
- ✅ Status code is 201
- ✅ Response has created data with ID
- ✅ ID saved to environment variable

### Tests para endpoints PUT:
- ✅ Status code is 200
- ✅ Success message includes "actualizado"

### Tests para endpoints DELETE:
- ✅ Status code is 200
- ✅ Success message includes "eliminado"

## 🔐 Permisos Requeridos

Tu usuario debe tener los siguientes permisos RBAC:

### Para Estados Operativo Recurso:
- `catalogos.estados_operativo.read` (GET)
- `catalogos.estados_operativo.create` (POST)
- `catalogos.estados_operativo.update` (PUT)
- `catalogos.estados_operativo.delete` (DELETE)

### Para Tipos Copiloto:
- `catalogos.tipos_copiloto.read` (GET)
- `catalogos.tipos_copiloto.create` (POST)
- `catalogos.tipos_copiloto.update` (PUT)
- `catalogos.tipos_copiloto.delete` (DELETE)

## 📊 Formato de Respuestas

### Respuesta Exitosa (GET /activos):
```json
{
  "data": [
    {
      "id": 1,
      "codigo": "DISP",
      "descripcion": "DISPONIBLE",
      "estado": 1,
      "created_at": "2026-01-11T10:00:00.000Z",
      "updated_at": "2026-01-11T10:00:00.000Z"
    }
  ]
}
```

### Respuesta Exitosa (GET / paginado):
```json
{
  "data": [
    { "id": 1, "codigo": "DISP", "descripcion": "DISPONIBLE", "estado": 1 },
    { "id": 2, "codigo": "PATR", "descripcion": "EN PATRULLA", "estado": 1 }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Respuesta de Error (401 - No autenticado):
```json
{
  "error": "No se proporcionó un token de autenticación"
}
```

### Respuesta de Error (403 - Sin permisos):
```json
{
  "error": "No tienes permiso para realizar esta acción"
}
```

### Respuesta de Error (400 - Validación):
```json
{
  "errors": [
    {
      "msg": "El código es requerido",
      "param": "codigo",
      "location": "body"
    }
  ]
}
```

### Respuesta de Error (404 - No encontrado):
```json
{
  "error": "Estado operativo no encontrado"
}
```

## 🛠️ Troubleshooting

### Error: "No se proporcionó un token de autenticación"
- ✅ Verifica que configuraste correctamente `authToken` en las variables
- ✅ Asegúrate de que el token no haya expirado

### Error: "No tienes permiso para realizar esta acción"
- ✅ Verifica que tu usuario tiene los permisos RBAC correctos
- ✅ Contacta al administrador del sistema para solicitar permisos

### Error: "Estado operativo no encontrado"
- ✅ Verifica que el ID existe en la base de datos
- ✅ Verifica que no fue eliminado (soft delete)

### Error de conexión
- ✅ Verifica que el servidor está corriendo
- ✅ Verifica que `RemoteBase_Url` apunta a la URL correcta
- ✅ Verifica que no hay problemas de red/firewall

## 📝 Notas Importantes

1. **Soft Delete**: Los endpoints DELETE no eliminan físicamente los registros, solo los marcan como eliminados (paranoid mode)
2. **Variables Automáticas**: Los endpoints POST guardan automáticamente los IDs creados en variables de entorno (`estadoOperativoId`, `tipoCopilotoId`)
3. **Validaciones**: Los campos `codigo` y `descripcion` son requeridos. El código tiene un máximo de 10 caracteres y la descripción 35 caracteres
4. **Estado**: El campo `estado` acepta solo valores 0 (inactivo) o 1 (activo)

## 🔗 Endpoints Completos

### Estados Operativo Recurso
```
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/estados-operativo-recurso/activos
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/estados-operativo-recurso
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/estados-operativo-recurso/:id
POST   {{RemoteBase_Url}}/api/{{apiVersion}}/estados-operativo-recurso
PUT    {{RemoteBase_Url}}/api/{{apiVersion}}/estados-operativo-recurso/:id
DELETE {{RemoteBase_Url}}/api/{{apiVersion}}/estados-operativo-recurso/:id
```

### Tipos Copiloto
```
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/tipos-copiloto/activos
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/tipos-copiloto
GET    {{RemoteBase_Url}}/api/{{apiVersion}}/tipos-copiloto/:id
POST   {{RemoteBase_Url}}/api/{{apiVersion}}/tipos-copiloto
PUT    {{RemoteBase_Url}}/api/{{apiVersion}}/tipos-copiloto/:id
DELETE {{RemoteBase_Url}}/api/{{apiVersion}}/tipos-copiloto/:id
```

## 📞 Soporte

Si encuentras problemas con estos endpoints, contacta al equipo de backend o abre un issue en el repositorio del proyecto.
