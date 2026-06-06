# Quickstart — TD-P-005: Turno Activo del Sereno

## Cómo probar el endpoint localmente

### 1. Prerrequisitos

```bash
# Backend corriendo
npm run dev   # → http://localhost:3000

# BD local activa con datos de prueba:
# - Un usuario con rol "sereno" y personal_seguridad_id asignado
# - Un horario de turno activo para la hora actual
# - Un operativo (turno + vehiculo o personal) del día actual
```

### 2. Ejecutar el seeder de permisos

```bash
node src/seeders/seedPatrullaje.js
# Verifica: rol sereno (ya existe), crea permisos patrullaje.sereno.read y patrullaje.conductor.read
```

### 3. Obtener un JWT de sereno

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "<usuario_sereno>", "password": "<password>"}'
# Guardar el accessToken
```

### 4. Llamar al endpoint

```bash
# Con turno activo:
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Sin JWT (→ 401):
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo

# Con JWT de operador (→ 403):
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo \
  -H "Authorization: Bearer <TOKEN_OPERADOR>"
```

### 5. Verificar criterios de aceptación

| AC | Comando | Resultado esperado |
|---|---|---|
| AC-01 | JWT sereno conductor, dentro del turno | `data.vehiculo` tiene placa |
| AC-02 | JWT sereno a pie, dentro del turno | `data.vehiculo: null`, `tipo_patrullaje: "A_PIE"` |
| AC-03 | Cualquier JWT, fuera del horario | `data: null` |
| AC-04 | Sin JWT | HTTP 401 |
| AC-05 | JWT de operador | HTTP 403 |

---

## Archivos creados por esta feature

```
src/
├── controllers/patrullajeController.js   # getTurnoActivo()
├── routes/patrullaje.routes.js           # GET /turno-activo
├── validators/patrullaje.validator.js    # (trivial, por consistencia)
└── seeders/seedPatrullaje.js             # permisos + asignación al rol sereno
```

Modificaciones en archivos existentes:
```
src/routes/index.routes.js               # +1 import y router.use('/patrullaje', ...)
```

---

## Variables de entorno necesarias

Sin cambios — el endpoint usa las mismas variables que el resto del backend.
`DB_DIALECT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` ya configuradas.
