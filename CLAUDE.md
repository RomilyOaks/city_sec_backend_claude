# CLAUDE.md — CitySecure Backend API

Guía para Claude Code al trabajar en este repositorio.

---

## Proyecto

**CitySecure Backend** — API REST principal del sistema de seguridad ciudadana para la municipalidad de Chorrillos. Sirve al dashboard de serenazgo (`city_sec_frontend_v2`) y recibe novedades desde el Voice Gateway (`city_sec_voice_gateway`).

- **Puerto local:** 3000 (dev) · Railway asigna dinámicamente via `$PORT` (producción: 8080)
- **Versión app:** 2.4.0
- **Deploy:** Railway (auto-deploy en push a `main`)
- **Swagger UI:** `GET /api/v1/docs`
- **Swagger JSON:** `GET /api/v1/docs.json`
- **Health check:** `GET /health` (responde `{ status: "ok" }` sin depender de la DB)
- **Repositorio:** https://github.com/RomilyOaks/city_sec_backend_claude

### URLs de Railway (producción)

| Ruta | Descripción |
|---|---|
| `GET /health` | Healthcheck liviano — Railway lo llama al deployar |
| `GET /api/v1` | Info general de la API |
| `GET /api/v1/health` | Health check con estado de la DB |
| `GET /api/v1/docs` | Swagger UI interactivo |
| `GET /api/v1/docs.json` | Spec OpenAPI en JSON |
| `GET /api/v1/docs.yaml` | Spec OpenAPI en YAML |

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js ≥18 · ES Modules (`"type": "module"`) |
| Framework | Express 5.2.1 |
| ORM | Sequelize 6 → MySQL 8.0 |
| Auth | JWT propio (`jsonwebtoken`) + RBAC |
| Seguridad | Helmet · CORS · express-rate-limit · bcryptjs |
| Validación | express-validator (por módulo en `src/validators/`) |
| Logs | Winston + winston-daily-rotate-file |
| Testing | Jest 29 + Supertest |
| Docs API | swagger-autogen + swagger-ui-express |
| Exportes | ExcelJS · xlsx |
| Tiempo real | SSE (`src/utils/sse-manager.js`) |
| OAuth (futuro) | passport-google-oauth20 · passport-microsoft |

---

## Comandos Esenciales

```bash
npm run dev          # Nodemon con hot-reload → :3000
npm start            # Producción (node src/app.js)
npm test             # Jest + coverage
npm run lint         # ESLint src/**/*.js
npm run lint:fix     # ESLint con autofix
npm run swagger      # Regenera swagger_output.json
npm run db:seed      # Ejecuta todos los seeders
npm run seed:rbac    # Solo seeds de roles y permisos
npm run seed:estados # Solo seeds de estados de novedad
npm run db:migrate   # Aplica migraciones Sequelize
npm run db:migrate:undo  # Revierte última migración
```

---

## Estructura del Proyecto

```
src/
├── app.js                      # Entry point — monta middlewares y rutas
├── config/
│   ├── database.js             # Sequelize connection
│   ├── auth.js                 # JWT secrets y config
│   └── constants.js
├── models/                     # Modelos Sequelize (un archivo por entidad)
│   ├── index.js                # Asociaciones entre modelos
│   ├── Novedad.js
│   ├── Usuario.js · Rol.js · Permiso.js
│   ├── Vehiculo.js · PersonalSeguridad.js
│   ├── Sector.js · Cuadrante.js · Calle.js · Direccion.js
│   ├── OperativosTurno.js · OperativosPersonal.js · OperativosVehiculos.js
│   ├── TipoNovedad.js · SubtipoNovedad.js · EstadoNovedad.js
│   ├── HistorialEstadoNovedad.js · AuditoriaAccion.js
│   └── ... (ver src/models/)
├── controllers/                # Un controlador por entidad
├── routes/
│   ├── index.routes.js         # Registro centralizado de todas las rutas
│   └── *.routes.js             # Rutas por módulo
├── middlewares/
│   ├── authMiddleware.js       # authenticate / requireRole / requirePermission
│   ├── rateLimitMiddleware.js
│   ├── handleValidationErrors.js
│   └── auditoriaAccionMiddleware.js
├── validators/                 # express-validator chains (un archivo por entidad)
├── services/
│   ├── geocodingService.js
│   ├── operativosHelperService.js
│   └── reportesOperativosService.js
├── seeders/
│   ├── seedRBAC.js             # Roles, permisos y usuario admin inicial
│   ├── seedEstadosNovedad.js
│   └── seedOperativosTurno.js
├── utils/
│   ├── logger.js               # Winston logger
│   ├── responseFormatter.js    # Formato estándar de respuestas { success, data, message }
│   ├── dateHelper.js           # Manejo de fechas en UTC-5 (America/Lima)
│   ├── historialHelper.js
│   ├── resolveEntidadPolimorfica.js
│   └── sse-manager.js          # Server-Sent Events
└── constants/
    └── validations.js
```

---

## Variables de Entorno

```env
# Servidor
PORT=3000                     # Railway sobreescribe con su puerto asignado
NODE_ENV=development          # o production en Railway
API_VERSION=v1
MAX_BODY_SIZE=10mb

# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=citizen_security_v2
DB_PORT=3306
DB_POOL_MAX=5                 # 20 en producción vía env var
# DB_POOL_MIN siempre es 0 en el código (hardcoded) — ver nota de deploy

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Swagger (producción)
SWAGGER_SERVER_URL=https://tu-app.railway.app/api/v1

# CORS
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=*

# Correo (recuperación de contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_cuenta@gmail.com
SMTP_PASSWORD=tu_app_password
RESEND_FROM_EMAIL=onboarding@resend.dev   # Resend free tier
RESEND_FROM_NAME=CitySecure

# Bcrypt / seguridad
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15m

# 2FA
TWO_FACTOR_APP_NAME=Seguridad Ciudadana
```

---

## Sistema RBAC

### Roles predefinidos

| Rol | Slug | Nivel jerárquico |
|---|---|---|
| Super Administrador | `super_admin` | 0 |
| Administrador | `admin` | 1 |
| Operador | `operador` | 2 |
| Supervisor | `supervisor` | 3 |
| Consulta | `consulta` | 4 |
| Usuario Básico | `usuario_basico` | 5 |

### Formato de permisos

`modulo.recurso.accion`

```
usuarios.usuarios.read
novedades.incidentes.create
vehiculos.combustible.read
```

### Middlewares de autorización

```js
import { authenticate, requireRole, requirePermission } from '../middlewares/authMiddleware.js';

// Solo autenticado
router.get('/ruta', authenticate, controller);

// Solo admin o super_admin
router.delete('/ruta', authenticate, requireRole(['super_admin', 'admin']), controller);

// Permiso específico
router.post('/ruta', authenticate, requirePermission('novedades.incidentes.create'), controller);
```

> Los permisos con `es_sistema: true` **no se pueden editar ni eliminar**.

---

## Módulos de la API

| Prefijo | Módulo |
|---|---|
| `/api/v1/auth` | Autenticación (login, refresh, logout, change-password, forgot-password) |
| `/api/v1/usuarios` | CRUD usuarios + reset password + estados |
| `/api/v1/roles` | Gestión de roles |
| `/api/v1/permisos` | Gestión de permisos |
| `/api/v1/novedades` | Incidentes / novedades (núcleo del sistema) |
| `/api/v1/vehiculos` | Flota vehicular |
| `/api/v1/personal` | Personal de seguridad |
| `/api/v1/sectores` | Sectores de patrullaje |
| `/api/v1/cuadrantes` | Cuadrantes dentro de sectores |
| `/api/v1/calles` | Catálogo de calles |
| `/api/v1/direcciones` | Direcciones georeferenciadas |
| `/api/v1/catalogos` | Tipos/subtipos de novedad, vehículos, etc. |
| `/api/v1/operativos-turno` | Turnos operativos |
| `/api/v1/operativos-personal` | Asignación de personal a operativos |
| `/api/v1/operativos-vehiculos` | Asignación de vehículos a operativos |
| `/api/v1/abastecimientos` | Combustible y abastecimiento |
| `/api/v1/mantenimientos` | Mantenimiento vehicular |
| `/api/v1/reportes` | Reportes exportables |
| `/api/v1/reportes-operativos` | Reportes de operativos |
| `/api/v1/auditoria` | Historial de acciones (AuditoriaAccion) |
| `/api/v1/health` | Health check |

---

## Convenciones de Código

### ES Modules — obligatorio

```js
// ✅
import express from 'express';
import { myFunc } from './my-module.js'; // siempre con extensión .js

// ❌ Nunca
const express = require('express');
```

`__dirname` y `__filename` no existen de forma nativa. Usar:
```js
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

### Formato de respuestas

Usar siempre `responseFormatter.js`:
```js
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
res.json(successResponse(data, 'Mensaje opcional'));
res.status(400).json(errorResponse('Descripción del error'));
```

### Logger

```js
import { logger } from '../utils/logger.js';
logger.info('mensaje');
logger.warn('advertencia');
logger.error('error con stack', { stack: err.stack });
```

### Validadores

Cada entidad tiene su archivo en `src/validators/`.
Los errores se procesan con el middleware `handleValidationErrors.js`:
```js
router.post('/', [...validadores], handleValidationErrors, controller.create);
```

### Commits

```
Add:     Nueva funcionalidad
Fix:     Corrección de bug
Update:  Actualización de código existente
Refactor: Refactorización sin cambio de comportamiento
Docs:    Documentación
```

---

## Archivos Clave

| Archivo | Propósito |
|---|---|
| `src/app.js` | Entry point — middlewares, Swagger, rutas, sync Sequelize |
| `src/routes/index.routes.js` | Registro centralizado de todas las rutas |
| `src/config/database.js` | Conexión Sequelize (MySQL) |
| `src/config/auth.js` | JWT secrets y duración de tokens |
| `src/models/index.js` | Todas las asociaciones entre modelos |
| `src/middlewares/authMiddleware.js` | `authenticate`, `requireRole`, `requirePermission` |
| `src/utils/responseFormatter.js` | Formato estándar de respuestas |
| `src/utils/sse-manager.js` | Server-Sent Events (actualizaciones en tiempo real) |
| `src/seeders/seedRBAC.js` | Roles, permisos y usuario admin inicial |
| `swagger_output.json` | Spec Swagger generada (regenerar con `npm run swagger`) |

---

## Trampas Conocidas — Express 5 + Railway

Lecciones aprendidas en producción. **Leer antes de tocar `app.js` o el deploy.**

### 🚨 Express 5 + path-to-regexp v8: Wildcards con nombre obligatorio

Express 5 usa `path-to-regexp` v8 que ya **no acepta `"*"` suelto** en rutas.
Esto lanza un `TypeError` síncrono durante la carga del módulo, matando el servidor.

```js
// ❌ Express 4 — ROMPE en Express 5
app.options("*", cors(corsOptions));
app.get("*", handler);
app.use("*", handler);

// ✅ Express 5 — usar regex
app.options(/(.*)/, cors(corsOptions));

// ✅ Express 5 — o named wildcard
app.get("/{*name}", handler);
```

Aplica a `app.options`, `app.get`, `app.post`, `app.use`, etc. y a todos los routers.

---

### 🚨 Sequelize: `pool.min` siempre debe ser `0`

Si `pool.min > 0`, Sequelize intenta abrir conexiones TCP **al instanciar** (`new Sequelize()`).
En Railway cold-start la DB no está lista → el import del módulo se **bloquea** → el servidor HTTP
nunca arranca → el healthcheck falla con "service unavailable".

```js
// ✅ En database.js — hardcodeado, no configurable vía .env
const POOL_MIN = 0; // Lazy pool — abre conexiones solo cuando hay una query real
```

---

### 🚨 `process.on("uncaughtException")` debe registrarse AL INICIO del archivo

Si se registra al final (línea 400+) y una excepción ocurre en el setup (swagger, cors, helmet),
el proceso muere **silenciosamente** — Railway solo muestra dos líneas de dotenv y nada más.

```js
// ✅ Inmediatamente después de los imports, ANTES de cualquier setup
process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error.message, error.stack);
  // No llamar process.exit() — Railway sigue monitoreando el healthcheck
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
});
```

---

### 🚨 Swagger: envolver setup en `try/catch`

`fs.readFileSync(swagger_output.json)` puede fallar si el archivo no existe o está corrupto.
Ese error síncrono mata el proceso. Con `try/catch`, la app arranca igual (sin Swagger).

```js
try {
  const swaggerDocument = JSON.parse(fs.readFileSync(...));
  app.use(`/api/${API_VERSION}/docs`, swaggerUI.serve, swaggerUI.setup(swaggerDocument));
} catch (err) {
  console.error("⚠️ Swagger setup falló (no fatal):", err.message);
}
```

---

### 🚨 Railway healthcheck: usar `/health` liviano ANTES de las rutas

El healthcheck de Railway se dispara durante el deploy. Si apunta a `/api/v1/health`
(que pasa por middlewares, DB, etc.) puede fallar por timeout.

```toml
# railway.toml
[deploy]
healthcheckPath = "/health"         # ruta liviana, SIN dependencias
healthcheckTimeout = 120            # dar tiempo al cold start (Docker + DB)
restartPolicyType = "on_failure"    # NO reiniciar en process.exit(0)
restartPolicyMaxRetries = 3
```

```js
// En app.js — ANTES de app.use('/api/v1', indexRoutes)
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
```

---

### 🚨 `app.listen()` no debe depender de la conexión a DB

```js
// ✅ Patrón correcto — HTTP server arranca primero, DB conecta async
const httpServer = app.listen(PORT, () => console.log("🚀 puerto", PORT));
sequelize.authenticate()
  .then(() => console.log("✅ DB conectada"))
  .catch((err) => console.error("⚠️ DB no disponible:", err.message));
  // La app sigue respondiendo — Railway no la mata
```

---

## Restricciones Importantes

- **No usar `require()`** — este proyecto es 100% ES Modules.
- **No hardcodear** valores de configuración; todo desde `.env`.
- **No modificar** los permisos del sistema (`es_sistema: true`).
- **No commitear** credenciales ni el archivo `.env`.
- **No hacer push** sin preguntar al usuario primero.
- Cuando se agregue un nuevo módulo, registrar su ruta en `src/routes/index.routes.js`.
- Regenerar Swagger con `npm run swagger` si se modifican endpoints.

---

## Credenciales Iniciales (post seed:rbac)

```
Username: admin
Email:    admin@citysec.com
Password: Admin123!
```

⚠️ Cambiar inmediatamente después del primer login en producción.

---

## Contexto en la Arquitectura Global

Este backend es consumido por:
- `city_sec_frontend_v2` — dashboard de serenazgo (SPA React)
- `city_sec_voice_gateway` — microservicio que crea novedades desde reportes ciudadanos

Ver `/mnt/d/robles/Project/CLAUDE.md` para el diagrama completo de la arquitectura.
