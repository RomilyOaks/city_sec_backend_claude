# CLAUDE.md — CitySecure Backend API

Guía para Claude Code al trabajar en este repositorio.

---

## Proyecto

**CitySecure Backend** — API REST principal del sistema de seguridad ciudadana para la municipalidad de Chorrillos. Sirve al dashboard de serenazgo (`city_sec_frontend_v2`) y recibe novedades desde el Voice Gateway (`city_sec_voice_gateway`).

- **Puerto:** 3000
- **Versión app:** 2.4.0
- **Deploy:** Railway (auto-deploy en push a `main`)
- **Swagger:** `GET /api-docs` (generado con `npm run swagger`)
- **Repositorio:** https://github.com/RomilyOaks/city_sec_backend_claude

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
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=citizen_security_v2
DB_PORT=3306

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Servidor
PORT=3000
NODE_ENV=development          # o production en Railway
API_VERSION=v1
MAX_BODY_SIZE=10mb

# Swagger (producción)
SWAGGER_SERVER_URL=https://...

# Correo (nodemailer)
MAIL_HOST=...
MAIL_PORT=...
MAIL_USER=...
MAIL_PASS=...
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
