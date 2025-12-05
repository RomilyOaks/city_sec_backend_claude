# Documentación API - Sistema de Seguridad Ciudadana

## Descripción General

API RESTful para el sistema de gestión de seguridad ciudadana que permite registrar, gestionar y monitorear novedades, incidentes, vehículos, personal y recursos operativos.

## Tecnologías

- **Node.js** + **Express.js** - Framework backend
- **Sequelize** - ORM para MySQL
- **JWT** - Autenticación basada en tokens
- **RBAC** - Control de acceso basado en roles

## URL Base

```
http://localhost:3000/api
```

## Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer {token}
```

### Obtener Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "usuario",
  "password": "contraseña"
}
```

**Respuesta:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "usuario",
    "rol": "operador"
  }
}
```

## Roles y Permisos

### Roles del Sistema

| Rol               | Descripción                     | Permisos                              |
| ----------------- | ------------------------------- | ------------------------------------- |
| **administrador** | Acceso total al sistema         | Todos los permisos                    |
| **supervisor**    | Supervisión y gestión operativa | Crear, editar, ver recursos           |
| **operador**      | Operación diaria del sistema    | Registrar novedades, asignar recursos |
| **visualizador**  | Solo lectura                    | Ver información                       |

### Matriz de Permisos

| Acción              | Operador | Supervisor | Administrador |
| ------------------- | -------- | ---------- | ------------- |
| Ver novedades       | ✓        | ✓          | ✓             |
| Crear novedad       | ✓        | ✓          | ✓             |
| Editar novedad      | ✗        | ✓          | ✓             |
| Eliminar novedad    | ✗        | ✗          | ✓             |
| Asignar recursos    | ✓        | ✓          | ✓             |
| Gestionar vehículos | ✗        | ✓          | ✓             |
| Gestionar personal  | ✗        | ✓          | ✓             |
| Configuración       | ✗        | ✗          | ✓             |

---

## Endpoints - Novedades/Incidentes

### 1. Listar Novedades

```http
GET /api/novedades
```

**Parámetros de Query:**

- `fecha_inicio` (date): Fecha inicio del filtro
- `fecha_fin` (date): Fecha fin del filtro
- `estado_id` (integer): ID del estado
- `prioridad` (string): ALTA, MEDIA, BAJA
- `sector_id` (integer): ID del sector
- `tipo_id` (integer): ID del tipo de novedad
- `page` (integer): Número de página (default: 1)
- `limit` (integer): Registros por página (default: 50)

**Ejemplo:**

```http
GET /api/novedades?fecha_inicio=2024-12-01&prioridad=ALTA&page=1&limit=20
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "novedad_code": "000001",
      "fecha_hora": "2024-12-04T10:30:00",
      "tipo": {
        "nombre": "Accidente de Tránsito",
        "color_hex": "#DC2626"
      },
      "subtipo": {
        "nombre": "Choque múltiple",
        "prioridad": "ALTA"
      },
      "estado": {
        "nombre": "EN RUTA",
        "color_hex": "#F59E0B"
      },
      "localizacion": "Av. Principal con Jr. Secundario",
      "prioridad_actual": "ALTA"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### 2. Obtener Novedad por ID

```http
GET /api/novedades/:id
```

**Ejemplo:**

```http
GET /api/novedades/1
```

### 3. Crear Novedad

```http
POST /api/novedades
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**

```json
{
  "tipo_novedad_id": 1,
  "subtipo_novedad_id": 5,
  "fecha_hora": "2024-12-04T14:30:00",
  "localizacion": "Av. Los Héroes 123",
  "referencia": "Frente al mercado central",
  "latitud": -12.0464,
  "longitud": -77.0428,
  "sector_id": 2,
  "cuadrante_id": 7,
  "origen_llamada": "TELEFONO_107",
  "reportante_nombre": "Juan Pérez",
  "reportante_telefono": "987654321",
  "descripcion": "Accidente vehicular con heridos",
  "observaciones": "Se requiere ambulancia urgente"
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Novedad creada exitosamente",
  "data": {
    "id": 1,
    "novedad_code": "000001",
    "fecha_hora": "2024-12-04T14:30:00",
    "prioridad_actual": "ALTA",
    "estado": {
      "nombre": "REGISTRADO"
    }
  }
}
```

### 4. Actualizar Novedad

```http
PUT /api/novedades/:id
Content-Type: application/json
Authorization: Bearer {token}
```

**Permisos:** Supervisor, Administrador

**Body:**

```json
{
  "estado_novedad_id": 3,
  "observaciones": "Unidad en camino",
  "fecha_despacho": "2024-12-04T14:35:00"
}
```

### 5. Asignar Recursos a Novedad

```http
POST /api/novedades/:id/asignar
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**

```json
{
  "unidad_oficina_id": 1,
  "vehiculo_id": 5,
  "personal_cargo_id": 12,
  "km_inicial": 45230.5
}
```

### 6. Obtener Historial de Estados

```http
GET /api/novedades/:id/historial
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "estado_anterior": {
        "nombre": "REGISTRADO"
      },
      "estado_nuevo": {
        "nombre": "EN RUTA"
      },
      "fecha_cambio": "2024-12-04T14:35:00",
      "tiempo_en_estado_min": 5
    }
  ]
}
```

### 7. Dashboard - Estadísticas

```http
GET /api/novedades/dashboard/stats
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "novedadesHoy": [
      {
        "estado": "EN RUTA",
        "cantidad": 15,
        "alta_prioridad": 5,
        "media_prioridad": 8,
        "baja_prioridad": 2
      }
    ],
    "novedadesPorTipo": [
      {
        "tipo": "Accidente de Tránsito",
        "cantidad": 8
      }
    ],
    "tiempoPromedioRespuesta": 12.5
  }
}
```

---

## Endpoints - Vehículos

### 1. Listar Vehículos

```http
GET /api/vehiculos
```

**Parámetros:**

- `tipo_id` (integer): Filtrar por tipo
- `estado` (boolean): 1=Activo, 0=Inactivo
- `search` (string): Buscar por placa, código o nombre

### 2. Crear Vehículo

```http
POST /api/vehiculos
Content-Type: application/json
Authorization: Bearer {token}
```

**Permisos:** Supervisor, Administrador

**Body:**

```json
{
  "tipo_id": 1,
  "placa": "ABC-123",
  "marca": "Toyota",
  "nombre": "Patrullero 01",
  "soat": "123456789",
  "fec_soat": "2025-06-30",
  "fec_manten": "2024-12-15"
}
```

### 3. Registrar Abastecimiento de Combustible

```http
POST /api/vehiculos/:id/abastecimiento
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**

```json
{
  "fecha_hora": "2024-12-04T08:00:00",
  "tipo_combustible": "GASOLINA_90",
  "km_llegada": 45230.5,
  "cantidad": 15.5,
  "unidad": "GALONES",
  "importe": 85.5,
  "precio_unitario": 5.52,
  "grifo_nombre": "Grifo El Petróleo",
  "grifo_ruc": "20123456789",
  "factura_boleta": "F001-00012345",
  "moneda": "PEN",
  "observaciones": "Tanque lleno"
}
```

### 4. Historial de Abastecimientos

```http
GET /api/vehiculos/:id/abastecimientos
```

**Parámetros:**

- `fecha_inicio` (date)
- `fecha_fin` (date)
- `limit` (integer): default 50

### 5. Vehículos Disponibles

```http
GET /api/vehiculos/disponibles
```

Retorna vehículos que no están asignados a novedades activas.

---

## Endpoints - Personal

### 1. Listar Personal

```http
GET /api/personal
```

**Parámetros:**

- `cargo_id` (integer)
- `status` (string): Activo, Inactivo, Suspendido, Retirado
- `search` (string): Buscar por nombre o documento

### 2. Crear Personal

```http
POST /api/personal
Content-Type: application/json
Authorization: Bearer {token}
```

**Permisos:** Supervisor, Administrador

**Body:**

```json
{
  "doc_tipo": "DNI",
  "doc_numero": "12345678",
  "apellido_paterno": "García",
  "apellido_materno": "López",
  "nombres": "Juan Carlos",
  "sexo": "Masculino",
  "fecha_nacimiento": "1990-05-15",
  "cargo_id": 3,
  "fecha_ingreso": "2024-01-10",
  "licencia": "A-IIa",
  "categoria": "Operador",
  "regimen": "728"
}
```

### 3. Cambiar Estado del Personal

```http
PATCH /api/personal/:id/estado
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**

```json
{
  "status": "Suspendido",
  "motivo": "Investigación administrativa"
}
```

### 4. Personal Disponible

```http
GET /api/personal/disponibles
```

### 5. Estadísticas del Personal

```http
GET /api/personal/stats
```

---

## Endpoints - Sectores y Cuadrantes

### Sectores

#### 1. Listar Sectores

```http
GET /api/sectores
```

#### 2. Crear Sector

```http
POST /api/sectores
Content-Type: application/json
Authorization: Bearer {token}
```

**Permisos:** Supervisor, Administrador

**Body:**

```json
{
  "sector_code": "S001",
  "nombre": "Centro Histórico",
  "descripcion": "Zona céntrica de la ciudad",
  "ubigeo": "150101",
  "zona_code": "ZONA-A",
  "color_mapa": "#3B82F6",
  "poligono_json": {
    "type": "Polygon",
    "coordinates": [
      [
        [-77.0428, -12.0464],
        [-77.04, -12.0464],
        [-77.04, -12.044],
        [-77.0428, -12.044],
        [-77.0428, -12.0464]
      ]
    ]
  }
}
```

### Cuadrantes

#### 1. Listar Cuadrantes

```http
GET /api/cuadrantes?sector_id=1
```

#### 2. Crear Cuadrante

```http
POST /api/cuadrantes
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**

```json
{
  "cuadrante_code": "C001",
  "nombre": "Plaza de Armas",
  "sector_id": 1,
  "latitud": -12.0464,
  "longitud": -77.0428,
  "radio_metros": 500,
  "color_mapa": "#10B981"
}
```

---

## Códigos de Estado HTTP

| Código | Significado                                |
| ------ | ------------------------------------------ |
| 200    | OK - Solicitud exitosa                     |
| 201    | Created - Recurso creado exitosamente      |
| 400    | Bad Request - Datos inválidos o faltantes  |
| 401    | Unauthorized - Token no válido o ausente   |
| 403    | Forbidden - Sin permisos suficientes       |
| 404    | Not Found - Recurso no encontrado          |
| 500    | Internal Server Error - Error del servidor |

## Ejemplos de Errores

### Error de Validación (400)

```json
{
  "success": false,
  "message": "Faltan campos requeridos: tipo_novedad_id, subtipo_novedad_id"
}
```

### Error de Autenticación (401)

```json
{
  "success": false,
  "message": "Token expirado"
}
```

### Error de Permisos (403)

```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere uno de los siguientes roles: supervisor, administrador",
  "rolActual": "operador"
}
```

---

## Variables de Entorno

Crear archivo `.env`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=citizen_security_v2
DB_USER=root
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRE=24h

# Servidor
PORT=3000
NODE_ENV=development

# API
API_VERSION=1.0.0
```

---

## Inicialización del Proyecto

### 1. Instalar dependencias

```bash
npm install express sequelize mysql2 jsonwebtoken bcryptjs dotenv cors helmet express-rate-limit
```

### 2. Configurar base de datos

```bash
# Importar el script SQL
mysql -u root -p citizen_security_v2 < citizen_security_2a.sql
```

### 3. Ejecutar servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## Estructura de Archivos

```
src/
├── config/
│   └── database.js          # Configuración de Sequelize
├── controllers/
│   ├── novedadesController.js
│   ├── vehiculosController.js
│   ├── personalController.js
│   └── sectoresController.js
├── middlewares/
│   └── authMiddleware.js    # Autenticación y RBAC
├── models/
│   └── index.js             # Modelos Sequelize
├── routes/
│   ├── index.routes.js      # Configuración principal
│   ├── novedades.routes.js
│   ├── vehiculos.routes.js
│   ├── personal.routes.js
│   └── sectores.routes.js
├── utils/
│   └── logger.js
└── app.js                    # Configuración Express
```

---

## Testing

### Con cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Obtener novedades
curl -X GET http://localhost:3000/api/novedades \
  -H "Authorization: Bearer {token}"
```

### Con Postman

Importar colección JSON con todos los endpoints configurados.

---

## Seguridad

- ✅ Autenticación JWT
- ✅ Control RBAC
- ✅ Validación de datos de entrada
- ✅ Protección contra SQL Injection (ORM)
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet.js para headers HTTP seguros
- ✅ Soft deletes para auditoría

---

## Soporte

Para reportar errores o solicitar funcionalidades, contactar al equipo de desarrollo.
