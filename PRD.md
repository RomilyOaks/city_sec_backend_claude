# PRD — Sistema de Seguridad Ciudadana (CitySec Backend)

**Versión:** 2.4.x  
**Fecha:** 2026-05-13  
**Estado:** Producción activa — desarrollo incremental  
**Stakeholders primarios:** Área de Tecnología Municipal, Coordinación de Serenazgo

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

---

## 2. Usuarios y Roles

### 2.1 Roles del Sistema

| Rol | Nivel | Descripción | Acceso típico |
|-----|-------|-------------|---------------|
| `super_admin` | 5 | Administrador de plataforma | Todo, incluyendo configuración de sistema |
| `admin` | 4 | Jefe de Serenazgo / TI municipal | Gestión completa de recursos y usuarios |
| `supervisor` | 3 | Supervisor de turno | Operativos, novedades, reportes |
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

Operaciones:
  OperativosTurno (turno de patrullaje)
    ├─ OperativosVehiculos → OperativosVehiculosCuadrantes → OperativosVehiculosNovedades
    └─ OperativosPersonal → OperativosPersonalCuadrantes  → OperativosPersonalNovedades

Incidentes:
  TipoNovedad → SubtipoNovedad
  Novedad → HistorialEstadoNovedad

Soporte operacional:
  AbastecimientoCombustible / Grifo
  MantenimientoVehiculo / Taller
  HorariosTurnos
  UnidadOficina (SERENAZGO, PNP, BOMBEROS, AMBULANCIA)
```

### 3.2 Jerarquía geográfica

La unidad operacional mínima es el **Cuadrante**. Todo incidente, vehículo y efectivo es asignado a un cuadrante. Los cuadrantes se agrupan en sectores para reportes y planificación de cobertura.

El **sistema de direcciones dual** permite registrar tanto:
- Direcciones municipales: `Av. Ejército 450`
- Sistemas informales: `Mz M Lote 15`

La dirección se valida contra la tabla `CallesCuadrantes` (rangos de numeración por tramo) para asignación automática de cuadrante y sector.

### 3.3 Ciclo de vida de una novedad (incidente)

```
REPORTADA → EN_PROCESO → ATENDIDA → CERRADA
               ↓
           DERIVADA (a otra unidad: PNP, Bomberos)
               ↓
           CANCELADA
```

La transición entre estados está restringida por rol via `RolEstadoNovedad`. Un `operador` puede reportar y poner en proceso, pero solo un `supervisor` puede cerrar o derivar.

### 3.4 Estructura de un Operativo

Un `OperativosTurno` agrupa todos los recursos desplegados en un turno:

1. Se crea el turno (fecha, horario, supervisor responsable)
2. Se asignan vehículos → a cada vehículo se le asignan cuadrantes
3. Se asigna personal peatonal → a cada efectivo se le asignan cuadrantes
4. Las novedades (incidentes) se vinculan al recurso que las atendió
5. Al cierre del turno se generan métricas: incidentes atendidos, cobertura, tiempos

---

## 4. Arquitectura Técnica

### 4.1 Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js ≥ 18.0.0 (ES Modules) |
| Framework | Express.js 5.x |
| ORM | Sequelize 6.x |
| Base de datos | MySQL 8.0+ |
| Autenticación | JWT (access token 1h + refresh token 7d) |
| Hashing | bcryptjs |
| OAuth2 | Passport.js (Google, Microsoft) |
| 2FA | Speakeasy (TOTP) |
| Validación | express-validator |
| Documentación | Swagger UI (swagger-jsdoc) |
| Logging | Winston + Morgan |
| Exportación | ExcelJS |
| Seguridad HTTP | Helmet |
| Testing | Jest + Supertest |
| Deploy | Railway (railway.toml) |

### 4.2 Estructura de directorios

```
src/
├── app.js                    # Entry point, middleware stack, route loader
├── config/
│   └── database.js           # Sequelize config (dev/test/prod), pooling, retry
├── models/                   # 45+ modelos Sequelize
├── controllers/              # Lógica de negocio por recurso (45+)
├── routes/                   # Definición de rutas por módulo (45+)
│   └── index.routes.js       # Registro centralizado de todas las rutas
├── services/
│   ├── geocodingService.js   # Manejo de coordenadas GPS
│   ├── operativosHelperService.js
│   └── reportesOperativosService.js
├── middlewares/
│   ├── auth.middleware.js    # Verificación JWT
│   └── permission.middleware.js # Verificación RBAC
├── validators/               # Esquemas express-validator por recurso
├── utils/                    # Helpers compartidos
├── constants/                # Constantes de dominio
└── seeders/                  # Datos iniciales (roles, permisos, admin)
```

### 4.3 Variables de entorno requeridas

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
DB_LOGGING=false

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Auth
BCRYPT_ROUNDS=10
TWO_FACTOR_APP_NAME=Seguridad Ciudadana

# OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 4.4 Patrones de implementación establecidos

**Soft deletes:** Todas las entidades operacionales tienen `deleted_at` y pueden ser restauradas. Nunca usar `DELETE` físico en producción.

**Auditoría:** Toda acción de escritura se registra en `AuditoriaAccion` con usuario, IP, entidad y payload diferencial.

**Paginación estándar:** Todos los endpoints de listado aceptan `?page=1&limit=20` y responden con `{ data: [], total, page, totalPages }`.

**Respuesta de error estándar:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": []
}
```

**Respuesta de éxito estándar:**
```json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa"
}
```

**Middleware de permisos:**
```js
router.get('/', authenticate, authorize('modulo.recurso.read'), controller.list)
```

---

## 5. Módulos y Endpoints

### 5.1 Resumen de módulos

| Módulo | Base URL | Descripción |
|--------|----------|-------------|
| Autenticación | `/api/v1/auth` | Login, registro, tokens, 2FA |
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
| Operativos (turnos) | `/api/v1/operativos` | Turnos de patrullaje |
| Operativos vehiculares | `/api/v1/operativos-vehiculos` | Vehículos por operativo |
| Operativos personal | `/api/v1/operativos-personal` | Personal por operativo |
| Reportes | `/api/v1/reportes-operativos` | Métricas y exportaciones |
| Catálogos | `/api/v1/catalogos` | Datos maestros varios |
| Radios TETRA | `/api/v1/radios-tetra` | Equipos de radiocomunicación |
| Abastecimientos | `/api/v1/abastecimientos` | Registro de combustible |
| Grifos | `/api/v1/grifos` | Proveedores de combustible |
| Mantenimientos | `/api/v1/mantenimientos` | Mantenimiento vehicular |
| Talleres | `/api/v1/talleres` | Talleres mecánicos |
| Ubigeo | `/api/v1/ubigeo` | Geografía Perú |
| Auditoría | `/api/v1/auditoria` | Logs de acciones |
| Configuración | `/api/v1/config` | Configuración del sistema |
| Horarios de turno | `/api/v1/horarios-turnos` | Horarios disponibles |

### 5.2 Endpoints críticos de negocio

#### Autenticación
```
POST /api/v1/auth/login          → { accessToken, refreshToken, user }
POST /api/v1/auth/refresh         → { accessToken }
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
GET  /api/v1/auth/profile
```

#### Novedades (core del negocio)
```
GET    /api/v1/novedades                          → Lista paginada con filtros
GET    /api/v1/novedades/dashboard/stats          → KPIs del tablero
GET    /api/v1/novedades/:id                      → Detalle con historial de estados
POST   /api/v1/novedades                          → Crear incidente
PUT    /api/v1/novedades/:id                      → Actualizar
POST   /api/v1/novedades/:id/cambiar-estado       → Transición de estado (RBAC)
POST   /api/v1/novedades/:id/asignar-recursos     → Asignar personal/vehículo
GET    /api/v1/novedades/:id/historial-estados    → Trazabilidad completa
DELETE /api/v1/novedades/:id                      → Soft delete
```

#### Operativos
```
POST /api/v1/operativos                                               → Crear turno
GET  /api/v1/operativos/combinados                                    → Vista unificada
POST /api/v1/operativos/:turnoId/vehiculos                            → Asignar vehículo
POST /api/v1/operativos/:turnoId/vehiculos/:vId/cuadrantes            → Asignar cuadrante
POST /api/v1/operativos/:turnoId/vehiculos/:vId/cuadrantes/:cId/novedades → Vincular novedad
POST /api/v1/operativos/:turnoId/personal                             → Asignar efectivo
POST /api/v1/operativos/:turnoId/personal/:pId/cuadrantes             → Asignar cuadrante
```

#### Direcciones (módulo v2.4.0)
```
POST /api/v1/direcciones/validar          → Validar sin persistir
POST /api/v1/calles-cuadrantes/buscar-cuadrante → Auto-asignación por número
GET  /api/v1/calles/autocomplete?q=       → Sugerencias de calle
GET  /api/v1/direcciones/stats/mas-usadas → Hot spots
PATCH /api/v1/direcciones/:id/geocodificar → Actualizar coordenadas GPS
```

#### Reportes
```
GET /api/v1/reportes-operativos/vehiculares              → Listado de operativos
GET /api/v1/reportes-operativos/vehiculares/resumen      → Estadísticas agregadas
GET /api/v1/reportes-operativos/vehiculares/exportar     → Descarga Excel/CSV
GET /api/v1/reportes-operativos/vehiculares/estadisticas → Analytics avanzados
GET /api/v1/reportes-operativos/vehiculares/metrics      → KPIs de rendimiento
```

---

## 6. Requerimientos No Funcionales

### 6.1 Seguridad

- Todas las rutas (excepto `/auth/login`, `/auth/register`, `/health`, catálogos públicos) requieren JWT válido
- Tokens de acceso expiran en 1h; refresh tokens en 7d
- Contraseñas hasheadas con bcryptjs (10 rounds mínimo)
- Rate limiting implícito via middleware de timeout (30s por request)
- Headers de seguridad via Helmet
- CORS restringido a origins whitelistados
- Registro de intentos de login fallidos en `LoginIntento`
- 2FA via TOTP disponible pero opcional

### 6.2 Performance

- Connection pooling configurado en `database.js`
- Compresión de respuestas habilitada
- Índices de base de datos en campos de búsqueda frecuente (fecha, sector, estado)
- Paginación obligatoria en endpoints de listado

### 6.3 Observabilidad

- Logs de requests via Morgan
- Logs de aplicación via Winston (niveles: error, warn, info, debug)
- Endpoint de health check: `GET /api/v1/health` → `{ status, db, uptime, memory }`
- Audit trail completo en `AuditoriaAccion`

### 6.4 Disponibilidad

- Graceful shutdown en SIGTERM/SIGINT
- Retry logic en conexión a base de datos (máx 3 intentos)
- Timeout de 30s por request (SSE excluido)

---

## 7. Especificaciones por Módulo para Desarrollo

### 7.1 Convenciones para nuevos módulos

Todo nuevo módulo debe seguir el patrón:

```
src/routes/[nombre].routes.js          → Definición de rutas con Swagger JSDoc
src/controllers/[nombre]Controller.js  → Lógica de negocio
src/models/[Nombre].js                 → Modelo Sequelize con timestamps y paranoid
src/validators/[nombre].validators.js  → Esquemas express-validator
```

Registro en `src/routes/index.routes.js`:
```js
import [nombre]Routes from './[nombre].routes.js'
router.use('/[nombre]', [nombre]Routes)
```

### 7.2 Plantilla de modelo Sequelize

```js
import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const NombreModelo = sequelize.define('NombreModelo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  // ... campos
  estado: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER },
  updated_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'nombre_tabla',
  paranoid: true,        // soft delete via deletedAt
  timestamps: true,      // createdAt, updatedAt, deletedAt
  underscored: true,     // snake_case en BD
})

export default NombreModelo
```

### 7.3 Plantilla de controlador

```js
export const list = async (req, res) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query
    const offset = (page - 1) * limit
    const { count, rows } = await Modelo.findAndCountAll({
      where: buildWhereClause(filters),
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    })
    return res.json({
      success: true,
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
```

### 7.4 Plantilla de ruta

```js
import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/permission.middleware.js'
import * as controller from '../controllers/nombreController.js'

const router = Router()

/**
 * @swagger
 * /api/v1/nombre:
 *   get:
 *     tags: [Nombre]
 *     summary: Listar recursos
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, authorize('modulo.recurso.read'), controller.list)

export default router
```

---

## 8. Roadmap y Features Pendientes

### 8.1 Estado actual (v2.4.x)

- [x] RBAC completo con permisos granulares
- [x] Gestión de novedades con workflow de estados
- [x] Operativos vehiculares y peatonales
- [x] Sistema de direcciones dual (municipal + Mz/Lote)
- [x] Auto-asignación de cuadrante por dirección
- [x] Reportes de operativos vehiculares (fase 1)
- [x] Exportación Excel/CSV
- [x] Auditoría de acciones
- [x] Gestión de combustible y mantenimientos
- [x] TETRA radio management
- [x] Swagger UI
- [x] Health check endpoint

### 8.2 Features identificadas para implementar

#### Fase 2 — Reportes ampliados
- [ ] Reportes de operativos peatonales (espejo de vehiculares)
- [ ] Reporte combinado: personal + vehículos por turno
- [ ] Dashboard de cobertura geográfica (heatmap por cuadrante)
- [ ] Exportación de gráficos (ya existe endpoint base)
- [ ] Reporte de tiempos de respuesta por tipo de novedad
- [ ] Métricas de efectivo: novedades atendidas, horas operativas

#### Fase 3 — Tiempo real
- [ ] Notificaciones SSE para despacho de novedades
- [ ] Tracking de posición de vehículos en tiempo real
- [ ] Alertas automáticas por tipo de novedad crítica
- [ ] WebSocket para actualización de estado de operativos

#### Fase 4 — Integraciones externas
- [ ] Integración con sistema PNP (derivación de novedades)
- [ ] Integración con Bomberos (novedades de emergencia)
- [ ] API pública ciudadana (portal de denuncias)
- [ ] Integración con cámaras de videovigilancia

#### Fase 5 — Analytics
- [ ] Predicción de zonas de riesgo (ML)
- [ ] Optimización de cobertura por cuadrante
- [ ] Historial de incidentes por dirección (reincidencia)
- [ ] Correlación novedad-tiempo-clima

### 8.3 Deuda técnica conocida

- [ ] Tests unitarios e integración: cobertura parcial
- [ ] Migración a TypeScript (consideración a largo plazo)
- [ ] Documentación Swagger incompleta en algunos endpoints nuevos
- [ ] Validadores pendientes para módulo de calles v2.4.0
- [ ] Índices de BD no revisados para queries de reportes complejos

---

## 9. Spec-Driven Development — Guía de Implementación

### 9.1 Proceso para nuevos features

1. **Spec primero:** Definir el endpoint en este PRD (sección 5 o 8) antes de codificar
2. **Modelo:** Crear o extender modelos Sequelize con migración
3. **Validador:** Definir reglas de validación en `/validators`
4. **Controlador:** Implementar lógica de negocio con manejo de errores estándar
5. **Ruta:** Registrar con middleware de auth/permisos + JSDoc Swagger
6. **Tests:** Escribir test de integración contra BD de test
7. **Actualizar PRD:** Marcar el feature como completado y actualizar el endpoint si cambió

### 9.2 Checklist para cada endpoint nuevo

- [ ] Autenticación requerida (`authenticate`)
- [ ] Permiso RBAC definido (`authorize('modulo.recurso.accion')`)
- [ ] Validación de input con express-validator
- [ ] Paginación si es listado
- [ ] Soft delete si aplica (no hard delete)
- [ ] Registro en AuditoriaAccion para escrituras
- [ ] Respuesta en formato estándar `{ success, data, message }`
- [ ] Swagger JSDoc documentado
- [ ] Test de integración

### 9.3 Naming conventions

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tabla BD | snake_case plural | `operativos_vehiculos` |
| Modelo Sequelize | PascalCase singular | `OperativosVehiculos` |
| Archivo modelo | PascalCase.js | `OperativosVehiculos.js` |
| Archivo controlador | camelCaseController.js | `operativosVehiculosController.js` |
| Archivo ruta | kebab-case.routes.js | `operativos-vehiculos.routes.js` |
| URL de endpoint | kebab-case plural | `/api/v1/operativos-vehiculos` |
| Permiso RBAC | dot.notation | `operativos.vehiculos.read` |

---

## 10. Credenciales de Desarrollo

### Admin inicial (seed)
```
username: admin
email: admin@citysec.com
password: Admin123!
rol: super_admin
```

### Endpoint de documentación
```
GET /api/v1/docs    → Swagger UI
GET /api/v1/health  → Health check
GET /api/v1/        → Info API y módulos disponibles
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
| Subsector | Subdivisión de sector para granularidad operativa |

---

*Documento generado el 2026-05-13. Mantener actualizado con cada release.*
