# PRD — Sistema de Seguridad Ciudadana (CitySec Backend)

**Versión:** 2.6.0
**Fecha:** 2026-05-25
**Estado:** Producción activa — desarrollo incremental
**Stakeholders primarios:** Área de Tecnología Municipal, Coordinación de Serenazgo
**Deploy:** `https://citysecbackendclaude-production.up.railway.app`

---

## 1. Visión y Contexto

### 1.1 Propósito

CitySec Backend es el núcleo de un sistema de gestión de operaciones de seguridad ciudadana para municipalidades. Provee la API REST que centraliza la gestión de incidentes, operativos de patrullaje, recursos (personal y vehículos) y la inteligencia geográfica necesaria para la toma de decisiones en tiempo real de un cuerpo de serenazgo.

### 1.2 Problema que resuelve

Los cuerpos de serenazgo operan con información dispersa: partes en papel, planillas de Excel, radios sin trazabilidad, y sin correlación entre incidentes y recursos desplegados. Esto produce:

- Imposibilidad de medir tiempos de respuesta reales
- Duplicación de recursos en zonas de bajo riesgo mientras otras quedan sin cobertura
- Falta de trazabilidad para rendición de cuentas
- Reportes operacionales que tardan días en consolidarse

### 1.3 Solución

Una API centralizada y estructurada que actúa como sistema de registro único (`single source of truth`) para todas las operaciones, con:

- Gestión de incidentes con workflow de estados
- Registro de operativos con asignación precisa de recursos a cuadrantes
- Dirección normalizada con asignación automática de cobertura geográfica
- Reportes y métricas operacionales exportables
- Control de acceso granular por rol
- Recuperación de contraseña via email (Resend SDK)
- Auditoría completa de acciones del sistema

---

## 2. Usuarios y Roles

### 2.1 Roles del Sistema

| Rol | Nivel | Descripción | Acceso típico |
|-----|-------|-------------|---------------|
| `super_admin` | 5 | Administrador de plataforma | Todo, incluyendo configuración de sistema |
| `admin` | 4 | Jefe de Serenazgo / TI municipal | Gestión completa de recursos y usuarios |
| `supervisor` | 3 | Supervisor de turno | Operativos, novedades, reportes, auditoría |
| `operador` | 2 | Central de comunicaciones | Registro de novedades, consulta de recursos |
| `consulta` | 1 | Analista / auditor | Solo lectura de datos y reportes |
| `usuario_basico` | 0 | Ciudadano / portal externo | Acceso mínimo (futuro) |

### 2.2 Modelo de Permisos

Formato: `module.resource.action`

Ejemplos:
- `usuarios.usuarios.read` — Listar usuarios
- `operativos.turnos.create` — Crear turnos
- `novedades.novedades.update_estado` — Cambiar estado de incidentes

Los permisos son aditivos: un rol hereda sus permisos base y puede recibir permisos adicionales individuales por usuario.

**Regla especial:** `super_admin` tiene bypass completo en todas las verificaciones de permisos de campo (field-level RBAC). No requiere slugs individuales asignados en BD.

**Consultar slugs vigentes en BD** (usar antes de implementar cualquier `requirePermission`):
```sql
SELECT slug, descripcion FROM railway.permisos ORDER BY slug;
-- filtrar por módulo:
SELECT slug, descripcion FROM railway.permisos WHERE slug LIKE 'vehiculos.%' ORDER BY slug;
```

### 2.3 Permisos granulares de adjuntos (v2.5.0)

Control de acceso a nivel de campo sobre los adjuntos multimedia de novedades:

| Slug | Recurso | Efecto en backend |
|------|---------|-------------------|
| `novedades.fotos.viewer` | Fotos | Expone `fotos_adjuntas` en la respuesta JSON |
| `novedades.fotos.downloader` | Fotos | Solo frontend — controla botón descarga |
| `novedades.audio.player` | Audio | Expone `parte_adjuntos` en la respuesta JSON |

**Política por rol:**

| Rol | `viewer` | `downloader` | `player` |
|-----|:--------:|:------------:|:--------:|
| `super_admin` | ✅ bypass | ✅ bypass | ✅ bypass |
| `admin` | ✅ | ✅ | ✅ |
| `supervisor` | ✅ | ✅ | ✅ |
| `operador` | ✅ | ❌ | ✅ |
| `consulta` | ✅ | ❌ | ✅ |
| `usuario_basico` | ❌ | ❌ | ❌ |

---

## 3. Dominio de Negocio

### 3.1 Entidades principales

```
Geografía:
  Ubigeo (Departamento → Provincia → Distrito)
    └─ Sector
         └─ Subsector
              └─ Cuadrante
                   └─ Tramo de Calle (CallesCuadrantes)
                        └─ Dirección

Recursos:
  PersonalSeguridad
  Vehiculo
  RadioTetra
  Taller

Operaciones:
  OperativosTurno (turno de patrullaje)
    ├─ OperativosVehiculos → OperativosVehiculosCuadrantes → OperativosVehiculosNovedades
    └─ OperativosPersonal → OperativosPersonalCuadrantes  → OperativosPersonalNovedades

Incidentes:
  TipoNovedad → SubtipoNovedad
  Novedad → HistorialEstadoNovedad

Seguridad y auditoría:
  AuditoriaAccion  (registro de todas las acciones del sistema)
  PasswordReset    (tokens de recuperación de contraseña)

Soporte operacional:
  AbastecimientoCombustible / Grifo
  MantenimientoVehiculo / Taller
  HorariosTurnos
  UnidadOficina (SERENAZGO, PNP, BOMBEROS, AMBULANCIA)
```

### 3.2 Jerarquía geográfica

La unidad operacional mínima es el **Cuadrante**. Todo incidente, vehículo y efectivo es asignado a un cuadrante.

### 3.3 Ciclo de vida de una novedad (incidente)

```
PENDIENTE/REPORTADA → DESPACHADA → EN RUTA → EN LUGAR → EN ATENCIÓN → RESUELTA → CERRADA
        ↓                                                                    ↓
   (NO ATENDIDA)                                                         DERIVADA
                                                                             ↓
                                                                         CANCELADA
```

La transición entre estados está restringida por rol via `RolEstadoNovedad`.

**Criterio "No Atendidas":** `estado_novedad_id = (SELECT id FROM estados_novedad WHERE es_inicial = 1)`. No se usa presencia/ausencia en tablas de operativos.

---

## 4. Arquitectura Técnica

### 4.1 Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js ≥ 18.0.0 (ES Modules) |
| Framework | Express.js 5.x |
| ORM | Sequelize 6.x |
| Base de datos | MySQL 8.0+ (Railway) |
| Autenticación | JWT (access token 1h + refresh token 7d) |
| Hashing | bcryptjs |
| Email | Resend SDK (primario) + Nodemailer SMTP (fallback) |
| Validación | express-validator |
| Documentación | Swagger UI |
| Logging | Winston + Morgan |
| Exportación | ExcelJS |
| Seguridad HTTP | Helmet |
| Testing | Jest + Supertest |
| Deploy | Railway (railway.toml) |

### 4.2 Variables de entorno requeridas

```env
NODE_ENV=development|production
PORT=3000
API_VERSION=v1

# Base de datos
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=citizen_security_v2
DB_PORT=3306

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# CORS / Frontend
FRONTEND_URL=http://localhost:5173          # URL interna (puede ser .railway.internal)
FRONTEND_PUBLIC_URL=https://mi-app.com     # URL pública para links en emails — OBLIGATORIA

# Email — Resend SDK (preferido en Railway; SMTP está bloqueado)
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=notificaciones@midominio.com
RESEND_FROM_NAME=CitySecure

# Email — Fallback SMTP (si no hay RESEND_API_KEY)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Auth
BCRYPT_ROUNDS=10
```

### 4.3 Trampas conocidas de producción (Railway + Express 5)

> Ver sección completa en `CLAUDE.md`. Resumen:

| Trampa | Causa | Fix |
|---|---|---|
| Express 5 wildcard `"*"` | `path-to-regexp` v8 no acepta wildcard sin nombre | Usar `/(.*)/` o `/{*name}` |
| `pool.min > 0` | Sequelize abre TCP al importar; DB no lista en cold start | Hardcodear `POOL_MIN = 0` |
| `uncaughtException` al final | Si hay throw antes del handler, muere silencioso | Mover a las primeras líneas después de imports |
| Swagger sin try/catch | `readFileSync` puede fallar sincrónicamente | Envolver en try/catch |
| `app.listen()` dentro de async | El healthcheck falla si se espera a la DB para levantar HTTP | Levantar HTTP primero; DB conecta async |
| SMTP bloqueado en Railway | Railway bloquea puertos 25/465/587 | Usar Resend SDK (HTTPS 443) |
| `FRONTEND_URL` interno | `.railway.internal` no es accesible desde emails | Usar `FRONTEND_PUBLIC_URL` para links en emails |

### 4.4 railway.toml

```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 120
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

## 5. Módulos y Endpoints

### 5.1 Resumen de módulos

| Módulo | Base URL | Descripción |
|--------|----------|-------------|
| Autenticación | `/api/v1/auth` | Login, tokens, recuperación de contraseña |
| Usuarios | `/api/v1/usuarios` | Gestión de cuentas de sistema |
| Roles | `/api/v1/roles` | RBAC roles |
| Permisos | `/api/v1/permisos` | RBAC permisos granulares |
| Novedades | `/api/v1/novedades` | Incidentes de seguridad |
| Personal | `/api/v1/personal` | Efectivos de serenazgo |
| Vehículos | `/api/v1/vehiculos` | Flota vehicular |
| Sectores | `/api/v1/sectores` | Zonas operacionales |
| Subsectores | `/api/v1/subsectores` | Subdivisiones de sector |
| Cuadrantes | `/api/v1/cuadrantes` | Unidad geográfica mínima |
| Tipos de Vía | `/api/v1/tipos-via` | Catálogo (Av, Jr, Ca, etc.) |
| Calles | `/api/v1/calles` | Maestro de vías |
| Calles-Cuadrantes | `/api/v1/calles-cuadrantes` | Tramos de calle por cuadrante |
| Direcciones | `/api/v1/direcciones` | Direcciones normalizadas |
| Operativos (turnos) | `/api/v1/operativos-turno` | Turnos de patrullaje |
| Operativos vehiculares | `/api/v1/operativos-vehiculos` | Vehículos por operativo |
| Operativos personal | `/api/v1/operativos-personal` | Personal por operativo |
| Reportes operativos | `/api/v1/reportes-operativos` | Métricas y exportaciones |
| Catálogos | `/api/v1/catalogos` | Datos maestros varios |
| Radios TETRA | `/api/v1/radios-tetra` | Equipos de radiocomunicación |
| Abastecimientos | `/api/v1/abastecimientos` | Registro de combustible |
| Grifos | `/api/v1/grifos` | Proveedores de combustible |
| Mantenimientos | `/api/v1/mantenimientos` | Mantenimiento vehicular |
| Talleres | `/api/v1/talleres` | Talleres mecánicos |
| Ubigeo | `/api/v1/ubigeo` | Geografía Perú (1,875 registros) |
| Auditoría | `/api/v1/auditoria` | Logs de acciones del sistema |
| Horarios de turno | `/api/v1/horarios-turnos` | Horarios disponibles |

### 5.2 Endpoints críticos de negocio

#### Autenticación
```
POST /api/v1/auth/login                → { accessToken, refreshToken, user }
POST /api/v1/auth/refresh              → { accessToken }
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password      → Envía email con link de reset (Resend SDK)
POST /api/v1/auth/reset-password       → Valida token + actualiza contraseña
GET  /api/v1/auth/profile
```

**Flujo recuperación de contraseña:**
1. Frontend POST `/auth/forgot-password` con `{ email }`
2. Backend busca usuario, genera token en `password_resets`, envía email via Resend SDK
3. Email incluye link `FRONTEND_PUBLIC_URL/reset-password?token=xxx&email=yyy`
4. Frontend POST `/auth/reset-password` con `{ token, email, newPassword }`
5. Backend valida token, actualiza contraseña, invalida token

El backend **siempre responde 200** aunque el email no exista (no revelar existencia).

#### Auditoría
```
GET /api/v1/auditoria                        → Lista paginada con filtros
GET /api/v1/auditoria/stats                  → Estadísticas agregadas
GET /api/v1/auditoria/mi-actividad           → Actividad del usuario actual
GET /api/v1/auditoria/export/csv             → CSV hasta 10,000 registros
GET /api/v1/auditoria/entidad/:entidad/:id   → Historial de una entidad
GET /api/v1/auditoria/:id                    → Registro individual
```

**Acceso:** `supervisor`, `admin`, `super_admin`

**Filtros disponibles en `GET /api/v1/auditoria`:**
`fecha_inicio`, `fecha_fin`, `usuario_id`, `accion`, `entidad_tipo`, `modulo`, `severidad`, `resultado`, `page`, `limit` (máx 100)

**Valores válidos:**
- `accion`: CREATE | UPDATE | DELETE | LOGIN | LOGOUT | LOGIN_FAILED | PASSWORD_CHANGE | EXPORT | IMPORT | VIEW
- `severidad`: BAJA | MEDIA | ALTA | CRITICA
- `resultado`: EXITO | FALLO | DENEGADO *(nota: el enum en BD usa estos valores, no EXITOSO/FALLIDO/PARCIAL)*

#### Novedades (core del negocio)
```
GET    /api/v1/novedades                          → Lista paginada con filtros
GET    /api/v1/novedades/dashboard/stats          → KPIs del tablero
GET    /api/v1/novedades/:id                      → Detalle con historial de estados
POST   /api/v1/novedades                          → Crear incidente
PUT    /api/v1/novedades/:id                      → Actualizar
POST   /api/v1/novedades/:id/cambiar-estado       → Transición de estado (RBAC)
GET    /api/v1/novedades/:id/historial-estados    → Trazabilidad completa
DELETE /api/v1/novedades/:id                      → Soft delete
```

#### Operativos
```
POST /api/v1/operativos-turno
GET  /api/v1/operativos-turno/combinados
POST /api/v1/operativos-vehiculos/:turnoId/vehiculos
POST /api/v1/operativos-vehiculos/:turnoId/vehiculos/:vId/cuadrantes
POST /api/v1/operativos-personal/:turnoId/personal
POST /api/v1/operativos-personal/:turnoId/personal/:pId/cuadrantes
```

#### Reportes
```
GET /api/v1/reportes-operativos/vehiculares
GET /api/v1/reportes-operativos/vehiculares/resumen
GET /api/v1/reportes-operativos/vehiculares/exportar
GET /api/v1/reportes-operativos/combinados
GET /api/v1/reportes-operativos/combinados/exportar
GET /api/v1/reportes-operativos/novedades-no-atendidas
GET /api/v1/reportes-operativos/dashboard
```

---

## 6. Requerimientos No Funcionales

### 6.1 Seguridad

- Todas las rutas requieren JWT válido (excepto `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/health`, catálogos públicos)
- Tokens de acceso: 1h; refresh: 7d
- Contraseñas hasheadas con bcryptjs (10 rounds mínimo)
- Headers de seguridad via Helmet
- CORS restringido a origins configurados
- `AuditoriaAccion` registra toda acción de escritura con usuario, IP, entidad y payload diferencial
- Railway bloquea puertos SMTP — usar Resend SDK para emails

### 6.2 Performance

- `pool.min = 0` hardcodeado (lazy pool — no abre TCP en import)
- Paginación obligatoria en endpoints de listado
- Índices en `auditoria_acciones`: `created_at`, `usuario_id`, `accion`, `modulo`, `severidad`, `resultado`, `(entidad_tipo, entidad_id)`, `(usuario_id, created_at)`

### 6.3 Observabilidad

- Logs de requests via Morgan
- Logs de aplicación via Winston
- `GET /health` — respuesta liviana sin DB, usado por Railway healthcheck
- `GET /api/v1/health` — con estado de DB
- Audit trail completo en `AuditoriaAccion`

### 6.4 Deploy (Railway)

- HTTP server levanta **antes** que la conexión a DB (healthcheck no depende de DB)
- `process.on("uncaughtException")` al inicio del `app.js` (antes de cualquier setup)
- Swagger en try/catch (no fatal si falla)
- `railway.toml` con healthcheckPath `/health`, timeout 120s

---

## 7. Bugs conocidos / corregidos

### v2.6.0 (2026-05-25)

| Bug | Causa | Fix |
|---|---|---|
| `GET /auditoria/:id` devuelve 500 | `const AuditoriaAccion = await AuditoriaAccion.findByPk(...)` — variable shadowing causa ReferenceError (Temporal Dead Zone) | Renombrada a `const registro` en `auditoriaAccionController.js` |
| Email de reset apunta a URL interna | `FRONTEND_URL` en Railway apunta a `.railway.internal` | Nueva variable `FRONTEND_PUBLIC_URL` para links en emails |
| Email 30s timeout | Puertos SMTP bloqueados en Railway; nodemailer espera 30s antes de tirar error | Migración a Resend SDK (HTTPS 443) + timeouts explícitos en nodemailer como fallback |
| Deploy crashea silenciosamente | `app.options("*")` lanza TypeError en Express 5 (`path-to-regexp` v8 no acepta wildcard suelto) | `app.options(/(.*)/,  cors(corsOptions))` |

---

## 8. Roadmap y Features Pendientes

### 8.1 Estado actual (v2.6.0)

- [x] RBAC completo con permisos granulares
- [x] Gestión de novedades con workflow de estados
- [x] Operativos vehiculares y peatonales
- [x] Sistema de direcciones dual (municipal + Mz/Lote)
- [x] Reportes de operativos vehiculares
- [x] Exportación Excel/CSV
- [x] Auditoría de acciones (`AuditoriaAccion`) con panel de consulta en frontend
- [x] Gestión de combustible y mantenimientos
- [x] TETRA radio management
- [x] Swagger UI
- [x] Health check endpoint (liviano, sin DB)
- [x] Adjuntos multimedia en novedades (fotos y audio desde app vecino alerta)
- [x] RBAC field-level para adjuntos
- [x] Integración voice_gateway
- [x] Reporte combinado exportar
- [x] Fix criterio novedades no atendidas (solo estado PENDIENTE)
- [x] **Recuperación de contraseña** — forgot-password + reset-password + email via Resend SDK
- [x] **Fix deploy Railway** — Express 5 wildcard, pool.min=0, uncaughtException al inicio, swagger try/catch

### 8.2 Features identificadas para implementar

#### Seguridad (alta prioridad)
- [ ] Registro de intentos de login fallidos en `login_intentos` (3 TODOs en `authController.js`)
- [ ] Refresh token persistido en `tokens_acceso` (3 TODOs en `authController.js`)
- [ ] Sesión eliminada al logout en tabla `sesiones` (TODO en `authController.js`)
- [ ] Historial de contraseñas en `password_historial` (evitar reutilización)

#### Reportes ampliados
- [ ] Dashboard de cobertura geográfica (heatmap por cuadrante)
- [ ] Reporte de tiempos de respuesta por tipo de novedad
- [ ] Métricas de efectivo: novedades atendidas, horas operativas

#### Tiempo real
- [x] Notificaciones SSE para despacho de novedades
- [ ] Tracking de posición de vehículos en tiempo real
- [ ] WebSocket para actualización de estado de operativos

#### Integraciones externas
- [x] Integración voice_gateway
- [ ] Integración con sistema PNP
- [ ] API pública ciudadana

### 8.3 Deuda técnica conocida

- [ ] Tests unitarios e integración: cobertura parcial
- [ ] Swagger desactualizado en endpoints nuevos (forgot-password, reset-password, auditoría)
- [ ] Validador de `resultado` en `GET /auditoria` acepta EXITOSO/FALLIDO/PARCIAL pero el ENUM de BD es EXITO/FALLO/DENEGADO — inconsistencia sin impacto actual (todos los registros son EXITO)
- [ ] Seeder `seedRBAC.js` debe re-ejecutarse en BD de producción para los 3 slugs de adjuntos

---

## 9. Historial de versiones

| Versión | Fecha | Cambios principales |
|---------|-------|---------------------|
| 2.6.0 | 2026-05-25 | Recuperación de contraseña (forgot + reset) con Resend SDK; fix crítico deploy Railway (Express 5 wildcard, pool.min, uncaughtException); fix 500 en GET /auditoria/:id (variable shadowing); nueva variable FRONTEND_PUBLIC_URL |
| 2.5.0 | 2026-05-21 | Adjuntos multimedia en novedades; RBAC field-level; integración voice_gateway; reporte combinado exportar; fix novedades no atendidas |
| 2.4.x | 2026-05-13 | Sistema de direcciones dual; módulo calles/cuadrantes v2; SSE tiempo real; reportes operativos fase 1 |

---

## 10. Credenciales de Desarrollo

### Admin inicial (seed)
```
username: admin
email:    admin@citysec.com
password: Admin123!
rol:      super_admin
```

### Endpoints de referencia
```
GET /health          → Healthcheck liviano (Railway)
GET /api/v1/health   → Health con estado de DB
GET /api/v1/docs     → Swagger UI
GET /api/v1/         → Info API y módulos
```

---

## 11. Glosario de Dominio

| Término | Definición |
|---------|-----------|
| Novedad | Incidente de seguridad ciudadana reportado |
| Operativo | Turno de patrullaje con recursos asignados |
| Cuadrante | Zona geográfica mínima de patrullaje |
| Serenazgo | Cuerpo de seguridad ciudadana municipal |
| TETRA | Sistema de radio digital trunking para seguridad |
| Grifo | Estación de combustible/gasolinera |
| Personal peatonal | Efectivo que patrulla a pie |
| Mz/Lote | Sistema de dirección informal en urbanizaciones |
| Ubigeo | Código geográfico del Perú (INEI) |
| Cargo | Puesto o posición laboral del efectivo |
| Unidad Oficina | Institución operacional (SERENAZGO, PNP, BOMBEROS, AMBULANCIA) |
| Auditoría | Registro automático de toda acción del sistema en `auditoria_acciones` |
