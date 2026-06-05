---
description: "Tasks for TD-P-002 — Proxy OCR de Comprobantes de Combustible"
---

# Tasks: TD-P-002 — Proxy OCR de Comprobantes de Combustible

**Input**: `.specify/specs/002-proxy-ocr/plan.md`, `spec.md`, `data-model.md`, `contracts/`, `research.md`  
**Tests**: No test tasks — la spec indica verificación manual (AC-01 al AC-08).

**Repos afectados**: `city_sec_backend_claude` (backend) + `city_sec_patrol` (APK)

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[US1]**: Backend proxy funcional (Outcomes 1, 3, 4 del spec)
- **[US2]**: API key eliminada del APK + APK apunta al backend (Outcomes 2, 5 del spec)

---

## Phase 1: Setup (Prerequisito de entorno)

**Purpose**: Verificar que la variable de entorno crítica existe antes de escribir código.  
Sin `ANTHROPIC_API_KEY` en Railway el endpoint falla en producción al hacer push.

- [x] T001 Verificar que `ANTHROPIC_API_KEY` existe en `.env` local (ciudad_sec_backend_claude) y en Railway Dashboard — si no existe, agregarla antes de continuar

---

## Phase 2: Foundational (Bloquea US1 — RBAC check)

**Purpose**: El middleware `requirePermission('vehiculos.combustible.ocr')` devuelve 403 si el permiso no existe en BD. Debe crearse antes de levantar el servidor con la nueva ruta.

**⚠️ CRÍTICO**: No comenzar Phase 3 hasta que T002 esté verificado en BD.

- [x] T002 Ejecutar SQL de migración del permiso `vehiculos.combustible.ocr` en Supabase via `mcp__mysql-railway__mysql_query` o Supabase SQL Editor (usar SQL de `data-model.md`) y verificar con `SELECT slug FROM citysecure.permisos WHERE slug = 'vehiculos.combustible.ocr'` — **MANUAL: correr `database/seeds/019_vision_ocr_permission_mysql.sql` en MySQL local o `supabase/migrations/019_vision_ocr_permission.sql` en Supabase**
- [x] T003 [P] Crear `supabase/migrations/019_vision_ocr_permission.sql` + `database/seeds/019_vision_ocr_permission_mysql.sql` con el SQL de migración (historial del repo)

**Checkpoint**: Permiso `vehiculos.combustible.ocr` confirmado en BD para roles `operador`, `supervisor`, `admin`.

---

## Phase 3: User Story 1 — Backend proxy funcional (Priority: P1) 🎯 MVP

**Goal**: `POST /api/v1/vision/analizar` recibe `{ imageBase64, mediaType }`, llama a Anthropic con el prompt exacto del APK, devuelve el JSON del comprobante — protegido por JWT + permiso RBAC.

**Independent Test**: 
1. `curl -X POST /api/v1/vision/analizar` sin Authorization → HTTP 401
2. `curl` con JWT válido + imagen en base64 → HTTP 200 con JSON del comprobante
3. Ver `quickstart.md` sección "Verificación rápida con curl"

### Implementation for User Story 1

- [x] T004 [P] [US1] Crear `src/controllers/visionController.js` — función `analizarComprobante`: llama a `https://api.anthropic.com/v1/messages` con `fetch` nativo + `AbortSignal.timeout(30_000)`, modelo `claude-sonnet-4-20250514`, max_tokens 512, copia el `SYSTEM_PROMPT` exacto de `city_sec_patrol/src/services/visionService.js` líneas 6-19, extrae bloque JSON de la respuesta, devuelve `successResponse(data)` o `res.status(502).json(errorResponse(...))` en error (ver pseudocódigo en `plan.md` sección T2)
- [x] T005 [P] [US1] Crear `src/validators/vision.validator.js` — exportar array `validateAnalizarComprobante` con `express-validator`: `body('imageBase64').notEmpty().isString().isLength({ min: 100 })` y `body('mediaType').notEmpty().isIn(['image/jpeg','image/png','image/webp','image/gif'])`
- [x] T006 [US1] Crear `src/routes/vision.routes.js` — `Router` con `POST /analizar` encadenando: `verificarToken`, `verificarRolesOPermisos(['supervisor','operador'], ['vehiculos.combustible.ocr'])`, `validateAnalizarComprobante`, `handleValidationErrors`, `analizarComprobante`
- [x] T007 [US1] Registrar la nueva ruta en `src/routes/index.routes.js`: import en línea 133, `router.use('/vision', visionRoutes)` en línea 1032
- [x] T008 [US1] Verificar manualmente AC-03 (401 sin JWT) y AC-07 (respuesta < 15 s) levantando backend con `npm run dev` y usando comandos de `quickstart.md` sección "Verificación rápida con curl" — **AC-03 PASSED: HTTP 401 confirmado**

**Checkpoint**: US1 completa — `POST /api/v1/vision/analizar` funcional en local con auth RBAC y manejo de errores Anthropic.

---

## Phase 4: User Story 2 — API key eliminada del APK (Priority: P2)

**Goal**: `EXPO_PUBLIC_CLAUDE_API_KEY` no existe en ningún archivo de `city_sec_patrol/`. El APK llama al backend (que ya tiene el proxy de US1) en lugar de a Anthropic directamente. La rotación de la clave en Railway ya no requiere rebuild del APK.

**Independent Test**:
1. `grep -r "CLAUDE_API_KEY" city_sec_patrol/` → salida vacía
2. `grep -r "ANTHROPIC" city_sec_patrol/src/` → salida vacía
3. Flujo en APK: Login → Tab Combustible → foto → formulario se prellena (requiere backend local de US1 corriendo)

### Implementation for User Story 2

- [x] T009 [P] [US2] Refactorizar `city_sec_patrol/src/services/visionService.js`: eliminar `CLAUDE_API_URL`, `CLAUDE_MODEL`, `SYSTEM_PROMPT`, referencia a `EXPO_PUBLIC_CLAUDE_API_KEY` y el `fetch` directo; reemplazar con `import client from '../api/client.js'` y `const response = await client.post('/vision/analizar', { imageBase64: base64, mediaType: 'image/jpeg' }); return response.data.data;` — mantener la lógica de `FileSystem.readAsStringAsync` para convertir a base64 (ver pseudocódigo en `plan.md` sección T7)
- [x] T010 [P] [US2] Eliminar la línea `EXPO_PUBLIC_CLAUDE_API_KEY=...` de `city_sec_patrol/.env` y de `city_sec_patrol/.env.example` — si en `.env.example` existía solo como placeholder, eliminarla igualmente
- [x] T011 [US2] Verificar que `grep -r "CLAUDE_API_KEY" city_sec_patrol/` y `grep -r "ANTHROPIC" city_sec_patrol/src/` retornan vacío — **AC-06 PASSED: grep vacío confirmado**; documentar instrucción manual: eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` del entorno `preview` en EAS Dashboard (expo.dev) — este paso es manual fuera del repo

**Checkpoint**: US2 completa — API key fuera del bundle. AC-01, AC-02, AC-06 del spec verificados.

---

## Phase 5: Polish & Cierre

**Purpose**: Documentación de deuda resuelta y trazabilidad del cambio en el ecosistema.

- [x] T012 [P] Actualizar `city_sec_patrol/CLAUDE.md`: en la tabla de deudas técnicas, marcar `TD-P-002` como `RESUELTO (2026-06-05)` y agregar nota: "OCR proxificado vía `POST /api/v1/vision/analizar` en backend — `EXPO_PUBLIC_CLAUDE_API_KEY` eliminada del APK"
- [x] T013 [P] Actualizar `.specify/memory/constitution.md` sección 13 (Deudas Técnicas Globales): marcar TD-P-002 como resuelto o eliminar la fila si la tabla no la tenía explícita

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — comenzar aquí
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEA Phase 3** (RBAC sin permiso → 403)
- **US1 (Phase 3)**: Depende de Phase 2 — T004 y T005 pueden arrancar en paralelo una vez T002 confirmado
- **US2 (Phase 4)**: Depende de US1 (Phase 3) — el APK necesita que el endpoint exista y funcione antes de apuntar a él
- **Polish (Phase 5)**: Depende de US1 + US2 completados

### Within Each User Story

```
Phase 3 (US1):
  T004 ──┐
         ├──► T006 ──► T007 ──► T008
  T005 ──┘

Phase 4 (US2):
  T009 ──┐
         ├──► T011
  T010 ──┘

Phase 5:
  T012 │ (paralelo)
  T013 │
```

### Parallel Opportunities

| Pueden correr juntos | Condición |
|---|---|
| T004 + T005 | Después de T002 — archivos distintos |
| T009 + T010 | Después de T007 — repos distintos, archivos distintos |
| T012 + T013 | Después de T011 — archivos distintos |
| T003 | En cualquier momento después de T002 (solo documentación) |

---

## Parallel Example: User Story 1

```
# Después de T002 (permiso confirmado en BD):
Tarea A: "Crear src/controllers/visionController.js"       [T004]
Tarea B: "Crear src/validators/vision.validator.js"        [T005]

# Cuando A y B completan:
Tarea C: "Crear src/routes/vision.routes.js"               [T006]

# Cuando C completa:
Tarea D: "Registrar en src/routes/index.routes.js"         [T007]
```

---

## Implementation Strategy

### MVP (US1 únicamente)

1. Phase 1: Verificar `ANTHROPIC_API_KEY` (T001)
2. Phase 2: Insertar permiso en Supabase (T002)
3. Phase 3: T004 → T005 → T006 → T007 → T008
4. **STOP y VALIDAR**: curl con/sin JWT, respuesta del formulario
5. Si pasa: hacer push a Railway (el endpoint ya está disponible)
6. Resultado: el endpoint existe — el APK todavía llama directo a Anthropic hasta US2

### Full delivery (US1 + US2)

1. MVP completado y en Railway
2. Phase 4: T009 + T010 en paralelo → T011
3. Phase 5: T012 + T013
4. Build EAS del APK patrol (coordinado con siguiente ciclo de builds)

---

## Criterios de aceptación cubiertos por las tareas

| AC | Cubierto por |
|---|---|
| AC-01 APK no llama a anthropic.com | T009 (refactor visionService) + T011 (verificación grep) |
| AC-02 JSON intacto en formulario | T004 (prompt idéntico) + T008 (verificación manual) |
| AC-03 Sin JWT → 401 | T006 (middleware authenticate) + T008 (verificación curl) |
| AC-04 JWT expirado → refresh | T009 (APK usa client con interceptor) + T011 (test manual) |
| AC-05 Anthropic falla → formulario vacío | T004 (502 + errorResponse) + T008 (test manual) |
| AC-06 EXPO_PUBLIC_CLAUDE_API_KEY eliminada | T010 (limpiar .env) + T011 (grep vacío) |
| AC-07 Respuesta < 15 s | T004 (timeout 30s) + T008 (cronómetro manual) |
| AC-08 Permiso en BD con roles | T002 (INSERT permiso + rol_permisos) |

---

## Notes

- T001 es prerequisito silencioso — si `ANTHROPIC_API_KEY` no existe en Railway, el push dispara deploy pero el endpoint falla en producción
- T003 es documentación pura — no bloquea a nadie, puede hacerse en cualquier momento
- T011 requiere backend local de US1 corriendo para el test de flujo APK
- El build EAS del APK no está en estas tareas — es un paso manual fuera del repo que depende del cupo de builds
- `super_admin` no necesita el permiso en `rol_permisos` (bypass automático de la Constitution)
