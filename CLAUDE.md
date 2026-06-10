# CLAUDE.md — CitySecure Backend API

Guía para Claude Code al trabajar en este repositorio.

Las secciones detalladas están divididas en archivos bajo `docs/claude/` y se cargan automáticamente vía `@import`. Este archivo principal mantiene solo lo esencial para orientarse rápido.

---

## Proyecto

**CitySecure Backend** — API REST principal del sistema de seguridad ciudadana para la municipalidad de Chorrillos. Sirve al dashboard de serenazgo (`city_sec_frontend_v2`) y recibe novedades desde el Voice Gateway (`city_sec_voice_gateway`).

- **Puerto local:** 3000 (dev) · Railway asigna dinámicamente via `$PORT` (producción: 8080)
- **Versión app:** 2.8.0
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
| Auth | JWT propio (`jsonwebtoken`) + RBAC · Supabase Auth JWT (módulo ciudadano) |
| Seguridad | Helmet · CORS · express-rate-limit · bcryptjs |
| Validación | express-validator (por módulo en `src/validators/`) |
| Logs | Winston + winston-daily-rotate-file |
| Testing | Jest 29 + Supertest |
| Docs API | swagger-autogen + swagger-ui-express |
| Exportes | ExcelJS · xlsx |
| Tiempo real | SSE (`src/utils/sse-manager.js`) |
| Supabase | `@supabase/supabase-js` 2.108.0 · `ws` (WebSocket transport) |
| Uploads | multer (memoryStorage) · `@supabase/supabase-js` Storage |
| PDF | pdfkit — generación de facturas (placeholder activo; implementación pendiente) |
| Cron | node-cron — billing automático (`BILLING_CRON_ENABLED=false` por ahora) |
| OAuth (futuro) | passport-google-oauth20 · passport-microsoft |

> **⚠️ `@supabase/supabase-js` v2.108.0 y Node.js 18:** Esta versión exige WebSocket nativo, disponible de forma estable recién en Node.js 22. En Node.js 18 el cliente falla al inicializarse con `"Node.js 18 detected without native WebSocket support"`. **Solución aplicada:** instalar el paquete `ws` y pasarlo como transport en `src/config/supabaseClient.js`:
> ```js
> import ws from "ws";
> createClient(url, key, { realtime: { transport: ws } })
> ```
> Si se actualiza Railway a Node.js 20 o 22, el paquete `ws` se vuelve opcional pero no rompe nada dejarlo.

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
npm run db:seed:billing  # Solo seed de billing — planes, suscripción, datos facturación (LOCAL)
npm run db:migrate       # Aplica migraciones Sequelize (LOCAL)
npm run db:migrate:undo  # Revierte última migración (LOCAL)

# ─── Railway (producción) — requiere railway CLI + estar vinculado al proyecto ───
npm run railway:seed          # Ejecuta todos los seeders en Railway
npm run railway:seed:rbac     # Solo RBAC en Railway
npm run railway:seed:estados  # Solo estados en Railway
npm run railway:seed:turnos   # Solo turnos en Railway
npm run railway:seed:billing  # Solo billing en Railway
npm run railway:migrate       # Aplica migraciones en Railway
npm run railway:migrate:undo  # Revierte última migración en Railway

# ⚠️ railway:seed:billing NO funciona directamente (DB_HOST interno no resuelve desde local)
# Usar en su lugar:
# railway run --service citizen_security_db node --input-type=module <<'EOF'
# import { URL as U } from 'url'; const u = new U(process.env.MYSQL_PUBLIC_URL);
# process.env.DB_HOST=u.hostname; process.env.DB_PORT=u.port;
# process.env.DB_USER=decodeURIComponent(u.username);
# process.env.DB_PASSWORD=decodeURIComponent(u.password);
# process.env.DB_NAME=u.pathname.slice(1); process.env.DB_DIALECT='mysql';
# const { seedBilling } = await import('./src/seeders/seedBilling.js'); await seedBilling();
# EOF
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
│   ├── checkSuscripcion.js     # Bloqueo 503 por suscripción suspendida + caché 5 min
│   ├── rateLimitMiddleware.js
│   ├── handleValidationErrors.js
│   └── auditoriaAccionMiddleware.js
├── validators/                 # express-validator chains (un archivo por entidad)
├── services/
│   ├── geocodingService.js
│   ├── operativosHelperService.js
│   ├── reportesOperativosService.js
│   ├── metricasService.js      # Cálculo de métricas mensuales (usuarios activos + novedades + excedentes)
│   └── facturaService.js       # Generación de factura: numeración, IGV, PDF placeholder, Supabase Storage
├── seeders/
│   ├── seedRBAC.js             # Roles, permisos y usuario admin inicial
│   ├── seedEstadosNovedad.js
│   ├── seedOperativosTurno.js
│   ├── seedPatrullaje.js       # Permisos patrullaje.sereno.read / patrullaje.conductor.read
│   └── seedBilling.js          # 3 planes + 1 suscripción Premium + datos_facturacion
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

# Billing (SPEC-BILLING-001 / SPEC-BILLING-002)
FACTURA_SERIE=F001
FACTURA_DIAS_VENCIMIENTO=30
IGV_PORCENTAJE=18
PLAN_INICIAL=3                        # ID del plan inicial para el seeder
FACTURA_EMISOR_RAZON_SOCIAL=MICROHELP E.I.R.L.
FACTURA_EMISOR_RUC=20265884564
FACTURA_EMISOR_DIRECCION=JR. HUASCAR NRO. 1675 JESUS MARIA
FACTURA_BANCO_NOMBRE=SCOTIABANK
FACTURA_BANCO_CUENTA=...
FACTURA_BANCO_CCI=...
BILLING_CRON_ENABLED=true              # job node-cron activo en producción
BILLING_CRON_DIA_CIERRE=1
```

> Estas variables están configuradas tanto en `city_sec_backend` (Railway, MySQL) como en `city_secure_backend_supabase` (Railway, proyecto `CitySecure_Supabase`, Postgres/Supabase). `FACTURA_BANCO_*` están confirmadas en el service MySQL; pendiente sincronizarlas también al service Supabase.

---

## Sistema RBAC

@docs/claude/rbac.md

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
| `/api/v1/patrullaje` | Turno activo del sereno (APK city_sec_patrol) |
| `/api/v1/billing` | Planes, suscripción, métricas y facturación (solo `super_admin`) |
| `/api/v1/health` | Health check |

---

## Convenciones de Código y Archivos Clave

@docs/claude/convenciones-codigo.md

---

## Módulo Patrullaje — Turno Activo del Sereno (TD-P-005)

@docs/claude/patrullaje-turno-activo.md

---

## Módulo Billing — Planes, Suscripción y Facturación (SPEC-BILLING-001 / SPEC-BILLING-002)

### Archivos clave

| Archivo | Propósito |
|---|---|
| `migrations/021_billing_tables.sql` | 5 tablas MySQL: `planes`, `suscripciones`, `metricas_uso`, `facturas`, `datos_facturacion` |
| `supabase/migrations/022_billing_tables.sql` | Mismas 5 tablas en Postgres/Supabase, schema `citysecure` (`SERIAL`, `JSONB`, `TIMESTAMPTZ`, `CHECK` en vez de ENUM) + RLS habilitado |
| `src/models/Plan.js` · `Suscripcion.js` · `MetricasUso.js` · `Factura.js` · `DatosFacturacion.js` | Modelos Sequelize con `schema: DB_SCHEMA` — funcionan sin cambios en ambos dialectos |
| `src/middlewares/checkSuscripcion.js` | Bloquea con 503 si `estado='suspendida'`; caché 5 min; exporta `invalidarCacheCheckSuscripcion()` |
| `src/services/metricasService.js` | `calcularMetricasPeriodo(suscripcionId, 'YYYY-MM')` — usuarios activos (tokens_acceso) + novedades + excedentes |
| `src/services/facturaService.js` | `generarFactura(suscripcionId, 'YYYY-MM', opciones)` — numeración, IGV 18%, PDF con pdfkit, sube a Supabase Storage bucket `facturas`, envía email con PDF adjunto vía Resend |
| `src/controllers/billingController.js` | 12 handlers para todos los endpoints |
| `src/routes/billing.routes.js` | 12 rutas bajo `/billing` — todas `verificarRolesOPermisos(["super_admin"], [])` |
| `src/validators/billingValidator.js` | Validators para todos los endpoints |
| `src/seeders/seedBilling.js` | Idempotente: 3 planes + 1 suscripción activa + 1 datos_facturacion |
| `src/cron/billingCron.js` (node-cron) | Genera factura automáticamente el día `BILLING_CRON_DIA_CIERRE` de cada mes a las 00:00 America/Lima |

### Montaje en app.js

`checkSuscripcion` se aplica globalmente antes del router de API:
```js
app.use(`/api/${API_VERSION}`, checkSuscripcion, indexRoutes);
```
Rutas excluidas del bloqueo: `/health`, `/auth/login`, `/auth/refresh`, `/ciudadanos/*`.

### Estado del módulo

- ✅ **PDF con pdfkit** — bucket privado `facturas` con signed URLs (`GET /billing/facturas/:id/pdf` redirige 302 a la URL firmada).
- ✅ **Email de factura** — `enviarEmailFactura()` envía vía Resend con el PDF adjunto a `datos_facturacion.email_facturacion`.
- ✅ **Cron automático** — `BILLING_CRON_ENABLED=true` en producción (MySQL y Supabase); log de arranque: `billingCron: programado para el día 1 de cada mes a las 00:00 (America/Lima)`.
- ✅ **Datos bancarios** — `FACTURA_BANCO_NOMBRE/CUENTA/CCI` confirmados en el service MySQL; pendiente replicarlos al service Supabase.

### SPEC-BILLING-002 — Port a Supabase PostgreSQL (dual-dialect)

El mismo repo (`city_sec_backend_claude`) corre en dos proyectos Railway separados:

| Proyecto Railway | Service | BD | `DB_DIALECT` | `DB_SCHEMA` |
|---|---|---|---|---|
| `CitySecure` | `city_sec_backend` | MySQL Railway (`citizen_security_db`) | `mysql` | ignorado |
| `CitySecure_Supabase` | `city_secure_backend_supabase` | PostgreSQL Supabase | `postgres` | `citysecure` |

Ambos services comparten código y modelos Sequelize; solo difieren las variables de entorno (`DB_*`, `DB_DIALECT`, `DB_SCHEMA`, Supabase Storage). El cambio de modelo necesario para soportar ambos fue en `Plan.js`:

- `activo`: `DataTypes.TINYINT` → `DataTypes.BOOLEAN` (compatible con `BOOLEAN` de Postgres y `TINYINT(1)` de MySQL).
- Getter de `features`: maneja tanto `JSONB` (Postgres devuelve objeto) como `TEXT` (MySQL devuelve string JSON):
  ```js
  get() {
    const raw = this.getDataValue("features");
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }
  ```

**Ejecución de la migration en Supabase** (sin MCP `execute_sql` disponible en esta sesión, se usó el CLI ya autenticado vía `supabase login`):
```bash
supabase db query --linked -f supabase/migrations/022_billing_tables.sql
```

**Seeder y verificación contra Supabase** — proyecto y service distintos al linkeado por defecto, usar `-p`/`-s`/`-e`:
```bash
railway run -p <project_id_CitySecure_Supabase> -s city_secure_backend_supabase -e production npm run db:seed:billing
```

### Trampa: `npm ci` en Dockerfile

Al agregar paquetes nuevos (`npm install <pkg>`), siempre commitear `package-lock.json` junto con `package.json`. El Dockerfile de Railway usa `npm ci` que falla si el lockfile no está sincronizado.

---

## Soporte Dual Dialecto y Trampas Conocidas (DB / Express / Railway)

@docs/claude/db-trampas.md

---

## Restricciones, Seguridad y Credenciales

@docs/claude/seguridad.md

---

## Contexto en la Arquitectura Global

Este backend es consumido por:
- `city_sec_frontend_v2` — dashboard de serenazgo (SPA React)
- `city_sec_voice_gateway` — microservicio que crea novedades desde reportes ciudadanos

Ver `/mnt/d/robles/Project/CLAUDE.md` para el diagrama completo de la arquitectura.
