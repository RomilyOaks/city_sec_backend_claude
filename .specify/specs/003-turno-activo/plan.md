# Implementation Plan: TD-P-005 — Turno Activo del Sereno

**Branch**: `main` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)
**Input**: `.specify/specs/003-turno-activo/spec.md`

---

## Summary

Agregar el endpoint `GET /api/v1/patrullaje/turno-activo` al backend para que el APK
`city_sec_patrol` pueda obtener, al arrancar, el turno activo del sereno autenticado
junto con su vehículo y cuadrante asignados. Si no hay turno activo o no hay asignación,
responde `{ data: null }` — el APK usa ese valor para bloquear el GPS.

La implementación reutiliza la lógica de `horariosTurnosController.getHorarioActivo` y
consulta las tablas existentes `operativos_vehiculos` / `operativos_personal` a través
de `OperativosTurno`. No se crea ninguna tabla nueva.

---

## Technical Context

**Language/Version**: Node.js 18+ · ES Modules (`"type": "module"`)
**Primary Dependencies**: Express 5.2.1 · Sequelize 6 · jsonwebtoken
**Storage**: MySQL 8 (local/Railway secundaria) · PostgreSQL 15 Supabase (primaria) — dual dialect
**Testing**: Jest 29 + Supertest (manual para esta feature; tests automáticos fuera de scope)
**Target Platform**: Railway (Linux server) · :3000
**Project Type**: REST API web-service
**Performance Goals**: p95 < 500 ms (una sola solicitud al arranque del APK)
**Constraints**: Sin dependencias nuevas npm; compatible con ambos dialectos vía Sequelize ORM

---

## Constitution Check

| Gate | Estado | Justificación |
|---|---|---|
| Sin credenciales hardcodeadas | ✅ PASS | El seeder usa `process.env` + fallback no-secreto |
| ES Modules (import/export) | ✅ PASS | Todos los archivos nuevos usan `import`/`export` |
| Respuesta estándar `{ success, message, data }` | ✅ PASS | Aplicado en todos los casos |
| Soft delete (`deleted_at IS NULL`) | ✅ PASS | Sequelize `paranoid: true` en todos los modelos |
| No SQL raw | ✅ PASS | Todo vía Sequelize ORM — dual dialect garantizado |
| No tablas nuevas | ✅ PASS | Solo nuevas filas en `permisos` y `rol_permisos` |
| Push solo con confirmación del usuario | ✅ PASS | Sin CI/CD automático |
| `requirePermission` para autorización | ✅ PASS | `patrullaje.sereno.read` aplicado |

---

## Project Structure

### Documentation (esta feature)

```text
.specify/specs/003-turno-activo/
├── spec.md
├── plan.md              ← este archivo
├── research.md          ← decisiones de investigación
├── data-model.md        ← shape de la respuesta y joins
├── quickstart.md        ← cómo probar
├── contracts/
│   └── GET_patrullaje_turno_activo.md
└── tasks.md             ← generado por /speckit-tasks
```

### Source Code (archivos nuevos)

```text
src/
├── controllers/
│   └── patrullajeController.js     ← NUEVO: getTurnoActivo()
├── routes/
│   └── patrullaje.routes.js        ← NUEVO: GET /turno-activo
├── validators/
│   └── patrullaje.validator.js     ← NUEVO: (trivial, sin params)
└── seeders/
    └── seedPatrullaje.js           ← NUEVO: permisos + asignación
```

### Archivos modificados

```text
src/routes/index.routes.js          ← +1 import + router.use('/patrullaje', ...)
CLAUDE.md                           ← actualizar referencia de plan activo
```

---

## Fase 1: Seeder — Rol y Permisos

### T1.1 — Confirmar rol `sereno` (ya existe — solo verificar)

**Archivo:** `src/seeders/seedPatrullaje.js`

El rol `sereno` ya existe en BD (id=83, nivel_jerarquia=8). El seeder usa
`findOrCreate` para ser idempotente. No hay riesgo de duplicado.

```js
const [rolSereno] = await Rol.findOrCreate({
  where: { slug: 'sereno' },
  defaults: {
    nombre: 'Sereno',
    descripcion: 'Agente de serenazgo con acceso al APK de patrullaje',
    nivel_jerarquia: 8,
    es_sistema: false,
    estado: 1,
  },
  transaction,
});
```

### T1.2 — Crear permisos `patrullaje.*`

```js
const permisosData = [
  {
    modulo: 'patrullaje', recurso: 'sereno', accion: 'read',
    slug: 'patrullaje.sereno.read',
    descripcion: 'Ver turno activo y asignación del sereno',
    es_sistema: false,
  },
  {
    modulo: 'patrullaje', recurso: 'conductor', accion: 'read',
    slug: 'patrullaje.conductor.read',
    descripcion: 'Ver vehículo asignado como conductor',
    es_sistema: false,
  },
];

for (const data of permisosData) {
  const [permiso] = await Permiso.findOrCreate({ where: { slug: data.slug }, defaults: data, transaction });
  await RolPermiso.findOrCreate({ where: { rol_id: rolSereno.id, permiso_id: permiso.id }, transaction });
}
```

**Ejecutar con:**
```bash
node src/seeders/seedPatrullaje.js
```

---

## Fase 2: Controlador

### T2.1 — Helper `getLocalDateString` en `dateHelper.js`

Verificar si `src/utils/dateHelper.js` ya tiene esta función. Si no, agregar:

```js
export const getLocalDateString = (timezone = 'America/Lima') => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
};
```

### T2.2 — Helper `getHorarioActivoInternal` (extraído del controlador existente)

Agregar a `src/utils/dateHelper.js` o a un nuevo `src/utils/horarioHelper.js`:

```js
export const getHorarioActivoInternal = async (timezone = 'America/Lima') => {
  // Igual que getHorarioActivo pero retorna { horario, fechaTurno } | null
  // sin envolver en res.json — reutilizable por otros controladores
};
```

> **Alternativa simplificada:** El controlador de patrullaje puede llamar directamente
> a los modelos sin reutilizar el helper existente, ya que la lógica es sencilla.
> Decidir en implementación cuál opción genera menos deuda técnica.

### T2.3 — `patrullajeController.js`

**Lógica completa de `getTurnoActivo`:**

```js
import models from '../models/index.js';
import { authenticate, requirePermission } from '../middlewares/authMiddleware.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { logger } from '../utils/logger.js';

const { Usuario, HorariosTurnos, OperativosTurno, OperativosVehiculos,
        OperativosPersonal, OperativosVehiculosCuadrantes,
        OperativosPersonalCuadrantes, Vehiculo, Cuadrante } = models;

export const getTurnoActivo = async (req, res) => {
  try {
    // 1. Resolver personal_seguridad_id del usuario autenticado
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ['personal_seguridad_id'],
    });
    if (!usuario?.personal_seguridad_id) {
      return res.json(successResponse(null, 'Usuario sin personal asignado'));
    }
    const psId = usuario.personal_seguridad_id;

    // 2. Obtener horario activo (hora Lima)
    const horarioActivo = await resolveHorarioActivo();
    if (!horarioActivo) {
      return res.json(successResponse(null, 'Sin turno activo en este momento'));
    }

    // 3. Obtener fecha local Lima
    const hoyPeru = getLocalDateLima();

    // 4. Buscar operativo del turno de hoy
    const operativoTurno = await OperativosTurno.findOne({
      where: { turno: horarioActivo.turno, fecha: hoyPeru, deleted_at: null },
    });
    if (!operativoTurno) {
      return res.json(successResponse(
        { turno: buildTurnoShape(horarioActivo, hoyPeru), rol_operativo: null,
          vehiculo: null, tipo_patrullaje: null, cuadrante: null },
        'Turno activo sin operativo configurado para hoy'
      ));
    }

    // 5. Buscar en operativos_vehiculos (conductor o copiloto)
    const opVehiculo = await OperativosVehiculos.findOne({
      where: {
        operativo_turno_id: operativoTurno.id,
        [Op.or]: [{ conductor_id: psId }, { copiloto_id: psId }],
        deleted_at: null,
      },
      include: [{ model: Vehiculo, as: 'vehiculo', attributes: ['id','codigo_vehiculo','placa','marca'] }],
    });

    if (opVehiculo) {
      const rolOperativo = opVehiculo.conductor_id === psId ? 'CONDUCTOR' : 'COPILOTO';
      const cuadrante = await getCuadranteActivoVehiculo(opVehiculo.id);
      return res.json(successResponse({
        turno: buildTurnoShape(horarioActivo, hoyPeru),
        rol_operativo: rolOperativo,
        vehiculo: opVehiculo.vehiculo,
        tipo_patrullaje: 'VEHICULAR',
        cuadrante,
      }, 'Turno activo obtenido exitosamente'));
    }

    // 6. Buscar en operativos_personal (principal o auxiliar)
    const opPersonal = await OperativosPersonal.findOne({
      where: {
        operativo_turno_id: operativoTurno.id,
        [Op.or]: [{ personal_id: psId }, { sereno_id: psId }],
        deleted_at: null,
      },
    });

    if (opPersonal) {
      const rolOperativo = opPersonal.personal_id === psId ? 'SERENO_PRINCIPAL' : 'SERENO_AUXILIAR';
      const cuadrante = await getCuadranteActivoPersonal(opPersonal.id);
      return res.json(successResponse({
        turno: buildTurnoShape(horarioActivo, hoyPeru),
        rol_operativo: rolOperativo,
        vehiculo: null,
        tipo_patrullaje: 'A_PIE',
        cuadrante,
      }, 'Turno activo obtenido exitosamente'));
    }

    // 7. Tiene turno activo pero sin asignación operativa aún
    return res.json(successResponse({
      turno: buildTurnoShape(horarioActivo, hoyPeru),
      rol_operativo: null,
      vehiculo: null,
      tipo_patrullaje: null,
      cuadrante: null,
    }, 'Turno activo sin asignación operativa'));

  } catch (error) {
    logger.error('Error en getTurnoActivo', { stack: error.stack });
    return res.status(500).json(errorResponse('Error interno del servidor'));
  }
};
```

**Funciones auxiliares (en el mismo archivo o en un helper):**

```js
const resolveHorarioActivo = async (timezone = 'America/Lima') => {
  // Reutiliza la lógica de convertirAHoraLocal de horariosTurnosController
  // Retorna el objeto HorariosTurnos o null
};

const buildTurnoShape = (horario, fecha) => ({
  nombre: horario.turno,
  hora_inicio: horario.hora_inicio,
  hora_fin: horario.hora_fin,
  fecha,
});

const getLocalDateLima = () => {
  // Usa Intl.DateTimeFormat con timeZone: 'America/Lima' → 'YYYY-MM-DD'
};

const getCuadranteActivoVehiculo = async (opVehiculoId) => {
  const ovc = await OperativosVehiculosCuadrantes.findOne({
    where: { operativo_vehiculo_id: opVehiculoId, hora_salida: null, deleted_at: null },
    include: [{ model: Cuadrante, as: 'datosCuadrante', attributes: ['id','nombre'] }],
  });
  return ovc?.datosCuadrante ?? null;
};

const getCuadranteActivoPersonal = async (opPersonalId) => {
  const opc = await OperativosPersonalCuadrantes.findOne({
    where: { operativo_personal_id: opPersonalId, hora_salida: null, deleted_at: null },
    include: [{ model: Cuadrante, as: 'datosCuadrante', attributes: ['id','nombre'] }],
  });
  return opc?.datosCuadrante ?? null;
};
```

> **Nota importante:** verificar el alias de la asociación `Cuadrante` en
> `OperativosPersonalCuadrantes` (leer `src/models/OperativosPersonalCuadrantes.js`)
> antes de implementar — puede diferir de `datosCuadrante`.

---

## Fase 3: Ruta y Validador

### T3.1 — `patrullaje.validator.js`

```js
// src/validators/patrullaje.validator.js
// Sin parámetros de entrada — solo por consistencia con el patrón del proyecto
export const validateGetTurnoActivo = [];
```

### T3.2 — `patrullaje.routes.js`

```js
// src/routes/patrullaje.routes.js
import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/handleValidationErrors.js';
import { getTurnoActivo } from '../controllers/patrullajeController.js';
import { validateGetTurnoActivo } from '../validators/patrullaje.validator.js';

const router = Router();

router.get(
  '/turno-activo',
  authenticate,
  requirePermission('patrullaje.sereno.read'),
  validateGetTurnoActivo,
  handleValidationErrors,
  getTurnoActivo
);

export default router;
```

### T3.3 — Registrar en `index.routes.js`

Agregar al bloque de imports:
```js
import patrullajeRoutes from './patrullaje.routes.js';
```

Agregar al bloque de registros:
```js
router.use('/patrullaje', patrullajeRoutes);
```

---

## Fase 4: Verificación

### T4.1 — Tests manuales (ver quickstart.md)

Verificar AC-01 a AC-05 con curl.

### T4.2 — Actualizar Swagger

```bash
npm run swagger
```

Verificar que `GET /api/v1/patrullaje/turno-activo` aparece en `/api/v1/docs`.

---

## Riesgos y Contingencias

| Riesgo | Detección | Mitigación |
|---|---|---|
| Alias de `Cuadrante` en `OperativosPersonalCuadrantes` distinto al asumido | Leer el modelo antes de implementar | Ajustar el alias en `getCuadranteActivoPersonal` |
| `horarios_turnos.turno` ENUM no coincide exactamente con `operativos_turno.turno` | Query retorna null inesperado | Verificar con `SELECT DISTINCT turno FROM operativos_turno` |
| `Op` de Sequelize no importado | Error en runtime | Importar siempre `import { Op } from 'sequelize'` |
| Supabase: `hora_salida` comparado con `null` devuelve 0 rows | Test en Supabase | Usar `{ hora_salida: null }` (Sequelize ORM maneja IS NULL) |
