# Convenciones de Código

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
import { formatResponse, formatErrorResponse } from '../utils/responseFormatter.js';
res.json(formatResponse(true, 'Mensaje opcional', data));
res.status(400).json(formatErrorResponse('Descripción del error'));
```

### Logger

```js
import logger from '../utils/logger.js';  // default export — NO es named export
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
| `src/config/database.js` | Conexión Sequelize — dual dialecto MySQL/PostgreSQL controlado por `DB_DIALECT` |
| `src/config/auth.js` | JWT secrets y duración de tokens |
| `src/models/index.js` | Todas las asociaciones entre modelos |
| `src/middlewares/authMiddleware.js` | `authenticate`, `requireRole`, `requirePermission` |
| `src/utils/responseFormatter.js` | Formato estándar de respuestas |
| `src/utils/sse-manager.js` | Server-Sent Events (actualizaciones en tiempo real) |
| `src/seeders/seedRBAC.js` | Roles, permisos y usuario admin inicial |
| `src/seeders/seedPatrullaje.js` | Permisos `patrullaje.sereno.read` / `patrullaje.conductor.read` → rol sereno |
| `src/controllers/patrullajeController.js` | Turno activo del sereno — lógica vehicular + a pie + novedades |
| `src/routes/patrullaje.routes.js` | `GET /patrullaje/turno-activo` con `requireAnyPermission` |
| `src/scripts/test-db-connection.js` | Verifica conexión + existencia de tablas en MySQL o PostgreSQL |
| `swagger_output.json` | Spec Swagger generada (regenerar con `npm run swagger`) |
| `supabase/migrations/001_citysecure_schema.sql` | 52 tablas + triggers PL/pgSQL + índices para Supabase |
| `supabase/migrations/002_citysecure_seeds.sql` | 6 roles + 122 permisos + usuario admin para Supabase |
| `supabase/migrations/SUPABASE_SETUP.md` | Guía completa para conectar a Supabase |
| `docs/permisos.md` | Lista completa de los 122 permisos organizados por módulo |
| `docs/esquema-bd.md` | Estructura de tablas, columnas clave y relaciones entre modelos |
| `docs/historial.md` | Bugs resueltos, trampas PostgreSQL, Express 5 y guía de seguridad |
