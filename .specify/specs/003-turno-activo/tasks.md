# Tasks: TD-P-005 — Turno Activo del Sereno

**Input**: `.specify/specs/003-turno-activo/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅

**Scope**: Solo backend (`city_sec_backend_claude`).
El APK `city_sec_patrol` (Outcomes 4–5 del spec) queda fuera de este tasks.md.

**Tests**: No incluidos — fuera del scope de este spec (AC-09 se verifica manualmente).

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo con otras tareas marcadas [P] del mismo bloque
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Rutas son relativas a `city_sec_backend_claude/`

---

## Phase 1: Setup — Sin tareas

La infraestructura base ya existe (Express 5, Sequelize, middlewares, utils).
No hay setup previo necesario.

---

## Phase 2: Foundational — Seeder y Helpers (Prerequisito para todo)

**Purpose**: Permisos en BD + helpers de fecha reutilizables. Bloquea las fases siguientes.

**⚠️ CRÍTICO**: Las fases 3 y 4 requieren que los permisos existan en BD.

- [x] T001 Verificar alias `datosCuadrante` en `OperativosVehiculosCuadrantes` y `OperativosPersonalCuadrantes` leyendo `src/models/index.js` (líneas ~684–705) — confirmar antes de codificar el controlador
- [x] T002 Crear `src/seeders/seedPatrullaje.js` — `findOrCreate` rol `sereno` (ya existe id=83) + insertar permisos `patrullaje.sereno.read` y `patrullaje.conductor.read` + asignarlos a rol sereno vía `rol_permisos`
- [x] T003 Agregar función `getLocalDateLima()` en `src/utils/dateHelper.js` — retorna fecha actual en format `YYYY-MM-DD` usando `Intl.DateTimeFormat` con `timeZone: 'America/Lima'` (sin dependencias nuevas)
- [x] T004 Ejecutar el seeder localmente: `node src/seeders/seedPatrullaje.js` y verificar con `SELECT slug FROM permisos WHERE slug LIKE 'patrullaje%'` en MySQL local

**Checkpoint**: Permisos en BD + helper de fecha listos. Verificar que `SELECT slug FROM permisos WHERE slug LIKE 'patrullaje%'` retorna 2 filas.

---

## Phase 3: US1 — Endpoint Turno Activo con Vehículo (Outcomes 1 & 2, AC-01, AC-04, AC-05, AC-08)

**Goal**: El endpoint `GET /api/v1/patrullaje/turno-activo` responde con JWT de sereno conductor,
devolviendo el turno activo + datos del vehículo asignado. Auth/AuthZ correctamente protegido.

**Independent Test**:
```bash
# AC-08: permiso existe en BD
SELECT slug FROM citizen_security.permisos WHERE slug LIKE 'patrullaje%';  # → 2 filas

# AC-04: sin JWT → 401
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo
# → {"success":false, HTTP 401}

# AC-05: JWT de operador → 403
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo \
  -H "Authorization: Bearer <JWT_OPERADOR>"
# → {"success":false, HTTP 403}

# AC-01: JWT de sereno conductor con turno activo
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo \
  -H "Authorization: Bearer <JWT_SERENO_CONDUCTOR>"
# → {"success":true, "data":{"turno":{...}, "vehiculo":{"placa":"..."}, "tipo_patrullaje":"VEHICULAR"}}
```

### Implementación US1

- [x] T005 Crear `src/validators/patrullaje.validator.js` — exportar `validateGetTurnoActivo = []` (array vacío, sin params de entrada)
- [x] T006 Crear `src/routes/patrullaje.routes.js` — router con `GET /turno-activo` usando `authenticate` + `requirePermission('patrullaje.sereno.read')` + `validateGetTurnoActivo` + `handleValidationErrors` + `getTurnoActivo` (importar de `../controllers/patrullajeController.js`)
- [x] T007 Registrar la ruta en `src/routes/index.routes.js` — agregar `import patrullajeRoutes from './patrullaje.routes.js'` y `router.use('/patrullaje', patrullajeRoutes)` en el bloque de módulos
- [x] T008 [US1] Crear `src/controllers/patrullajeController.js` — implementar función `resolveHorarioActivo()` privada que replica la lógica de `convertirAHoraLocal` + loop de horarios de `horariosTurnosController.js` y retorna el objeto `HorariosTurnos` o `null`
- [x] T009 [US1] En `src/controllers/patrullajeController.js` — implementar `getTurnoActivo(req, res)`: pasos 1–5 del plan (resolver psId → horario activo → fecha Lima → OperativosTurno → OperativosVehiculos con `Op.or conductor/copiloto`) + respuesta exitosa con `{ turno, rol_operativo, vehiculo, tipo_patrullaje: 'VEHICULAR', cuadrante }`
- [x] T010 [US1] En `src/controllers/patrullajeController.js` — implementar `getCuadranteActivoVehiculo(opVehiculoId)` privada: `OperativosVehiculosCuadrantes.findOne({ where: { operativo_vehiculo_id, hora_salida: null }, include: [{ model: Cuadrante, as: 'datosCuadrante', attributes: ['id','nombre'] }] })` → retorna `ovc?.datosCuadrante ?? null`

**Checkpoint**: AC-01, AC-04, AC-05, AC-08 verificados. El endpoint responde correctamente para un sereno conductor con turno activo.

---

## Phase 4: US2 — Casos Edge (Outcomes 3 & 4, AC-02, AC-03)

**Goal**: El endpoint maneja correctamente los 3 casos restantes: sereno a pie, sin turno activo,
y con turno activo pero sin operativo asignado aún.

**Independent Test**:
```bash
# AC-02: JWT de sereno a pie con turno activo
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo \
  -H "Authorization: Bearer <JWT_SERENO_PIE>"
# → {"success":true, "data":{"vehiculo":null, "tipo_patrullaje":"A_PIE"}}

# AC-03: JWT de sereno, fuera del horario configurado
curl -X GET http://localhost:3000/api/v1/patrullaje/turno-activo \
  -H "Authorization: Bearer <JWT_SERENO>"
# → {"success":true, "data":null, "message":"Sin turno activo en este momento"}
```

### Implementación US2

- [x] T011 [US2] En `src/controllers/patrullajeController.js` — implementar `getCuadranteActivoPersonal(opPersonalId)` privada: `OperativosPersonalCuadrantes.findOne({ where: { operativo_personal_id: opPersonalId, hora_salida: null }, include: [{ model: Cuadrante, as: 'datosCuadrante', attributes: ['id','nombre'] }] })` → retorna `opc?.datosCuadrante ?? null`
- [x] T012 [US2] En `getTurnoActivo` de `src/controllers/patrullajeController.js` — agregar paso 6: buscar en `OperativosPersonal` con `Op.or({ personal_id: psId }, { sereno_id: psId })` y retornar `{ turno, rol_operativo: 'SERENO_PRINCIPAL'|'SERENO_AUXILIAR', vehiculo: null, tipo_patrullaje: 'A_PIE', cuadrante }`
- [x] T013 [US2] En `getTurnoActivo` de `src/controllers/patrullajeController.js` — agregar paso 7 (sin asignación operativa): si `operativoTurno` existe pero no se encontró operativo vehicular ni personal para `psId`, retornar `{ turno, rol_operativo: null, vehiculo: null, tipo_patrullaje: null, cuadrante: null }` con message `'Turno activo sin asignación operativa'`
- [x] T014 [US2] Verificar que `getTurnoActivo` retorna `data: null` cuando `resolveHorarioActivo()` devuelve null (fuera de horario) — probar manualmente ajustando el horario en BD o usando un usuario sin turno activo

**Checkpoint**: AC-01 al AC-05 completamente verificados. Los 4 casos del data-model responden correctamente.

---

## Phase 5: Polish — Swagger y Documentación

**Purpose**: Actualizar Swagger y dejar registro de los cambios.

- [x] T015 [P] Regenerar `swagger_output.json` ejecutando `npm run swagger` — verificar que `GET /api/v1/patrullaje/turno-activo` aparece en `/api/v1/docs`
- [x] T016 [P] Actualizar el comentario de versión en `src/routes/index.routes.js` — agregar entrada `v2.5.0: Módulo /patrullaje — turno activo del sereno`
- [x] T017 Verificar AC-09 manualmente: confirmar que el endpoint funciona con `DB_DIALECT=mysql` (local) y documentar que la compatibilidad PostgreSQL se garantiza por el uso exclusivo de Sequelize ORM sin SQL raw

---

## Dependencies & Execution Order

### Dependencias entre fases

- **Phase 2 (Foundational)**: Sin dependencias — empezar aquí
- **Phase 3 (US1)**: Requiere T002 (permisos en BD) y T003 (helper fecha) completos
- **Phase 4 (US2)**: Requiere T008, T009, T010 de Phase 3 completos (extiende el controlador)
- **Phase 5 (Polish)**: Requiere todas las fases anteriores

### Dependencias dentro de Phase 3

```
T005 (validator) ──────────────────────────────────────────┐
T006 (routes) ← depende de T005 (import validator)        │
T007 (index.routes.js) ← depende de T006 (import routes)  │
T008 (resolveHorarioActivo) ────────────────────────────────┤
T009 (getTurnoActivo) ← depende de T003, T008              │
T010 (getCuadranteActivoVehiculo) ← usado por T009         │
```

### Dependencias dentro de Phase 4

```
T011 (getCuadranteActivoPersonal) ← usado por T012
T012 (caso a pie) ← depende de T011
T013 (sin asignación) ← depende de T009 (extiende el mismo controller)
T014 (verificación sin turno) ← requiere T008, T009, T012, T013
```

---

## Parallel Opportunities

### Phase 2

```
T001 (verificar alias)   ← puede hacerse mientras se codifica T002
T002 (seeder)            ← independiente de T003
T003 (dateHelper)        ← independiente de T002
```

### Phase 3

```
T005 (validator)         ← paralelo con T008 (archivos distintos)
T010 (getCuadrante)      ← paralelo con T006/T007 (no depende de ellos)
```

### Phase 5

```
T015 (swagger)           ← paralelo con T016 (archivos distintos)
```

---

## Implementation Strategy

### MVP (solo Phase 2 + Phase 3)

1. Completar Phase 2: seeder + helper fecha
2. Completar Phase 3: endpoint con caso vehicular + auth/authz
3. **STOP y VALIDAR**: AC-01, AC-04, AC-05, AC-08 con curl
4. Si AC pasan → mergear al branch de integración o deployar a Railway

### Entrega Completa

1. MVP (arriba)
2. Agregar Phase 4: casos edge (a pie, sin turno, sin asignación)
3. Verificar AC-02, AC-03
4. Phase 5: Swagger + doc

---

## Notas

- `[P]` = archivos distintos, sin dependencias entre sí — pueden ejecutarse en paralelo
- `[Story]` = trazabilidad a historia de usuario del spec
- El seeder (T002) es idempotente — puede ejecutarse varias veces sin duplicar datos
- T001 es de verificación, no de código — leer `src/models/index.js` líneas ~682–705
- Alias `datosCuadrante` confirmado en ambos modelos de cuadrantes (vehicular y personal)
- `deleted_at IS NULL` manejado automáticamente por Sequelize `paranoid: true` — no agregar `where: { deleted_at: null }` explícitamente
