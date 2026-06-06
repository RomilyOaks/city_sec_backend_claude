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
| ORM | Sequelize 6 → MySQL 8.0 (producción) · PostgreSQL 15 (Supabase, alternativo) |
| Driver PG | `pg` — requerido cuando `DB_DIALECT=postgres` |
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
npm run db:seed          # Ejecuta todos los seeders (LOCAL)
npm run db:seed:rbac     # Solo seeds de roles y permisos (LOCAL)
npm run db:seed:estados  # Solo seeds de estados de novedad (LOCAL)
npm run db:seed:turnos   # Solo seeds de turnos operativos (LOCAL)
npm run db:migrate       # Aplica migraciones Sequelize (LOCAL)
npm run db:migrate:undo  # Revierte última migración (LOCAL)

# ─── Railway (producción) — requiere railway CLI + estar vinculado al proyecto ───
npm run railway:seed          # Ejecuta todos los seeders en Railway
npm run railway:seed:rbac     # Solo RBAC en Railway
npm run railway:seed:estados  # Solo estados en Railway
npm run railway:seed:turnos   # Solo turnos en Railway
npm run railway:migrate       # Aplica migraciones en Railway
npm run railway:migrate:undo  # Revierte última migración en Railway
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

| Rol | Slug | Tipo | Nivel |
|---|---|---|---|
| Super Administrador | `super_admin` | Sistema | 0 |
| Administrador | `admin` | Sistema | 1 |
| Supervisor | `supervisor` | Sistema | 2 |
| Operador | `operador` | Sistema | 3 |
| Consulta | `consulta` | Sistema | 4 |
| Radio Operador | `radio_operador` | Operativo | — |
| Sereno | `sereno` | Operativo | — |
| Telefonista | `telefonista` | Operativo | — |
| Invitado | `invitado` | Operativo | — |
| Usuario Básico | `usuario_basico` | Operativo | — |

**Roles del sistema** (`super_admin`, `admin`, `supervisor`, `operador`, `consulta`): van hardcodeados en el primer argumento de `verificarRolesOPermisos`.
**Roles operativos** (`radio_operador`, `sereno`, `telefonista`, etc.): acceden exclusivamente vía permisos asignados en la DB (segundo argumento).

### Formato de permisos

`modulo.recurso.accion`

```
usuarios.usuarios.read
novedades.incidentes.create
vehiculos.combustible.read
```

### Middlewares de autorización

```js
import {
  verificarToken,
  verificarRolesOPermisos,
  requireAnyPermission,
} from '../middlewares/authMiddleware.js';
```

#### Patrón principal: `verificarRolesOPermisos(rolesDelSistema, permisosDB)`

Este middleware implementa lógica OR en dos capas:

```js
router.get(
  '/ruta',
  verificarToken,
  verificarRolesOPermisos(
    ['super_admin', 'admin', 'supervisor', 'operador', 'consulta'], // ← capa 1
    ['modulo.recurso.read']                                          // ← capa 2
  ),
  controller
);
```

**Capa 1 — Roles del sistema (hardcodeados):**
- Son los roles de gestión/operación que SIEMPRE tienen acceso al endpoint.
- Se hardcodean porque son roles que el sistema define como "roles de turno" con acceso garantizado.
- `super_admin` y `admin` siempre pasan, incluso si no aparecen en la lista — el middleware los eleva automáticamente.
- Los roles secundarios como `radio_operador`, `sereno`, `telefonista` **NO van aquí**.

**Capa 2 — Permisos dinámicos (desde la DB):**
- Se verifican contra `req.user.permisos`, que se carga en cada request desde la tabla `permisos` vía `rol_permisos`.
- Permiten que roles secundarios (`radio_operador`, `sereno`, etc.) accedan dinámicamente según lo que el administrador les haya asignado en la DB.
- Los slugs deben usar **dot notation**: `modulo.recurso.accion` (nunca underscore entre partes).
- Si un rol secundario debe tener acceso, se le asigna el permiso en la DB — no se toca el código de la ruta.

**Regla clave:** nunca agregar `radio_operador`, `sereno`, `telefonista` u otros roles operativos al array de la capa 1. Esos roles se manejan exclusivamente por la capa 2.

#### Slugs de permisos — dot notation obligatoria

```
✅ catalogos.tipos.novedad.read
✅ calles.calles.cuadrantes.read
✅ reportes.operativos.dashboard.read

❌ catalogos.tipos_novedad.read      ← underscore entre partes = incorrecto
❌ calles.calles_cuadrantes.read     ← idem
```

Si se crea un permiso nuevo en `seedRBAC.js`, el slug debe usar dot notation desde el inicio.

#### Migraciones de slugs en MySQL Railway

Los slugs en MySQL Railway deben mantenerse sincronizados con Supabase (fuente de verdad).
Scripts de migración en `src/scripts/` y SQL en `database/migrations/`.

Para ejecutar un script de migración desde local contra Railway MySQL usar la URL pública:
```bash
railway run --service citizen_security_db node src/scripts/<script>.js
# El script debe leer process.env.MYSQL_PUBLIC_URL (no DB_HOST, que es interno)
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
| `src/config/database.js` | Conexión Sequelize — dual dialecto MySQL/PostgreSQL controlado por `DB_DIALECT` |
| `src/config/auth.js` | JWT secrets y duración de tokens |
| `src/models/index.js` | Todas las asociaciones entre modelos |
| `src/middlewares/authMiddleware.js` | `authenticate`, `requireRole`, `requirePermission` |
| `src/utils/responseFormatter.js` | Formato estándar de respuestas |
| `src/utils/sse-manager.js` | Server-Sent Events (actualizaciones en tiempo real) |
| `src/seeders/seedRBAC.js` | Roles, permisos y usuario admin inicial |
| `src/scripts/test-db-connection.js` | Verifica conexión + existencia de tablas en MySQL o PostgreSQL |
| `swagger_output.json` | Spec Swagger generada (regenerar con `npm run swagger`) |
| `supabase/migrations/001_citysecure_schema.sql` | 52 tablas + triggers PL/pgSQL + índices para Supabase |
| `supabase/migrations/002_citysecure_seeds.sql` | 6 roles + 122 permisos + usuario admin para Supabase |
| `supabase/migrations/SUPABASE_SETUP.md` | Guía completa para conectar a Supabase |

---

## Soporte Dual Dialecto (MySQL + PostgreSQL)

El backend corre sobre MySQL en Railway (producción) y puede conectarse a PostgreSQL/Supabase cambiando tres variables de entorno. El dialecto se detecta **una sola vez al cargar el módulo** y configura toda la capa de persistencia automáticamente.

### Variables de control

```env
DB_DIALECT=mysql        # o "postgres"
DB_SCHEMA=public        # ignorado en MySQL; "citysecure" para Supabase
DB_SSL=false            # true para Supabase (activa rejectUnauthorized: false)
```

### Exports de database.js

```js
import sequelize, { DB_DIALECT, DB_SCHEMA, IS_POSTGRES } from "../config/database.js";
// IS_POSTGRES = (DB_DIALECT === "postgres")  — usar en guards dialect-específicos
```

### Todos los modelos deben declarar schema

```js
// ✅ En las opciones de todo modelo Sequelize
const MyModel = sequelize.define("MyModel", { ...fields }, {
  tableName: "my_table",
  schema: DB_SCHEMA,   // ignorado en MySQL, enruta al schema correcto en PostgreSQL
  ...
});
```

Si se agrega un modelo nuevo y no lleva `schema: DB_SCHEMA`, sus queries en PostgreSQL irán al schema `public` en vez de `citysecure`. Esto no produce error inmediato — falla silenciosamente con "table not found".

### Verificar la conexión activa

```bash
node src/scripts/test-db-connection.js
```

---

## Trampas Conocidas — PostgreSQL / Supabase

Errores reales encontrados al migrar de MySQL a PostgreSQL. **Leer antes de tocar cualquier modelo, seeder o script SQL.**

---

### 🚨 `ADD CONSTRAINT IF NOT EXISTS` no existe en PostgreSQL

PostgreSQL 14 y anteriores (incluido el que usa Supabase) **no soportan** esta sintaxis para ALTER TABLE. Se usa para FKs circulares que no pueden declararse en el CREATE TABLE inicial.

```sql
-- ❌ Error: syntax error at or near "NOT"  (PostgreSQL)
ALTER TABLE personal_seguridad
  ADD CONSTRAINT IF NOT EXISTS fk_personal_vehiculo
  FOREIGN KEY (vehiculo_asignado_id) REFERENCES vehiculos(id);

-- ✅ Patrón idempotente correcto para PostgreSQL
DO $$ BEGIN
  ALTER TABLE personal_seguridad
    ADD CONSTRAINT fk_personal_vehiculo
    FOREIGN KEY (vehiculo_asignado_id) REFERENCES vehiculos(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

Aplica a las 4 FK circulares del esquema: `personal_seguridad`, `novedades_incidentes`, `operativos_turno`, `tracking_vehiculos`.

---

### 🚨 Commit prematuro de transacción en seeders

Si se llama `transaction.commit()` inmediatamente después de `sequelize.transaction()` y luego se pasan esa misma variable `transaction` a operaciones posteriores, **MySQL lo ignora silenciosamente pero PostgreSQL falla** con `cannot run INSERT in a transaction that has already been committed`.

```js
// ❌ Bug sutil — la transacción se cierra antes de usarse
const transaction = await sequelize.transaction();
await transaction.commit(); // ← NUNCA aquí
const [rol] = await Rol.findOrCreate({ ..., transaction }); // falla en PostgreSQL

// ✅ Correcto — un solo commit, al final de todas las operaciones
const transaction = await sequelize.transaction();
try {
  const [rol] = await Rol.findOrCreate({ ..., transaction });
  // ... todas las operaciones ...
  await transaction.commit(); // ← solo aquí
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

---

### 🚨 `sequelize.Op` no existe — importar `Op` directamente

Acceder a los operadores como `sequelize.Op.in` o `sequelize.Op.or` no funciona en Sequelize 6 con ES Modules. En MySQL falla en silencio o produce queries incorrectas; en PostgreSQL lanza error.

```js
// ❌ Nunca
where: { id: { [sequelize.Op.in]: ids } }

// ✅ Siempre importar Op por separado
import { Op } from "sequelize";
where: { id: { [Op.in]: ids } }
```

---

### 🚨 `BIGINT.UNSIGNED` e `INTEGER.UNSIGNED` no existen en PostgreSQL

PostgreSQL no tiene tipos sin signo. Sequelize lanza error al sincronizar o al generar DDL.

```js
// ❌ Solo MySQL
type: DataTypes.BIGINT.UNSIGNED
type: DataTypes.INTEGER.UNSIGNED

// ✅ Compatible en ambos dialectos
type: DataTypes.BIGINT
type: DataTypes.INTEGER
```

El cambio es retrocompatible con MySQL — los valores no negativos funcionan igual.

---

### 🚨 FK type mismatch — PostgreSQL requiere tipos exactamente iguales

MySQL acepta FK de `BIGINT` apuntando a `INTEGER`. PostgreSQL lanza error de tipo incompatible.

```
ERROR: foreign key constraint cannot be implemented
DETAIL: Key columns "operativo_turno_id" (integer) and "id" (bigint) are of incompatible types.
```

Solución: la PK y todas sus FKs deben ser el **mismo tipo exacto**. Si hay duda, usar `BIGINT`/`BIGSERIAL` en la PK cuando las FKs referencian con `BIGINT`.

Tabla afectada en este proyecto: `operativos_turno.id` debía ser `BIGSERIAL` (no `SERIAL`/`INTEGER`) porque `operativos_personal.operativo_turno_id` es `BIGINT`.

---

### 🚨 `CURDATE()` es MySQL-only — usar `CURRENT_DATE`

```js
// ❌ Solo MySQL
sequelize.fn("CURDATE")

// ✅ Estándar SQL — funciona en MySQL y PostgreSQL
sequelize.fn("CURRENT_DATE")
```

---

### 🚨 `FIELD()` es MySQL-only — usar `CASE WHEN` en PostgreSQL

```js
// ❌ Solo MySQL
sequelize.literal("FIELD(prioridad, 'ALTA', 'MEDIA', 'BAJA')")

// ✅ Dual dialecto
const orderExpr = IS_POSTGRES
  ? sequelize.literal("CASE WHEN prioridad='ALTA' THEN 1 WHEN prioridad='MEDIA' THEN 2 ELSE 3 END")
  : sequelize.literal("FIELD(prioridad, 'ALTA', 'MEDIA', 'BAJA')");
```

---

### 🚨 `Op.like` es case-sensitive en PostgreSQL — usar `Op.iLike`

En MySQL `LIKE` es case-insensitive por defecto (collation `utf8mb4_0900_ai_ci`). En PostgreSQL `LIKE` distingue mayúsculas; `ILIKE` no.

```js
// ❌ En PostgreSQL filtra por case — comportamiento distinto al esperado
where: { nombre: { [Op.like]: `%${q}%` } }

// ✅ Dual dialecto
where: { nombre: { [IS_POSTGRES ? Op.iLike : Op.like]: `%${q}%` } }
```

Archivos afectados: `Calle.js`, `PersonalSeguridad.js`, `Ubigeo.js`.

---

### 🚨 Comparaciones booleanas difieren entre MySQL y PostgreSQL

MySQL almacena `BOOLEAN` como `TINYINT(1)` — las comparaciones con literales `1`/`0` funcionan.
PostgreSQL almacena `BOOLEAN` real — las comparaciones deben usar `true`/`false`.

```js
// ❌ Solo MySQL (falla silenciosamente en PostgreSQL — devuelve resultados incorrectos)
sequelize.literal("CASE WHEN activo_24h = 1 THEN 1 ELSE 0 END")
estado: 1

// ✅ Dual dialecto
sequelize.literal(IS_POSTGRES
  ? "CASE WHEN activo_24h = true THEN 1 ELSE 0 END"
  : "CASE WHEN activo_24h = 1 THEN 1 ELSE 0 END")
estado: true  // también funciona en MySQL con Sequelize (castea automáticamente)
```

En los seeders, usar siempre `estado: true` — Sequelize lo castea correctamente en ambos dialectos.

---

### 🚨 GROUP BY estricto en PostgreSQL

MySQL en modo no-strict permite seleccionar columnas no-agregadas sin incluirlas en `GROUP BY`.
PostgreSQL requiere que **todas** las columnas del SELECT no-agregadas aparezcan en `GROUP BY`.

```js
// ❌ Error en PostgreSQL: "column must appear in GROUP BY clause"
{
  attributes: ["id", "nombre", "color_hex"],
  include: [{ model: Novedad, attributes: [[fn("COUNT", ...), "total"]] }],
  group: ["id"],   // ← falta nombre y color_hex
}

// ✅ Listar todas las columnas no-agregadas
{
  group: ["EstadoNovedad.id", "EstadoNovedad.nombre", "EstadoNovedad.color_hex",
          "EstadoNovedad.icono", "EstadoNovedad.orden"],
}
```

Modelos afectados: `EstadoNovedad.js`, `Sector.js`, `TipoNovedad.js`, `TipoVehiculo.js`.

---

### 🚨 Opciones MySQL-only en modelos Sequelize

Las opciones `charset`, `collate` y `engine` en el objeto de opciones del modelo son **ignoradas silenciosamente en PostgreSQL** pero pueden contaminar el DDL generado. Removerlas de todos los modelos.

```js
// ❌ Solo MySQL — remover si existen
{
  tableName: "mi_tabla",
  charset: "utf8mb4",
  collate: "utf8mb4_0900_ai_ci",
  engine: "InnoDB",
}

// ✅ Sin opciones de dialecto
{
  tableName: "mi_tabla",
  schema: DB_SCHEMA,
}
```

---

### 🚨 SQL crudo con funciones MySQL — reemplazar con JS cuando sea posible

Queries raw que usan `CAST(... AS UNSIGNED)`, `SUBSTRING_INDEX`, `IF()` u otras funciones MySQL-only deben reemplazarse con lógica JavaScript para mantener compatibilidad.

Ejemplo en `Vehiculo.js` (hook `beforeCreate`):

```js
// ❌ MySQL-only
const [rows] = await sequelize.query(
  `SELECT MAX(CAST(SUBSTRING(codigo_vehiculo, ${prefijo.length + 2}) AS UNSIGNED)) AS max_num
   FROM vehiculos WHERE codigo_vehiculo LIKE '${prefijo}-%'`
);

// ✅ Puro JS — compatible en ambos dialectos
const vehiculos = await Vehiculo.findAll({
  where: { codigo_vehiculo: { [Op.like]: `${prefijo}-%` } },
  attributes: ["codigo_vehiculo"],
  transaction: options.transaction,
});
const ultimo = vehiculos.length
  ? vehiculos.reduce((max, v) => {
      const n = parseInt((v.codigo_vehiculo || "").split("-")[1]) || 0;
      const m = parseInt((max.codigo_vehiculo || "").split("-")[1]) || 0;
      return n > m ? v : max;
    })
  : null;
```

---

### 🚨 `search_path` no configurado — queries raw fallan con "relation does not exist"

Sequelize ORM resuelve el schema automáticamente vía `schema: DB_SCHEMA` en cada modelo.
**Las queries SQL raw (`sequelize.query()`) no llevan ese contexto** — PostgreSQL busca en
`public` por defecto y lanza `ERROR: relation "tabla" does not exist`.

La solución está en `src/config/database.js`: `pgDialectOptions` incluye
`options: -c search_path=${DB_SCHEMA},public` que configura el `search_path` en cada
conexión del pool al momento de crearla. Esto cubre automáticamente todo SQL raw sin
necesidad de prefijar nombres de tabla.

```js
// ✅ En database.js — ya aplicado (no modificar)
const pgDialectOptions = {
  ...(sslConfig && { ssl: sslConfig }),
  ...(DB_SCHEMA && { options: `-c search_path=${DB_SCHEMA},public` }),
};
```

Archivos con SQL raw que se benefician de este fix:
- `src/services/reportesOperativosService.js`
- `src/controllers/personalController.js`
- `src/controllers/trackingController.js`

Si se agrega un nuevo archivo con `sequelize.query()` raw, **no hace falta hacer nada** —
el `search_path` ya está activo en la conexión.

---

### 🚨 `COUNT(*)` y agregados SQL raw devuelven **string**, no número

El driver `pg` (PostgreSQL) retorna `COUNT(*)`, `COUNT(DISTINCT ...)` y `SUM(...)` como
**string** para evitar overflow de enteros JavaScript. `mysql2` hace lo mismo.

Al acumular sin castear con `+`, JavaScript concatena en lugar de sumar:

```js
// ❌ Concatenación silenciosa — aplica tanto a MySQL como PostgreSQL
0 + "1" + "2" + "1"  // = "0121"  →  parseInt("0121") = 121  (bug)

// ✅ Castear antes de acumular
parseInt(valor, 10) || 0        // enteros (COUNT, SUM de enteros)
parseFloat(valor) || 0          // decimales (AVG, SUM de decimales)
```

**Regla:** cualquier campo numérico que venga de `sequelize.query()` con
`QueryTypes.SELECT` debe castearse antes de usarlo en operaciones aritméticas.

```js
// ✅ Patrón correcto en acumuladores
acumulador = (acumulador || 0) + (parseInt(dato.total, 10) || 0);

// ✅ En valores de retorno de funciones de resumen
total_novedades: parseInt(totalNovedades[0]?.total, 10) || 0,
promedio_tiempo: parseFloat(resumen.promedio_tiempo_respuesta) || 0,
```

Síntoma en el dashboard: KPI "Total Novedades" mostraba `231` (2+3+1 concatenados)
en lugar de `6`; gráfico de turnos mostraba `12` en lugar de `3`; tendencias `121`
en lugar de `4`.

Archivos corregidos (2026-05-31):
- `src/services/reportesOperativosService.js` — `getDashboardOperativos`,
  `getResumenVehicular`, `getResumenPie`, `getResumenNovedadesNoAtendidas`,
  `combinarAnalisisTurnos`, `combinarAnalisisPrioridad`, `combinarTendencias`

---

### 🚨 Alias SQL con mayúsculas devuelven clave lowercase en PostgreSQL

PostgreSQL **lowercasea todos los identificadores no entre comillas dobles**. Un alias
`AS Usuario_Operador_Sistema` devuelve la clave `usuario_operador_sistema` en el objeto
resultado. MySQL preserva el case del alias sin comillas.

Consecuencia: cualquier código que acceda `item.Usuario_Operador_Sistema` obtiene
`undefined` en PostgreSQL → campos vacíos en exports Excel/CSV.

```sql
-- ❌ MySQL OK pero PostgreSQL devuelve 'usuario_operador_sistema'
CONCAT(ps.nombres, ' ', ps.apellidos) AS Usuario_Operador_Sistema

-- ✅ Comillas dobles preservan el case en ambos dialectos
CONCAT(ps.nombres, ' ', ps.apellidos) AS "Usuario_Operador_Sistema"
```

**Aplica también a bare aliases (sin AS):**
```sql
-- ❌ PostgreSQL devuelve 'cargo_conductor'
carg_chof.nombre Cargo_Conductor,

-- ✅
carg_chof.nombre "Cargo_Conductor",
```

**Regla**: todo alias en SQL raw con al menos una letra mayúscula debe ir entre comillas dobles.
Esto incluye aliases que **empiezan con minúscula pero tienen mayúsculas internas**
(`cargo_Usuario_Actualiza_Operativo_Novedad` → también requiere comillas).

MySQL ignora las comillas dobles en alias — el patrón es seguro en ambos dialectos.

Archivos corregidos (2026-05-31):
- `src/services/reportesOperativosService.js` — 62 aliases en `getOperativosVehiculares`
  y `getOperativosPie`

---

### 🚨 Columnas faltantes en Supabase — migración incremental

Al migrar MySQL → Supabase, la migración inicial puede no incluir todas las columnas
que se fueron agregando con ALTER TABLE en MySQL. Síntoma: `column X does not exist`
en el log de Supabase al ejecutar queries que las referencian.

Patrón de fix:
1. Identificar la columna en el log de error de Supabase (servicio `postgres`)
2. Verificar esquema: `SELECT column_name FROM information_schema.columns WHERE table_name = 'tabla'`
3. Aplicar migración: `mcp__supabase__apply_migration` con `ADD COLUMN IF NOT EXISTS`
4. Crear archivo `supabase/migrations/0NN_descripcion.sql` para el historial del repo

Columnas agregadas post-migración inicial (2026-05-31):
| Migración | Tabla | Columna | Tipo |
|---|---|---|---|
| 011 | `novedades_incidentes` | `ajustado_en_mapa`, `fecha_ajuste_mapa`, `reporte_vecino_id` | SMALLINT / TIMESTAMPTZ / BIGINT |
| 012 | `operativos_vehiculos` | `kilometros_recorridos` | INTEGER |
| 013 | `operativos_vehiculos_cuadrantes` | `tiempo_minutos` | INTEGER |
| 013 | `operativos_personal_cuadrantes` | `tiempo_minutos` | INTEGER |

---

### 🚨 `getNovedadesNoAtendidas` — prepared statements y SQL injection

La función original usaba template literals con user input directo en el SQL
(`'%${generico}%'`, `${sector_id}`, etc.), vulnerable a SQL injection y también
incompatible con el binding estricto de PostgreSQL.

Fix (2026-05-31): migrada a construcción dinámica de `whereConditions[]` + `whereReplacements[]`.
Cada filtro agrega `"AND campo = ?"` al array de condiciones y el valor al array de
replacements. Los arrays se combinan en una sola query con `LIMIT ? OFFSET ?`.

```js
// ✅ Patrón seguro — user input NUNCA toca el SQL string
whereConditions.push("AND ni.sector_id = ?");
whereReplacements.push(sector_id);
// ...
db.query(query, { replacements: [...whereReplacements, limit, offset] });
```

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

## Seguridad — Guía para Desarrollo Futuro

Lecciones aprendidas de la auditoría Aikido (2026-06-01). Aplicar en todo código nuevo.

---

### 🚨 Nunca hardcodear credenciales — ni en seeders ni en ejemplos

Cualquier valor secreto en el código fuente queda grabado en el historial de git para siempre, aunque luego se elimine del archivo.

```js
// ❌ Nunca — queda en git history
const adminPassword = "<CONTRASEÑA_HARDCODEADA>";
const jwtSecret = "<SECRET_64_CHARS_HEX>";

// ✅ Siempre leer desde variable de entorno con fallback no-secreto
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "Admin123!";
```

Aplica a: seeders, scripts, tests, configuración, cualquier archivo commiteado.

---

### 🚨 `.env.example` nunca debe contener valores reales

`.env.example` es un archivo público commiteado. Solo puede tener placeholders descriptivos.

```env
# ❌ Valor real en .env.example — Aikido lo detecta como "leaked secret"
JWT_SECRET=<VALOR_REAL_AQUI>

# ✅ Placeholder descriptivo — instrucción, no valor
JWT_SECRET=                   # Generar con: node -e "require('crypto').randomBytes(64).toString('hex')"
```

Si se commitea un secret real en `.env.example`, la solución completa requiere:
1. Eliminar el valor del archivo → variable de entorno.
2. Limpiar el historial con `git filter-repo --replace-text`.
3. Force push a GitHub.
4. Rotar el secret comprometido (generar uno nuevo en producción).

---

### 🚨 Ejemplos en documentación: nunca usar el prefijo JWT real

Los scanners de seguridad detectan `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` (header JWT base64) como un secreto, aunque el token esté truncado con `...`.

```markdown
<!-- ❌ Aikido lo marca como "token leaked" — el prefijo base64 del header JWT dispara el scanner -->
"token": "<TOKEN_JWT_BASE64_HEADER>..."

<!-- ✅ Placeholder neutro — no dispara ningún scanner -->
"token": "<ACCESS_TOKEN>"
"accessToken": "<ACCESS_TOKEN>"
"refreshToken": "<REFRESH_TOKEN>"
```

Aplica a: archivos `.md`, comentarios JSDoc, `swagger.js`, `swagger_output.json`, colecciones Postman.

---

### 🚨 Mantener dependencias actualizadas — revisar CVEs periódicamente

Las dependencias con CVEs conocidos son detectadas automáticamente por Aikido y similares.

**CVEs corregidos en auditoría 2026-06-01:**

| Paquete | Versión vulnerable | Versión segura | CVE / Riesgo |
|---|---|---|---|
| `sequelize` | 6.37.7 | 6.37.8 | SQL injection en JSON/JSONB |
| `nodemailer` | 7.0.12 | 8.0.9 | CRLF injection, auth missing |
| `lodash` | 4.17.21 | 4.18.1 | Prototype pollution + RCE (Critical) |
| `tmp` | 0.2.5 | 0.2.6 | Path traversal (transitivo via exceljs) |
| `mysql2` | 3.16.0 | 3.22.4 | SQL injection via escape inconsistente |

> `lodash` y `tmp` son dependencias transitivas — su versión se fuerza vía el campo `overrides` en `package.json`.

**Regla:** al agregar o actualizar una dependencia, verificar que no tenga CVEs conocidos:

```bash
npm audit                        # Reporte de vulnerabilidades en dependencias
npm audit fix                    # Autofix de vulnerabilidades sin breaking changes
npm audit fix --force            # Incluye breaking changes (revisar con cuidado)
```

Para saltos de versión mayor (ej: nodemailer 7→8), verificar que la API usada en el proyecto no haya cambiado antes de actualizar.

---

### 🚨 Si se detecta un secret en el historial: protocolo de limpieza

```bash
# 1. Instalar git-filter-repo (una sola vez)
pip install git-filter-repo

# 2. Crear archivo de reemplazos
echo "SECRET_REAL==>PLACEHOLDER_SEGURO" > replacements.txt

# 3. Reescribir TODO el historial
git filter-repo --replace-text replacements.txt --force

# 4. Restaurar el remote (filter-repo lo elimina por seguridad)
git remote add origin https://github.com/RomilyOaks/city_sec_backend_claude.git

# 5. Force push (destruye el historial remoto — confirmar antes)
git push --force origin main

# 6. Limpiar archivo temporal
rm replacements.txt

# 7. OBLIGATORIO: rotar el secret en producción (Railway)
```

⚠️ El force push reescribe el historial público. Coordinar con colaboradores si los hay.

---

### 🚨 Los ejemplos "malos" en documentación también disparan scanners

Aunque el ejemplo esté marcado con ❌ y sea solo ilustrativo, Aikido detecta el patrón igualmente. Esto incluye versiones truncadas del secret (`valor_inicio...valor_fin`).

No mostrar el valor problemático en el ejemplo — ni completo, ni truncado, ni inventado con el mismo patrón. Describir el problema en palabras y solo mostrar el ✅.

```js
// ✅ Único ejemplo que debe aparecer en docs — placeholder entre ángulos
const jwtSecret = "<SECRET_64_CHARS_HEX>";
JWT_SECRET=<VALOR_REAL_AQUI>
```

**Regla:** en cualquier documentación o guía de seguridad, no mostrar el valor problemático en ninguna forma (completo, truncado ni inventado con patrón similar). Describir el problema solo con palabras y mostrar únicamente el patrón correcto.

---

### 🚨 `filter-repo` revierte cambios no commiteados — commitear antes de limpiar historial

Cuando `git filter-repo` reescribe el historial, hace checkout del nuevo HEAD y **sobreescribe los archivos del working tree** que no estén commiteados. Cualquier cambio en `package.json` o `package-lock.json` hecho con `npm install` pero aún sin commitear se pierde.

```bash
# ❌ Orden incorrecto — los cambios de npm install se pierden
npm install sequelize@6.37.8
git filter-repo --replace-text replacements.txt --force
# → package.json vuelve a la versión anterior del HEAD

# ✅ Orden correcto — commitear ANTES de limpiar
npm install sequelize@6.37.8
git add package.json package-lock.json
git commit -m "Fix: actualizar dependencia X"
git filter-repo --replace-text replacements.txt --force
# → el commit queda en el historial reescrito
```

---

### 🚨 Overrides de dependencias transitivas con conflicto de versión directa

Si el paquete a forzar también existe como dependencia directa en `package.json`, el override global falla con `EOVERRIDE`. Usar overrides anidados por paquete padre en su lugar.

```json
// ❌ Falla si "uuid" también es dependencia directa
"overrides": {
  "uuid": "11.1.1"
}

// ✅ Override anidado — solo afecta a sequelize y exceljs, no a la dep directa
"overrides": {
  "sequelize": { "uuid": "11.1.1" },
  "exceljs":   { "uuid": "11.1.1" }
}
```

---

### 🚨 Dockerfile: nunca ejecutar como root

Las imágenes `node:alpine` incluyen el usuario `node` (UID 1000). Siempre cambiar ownership y switchear antes del `CMD`.

```dockerfile
# ❌ Sin USER — el proceso corre como root dentro del contenedor
CMD ["node", "src/app.js"]

# ✅ Ejecutar como usuario no-root
RUN chown -R node:node /app
USER node
CMD ["node", "src/app.js"]
```

Si un atacante logra explotar la app, tener root dentro del contenedor facilita el escape al host.

---

### 🚨 Al crear un seeder con usuario inicial

```js
// ✅ Patrón correcto para seeders con credenciales
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "Admin123!";
const passwordHash  = await bcrypt.hash(adminPassword, 10);

// Al final del seeder, imprimir la contraseña REAL usada (no un valor hardcodeado)
console.log(`   Password: ${adminPassword}`);
console.log("   ⚠️  Cambiar después del primer login en producción");
```

La variable `ADMIN_INITIAL_PASSWORD` debe estar en `.env` (local) y en Railway (producción) si se quiere usar una contraseña diferente al default.

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

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `.specify/specs/003-turno-activo/plan.md`
<!-- SPECKIT END -->
