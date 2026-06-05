# Implementation Plan: TD-P-002 — Proxy OCR de Comprobantes de Combustible

**Branch**: `main` (feature creada sin rama separada — ver nota abajo)  
**Date**: 2026-06-04  
**Spec**: `.specify/specs/002-proxy-ocr/spec.md`  
**Input**: Feature specification from `.specify/specs/002-proxy-ocr/spec.md`

> **Nota de rama**: El spec fue creado directamente en `main`. El cambio es pequeño (3 archivos nuevos + 3 modificados) y de bajo riesgo de conflicto. Se recomienda crear rama `002-proxy-ocr` antes de implementar si hay trabajo paralelo.

---

## Summary

Eliminar el riesgo de seguridad ALTO (TD-P-002) causado por `EXPO_PUBLIC_CLAUDE_API_KEY` embebida en el bundle del APK `city_sec_patrol`. La solución es un endpoint proxy `POST /api/v1/vision/analizar` en el backend que recibe la imagen en base64, la reenvía a Anthropic desde el servidor (donde la API key es privada) y devuelve el JSON extraído al APK — sin cambiar la experiencia del usuario ni el contrato de datos.

---

## Technical Context

**Language/Version**: Node.js 18+ · ES Modules  
**Primary Dependencies**: Express 5.2.1, express-validator (ya instalado), fetch nativo Node.js 18 (sin nueva dependencia), Sequelize 6  
**Storage**: Sin tablas nuevas — INSERT en `citysecure.permisos` + `citysecure.rol_permisos` (Supabase PG)  
**Testing**: Jest 29 + Supertest  
**Target Platform**: Railway Linux (backend) + React Native Expo (APK city_sec_patrol)  
**Project Type**: web-service (nuevo endpoint proxy) + mobile-app (refactor del servicio OCR)  
**Performance Goals**: < 30 s end-to-end (Anthropic vision puede tardar hasta 15 s)  
**Constraints**: `ANTHROPIC_API_KEY` nunca en cliente; 401 sin JWT; contrato de respuesta idéntico al actual para el formulario del APK  
**Scale/Scope**: ~50 operadores de serenazgo, estimado 5-20 llamadas OCR/día

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla de la Constitution | Estado | Notas |
|---|---|---|
| Formato de permisos `modulo.recurso.accion` | ✅ PASS | `vehiculos.combustible.ocr` |
| `requirePermission` en todos los endpoints protegidos | ✅ PASS | middleware en la ruta |
| ES Modules (`import`/`export`, extensión `.js`) | ✅ PASS | Todos los archivos nuevos |
| Respuesta estándar `{ success, message, data }` | ✅ PASS | Usado en controlador |
| ANTHROPIC_API_KEY solo en env var, nunca en código | ✅ PASS | `process.env.ANTHROPIC_API_KEY` |
| No hardcodear credenciales (ni en seeders ni en ejemplos) | ✅ PASS | N/A — sin seeders de usuarios |
| Auto-deploy Railway en push a main | ⚠️ AWARE | Deployment ocurre automáticamente al hacer push |
| No `DROP`/`DELETE`/`TRUNCATE` sin autorización | ✅ PASS | Solo INSERT/SELECT |
| `__dirname` / `__filename` correctos en ESM | ✅ PASS | No se necesita en archivos nuevos |
| No hacer push sin preguntar al usuario | ✅ PASS | No se hace push en este plan |

**Post-Phase 1 re-check**: Sin cambios al modelo de datos ni a los contratos existentes. El nuevo permiso no modifica permisos `es_sistema: true`. GATE sigue en ✅.

---

## Project Structure

### Documentation (this feature)

```text
.specify/specs/002-proxy-ocr/
├── spec.md              # Fuente de verdad del feature
├── plan.md              # Este archivo (/speckit-plan output)
├── research.md          # Decisiones técnicas y resolución de dudas
├── data-model.md        # Payload, permiso y archivos afectados
├── quickstart.md        # Cómo verificar el feature en local
├── contracts/
│   └── POST_vision_analizar.md   # Contrato del nuevo endpoint
└── tasks.md             # Generado por /speckit-tasks (próximo paso)
```

### Source Code (archivos afectados)

```text
city_sec_backend_claude/
├── src/
│   ├── controllers/
│   │   └── visionController.js          ← NUEVO
│   ├── validators/
│   │   └── vision.validator.js          ← NUEVO
│   └── routes/
│       ├── vision.routes.js             ← NUEVO
│       └── index.routes.js              ← MODIFICADO (import + router.use)
└── .env                                 ← VERIFICAR (ANTHROPIC_API_KEY presente)

city_sec_patrol/
└── src/
    └── services/
        └── visionService.js             ← MODIFICADO (proxy al backend)
.env                                     ← MODIFICADO (eliminar EXPO_PUBLIC_CLAUDE_API_KEY)
.env.example                             ← MODIFICADO (eliminar EXPO_PUBLIC_CLAUDE_API_KEY)
```

**Structure Decision**: Single-file per layer (controller / validator / routes) — patrón estándar del proyecto. Sin abstracciones adicionales.

---

## Complexity Tracking

> Sin violations a la Constitution — tabla no aplica.

---

## Fase 0: Investigación ✅ Completa

Ver `research.md`. Resoluciones clave:

1. **fetch nativo** (no `@anthropic-ai/sdk`) — Node.js 18 built-in, cero nuevas dependencias.
2. **express-validator** (no Joi) — consistente con todos los validadores del proyecto.
3. **`AbortSignal.timeout(30_000)`** para timeout de 30 s.
4. **Registro en `index.routes.js`** (no en `app.js`) — patrón del proyecto.
5. **`mediaType: 'image/jpeg'`** hardcodeado en el APK — expo-camera siempre produce JPEG.

---

## Fase 1: Diseño y Contratos ✅ Completa

Ver `data-model.md`, `contracts/POST_vision_analizar.md`, `quickstart.md`.

---

## Fase 2: Tareas de Implementación

> Las tareas detalladas se generan con `/speckit-tasks`. Las fases y dependencias están documentadas aquí para orientar la generación.

### Dependencias entre tareas

```
[T1] Permiso en BD (Supabase MCP)
  └─ [T2] Controlador visionController.js
       └─ [T3] Validador vision.validator.js
            └─ [T4] Rutas vision.routes.js
                 └─ [T5] Registro en index.routes.js
                      └─ [T6] Test manual endpoint backend
                           └─ [T7] Refactor visionService.js (APK)
                                └─ [T8] Limpiar env vars del APK
                                     └─ [T9] Test manual flujo completo APK
                                          └─ [T10] Actualizar CLAUDE.md del APK + marcar TD-P-002 resuelto
```

### Bloque 1 — Permiso en base de datos

**T1** — Insertar permiso `vehiculos.combustible.ocr` en Supabase

- Ejecutar SQL de `data-model.md` vía Supabase MCP o SQL Editor.
- Verificar: `SELECT slug FROM citysecure.permisos WHERE slug = 'vehiculos.combustible.ocr'`
- Verificar roles asignados (operador, supervisor, admin).
- Archivo de historial: crear `supabase/migrations/014_vision_ocr_permission.sql`.

**Criterio de aceptación**: AC-08 del spec.

---

### Bloque 2 — Implementación backend (3 archivos nuevos + 1 modificado)

**T2** — Crear `src/controllers/visionController.js`

Implementar `analizarComprobante(req, res)`:
```js
const CLAUDE_URL   = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const SYSTEM_PROMPT = `Eres un asistente que extrae datos de comprobantes...` // copiar de visionService.js

export const analizarComprobante = async (req, res) => {
  const { imageBase64, mediaType } = req.body;
  try {
    const response = await fetch(CLAUDE_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'Extrae los datos de este comprobante de combustible.' },
          ],
        }],
      }),
    });
    if (!response.ok) throw new Error(`ANTHROPIC_${response.status}`);
    const result = await response.json();
    const text = result.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('PARSE_ERROR_NO_JSON');
    const data = JSON.parse(match[0]);
    return res.json(successResponse(data, 'Comprobante analizado correctamente'));
  } catch (err) {
    logger.warn('Vision OCR error', { error: err.message });
    return res.status(502).json(errorResponse('Error al analizar el comprobante'));
  }
};
```

**T3** — Crear `src/validators/vision.validator.js`

```js
import { body } from 'express-validator';
export const validateAnalizarComprobante = [
  body('imageBase64')
    .notEmpty().withMessage('La imagen es requerida')
    .isString()
    .isLength({ min: 100 }).withMessage('La imagen no parece ser un base64 válido'),
  body('mediaType')
    .notEmpty().withMessage('El tipo de media es requerido')
    .isIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    .withMessage('Tipo de media no válido'),
];
```

**T4** — Crear `src/routes/vision.routes.js`

```js
import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/handleValidationErrors.js';
import { validateAnalizarComprobante } from '../validators/vision.validator.js';
import * as visionController from '../controllers/visionController.js';

const router = Router();
router.post(
  '/analizar',
  authenticate,
  requirePermission('vehiculos.combustible.ocr'),
  validateAnalizarComprobante,
  handleValidationErrors,
  visionController.analizarComprobante
);
export default router;
```

**T5** — Registrar en `src/routes/index.routes.js`

Agregar después del último import de rutas:
```js
import visionRoutes from './vision.routes.js';
```
Agregar después del último `router.use`:
```js
router.use('/vision', visionRoutes);
```

---

### Bloque 3 — Verificación backend

**T6** — Test manual del endpoint

- `npm run dev` en el backend.
- Verificar AC-03 (401 sin token) y AC-07 (respuesta < 15 s) con curl o Postman.
- Ver `quickstart.md` para los comandos exactos.

---

### Bloque 4 — Refactor del APK city_sec_patrol

**T7** — Refactorizar `city_sec_patrol/src/services/visionService.js`

```js
import client from '../api/client.js';
import * as FileSystem from 'expo-file-system';

export const analizarComprobante = async (imageUri) => {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const response = await client.post('/vision/analizar', {
    imageBase64: base64,
    mediaType: 'image/jpeg',
  });
  return response.data.data;
};
```

Eliminar: `CLAUDE_API_URL`, `CLAUDE_MODEL`, `SYSTEM_PROMPT`, `apiKey`, `fetch` directo.

**T8** — Limpiar variables de entorno del APK

- Eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` de `city_sec_patrol/.env`
- Eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` de `city_sec_patrol/.env.example`
- Instrucción manual: eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` del entorno `preview` en EAS Dashboard (expo.dev)

Verificar: `grep -r "CLAUDE_API_KEY" city_sec_patrol/` → vacío.

---

### Bloque 5 — Verificación final y cierre

**T9** — Test manual del flujo completo APK → Backend → Anthropic

Seguir pasos de `quickstart.md` sección "Verificar el flujo completo en el APK".
Verificar AC-01 al AC-07 del spec.

**T10** — Crear archivo de migración en el repo y marcar deuda resuelta

- Crear `supabase/migrations/014_vision_ocr_permission.sql` con el SQL del permiso.
- En `city_sec_patrol/CLAUDE.md`: marcar TD-P-002 como RESUELTO.
- En `.specify/memory/constitution.md` sección 13: marcar TD-P-002 como RESUELTO.

---

## Criterios de aceptación (referencia rápida)

| ID | Criterio | Verificación |
|---|---|---|
| AC-01 | APK no llama a `api.anthropic.com` | Charles Proxy o logs de red |
| AC-02 | JSON de Anthropic llega intacto al formulario | Comparar campos antes/después |
| AC-03 | Sin JWT → 401 | `curl` sin Authorization header |
| AC-04 | JWT expirado → refresh automático | Esperar expiración y tomar foto |
| AC-05 | Fallo Anthropic → formulario vacío, no crash | Cortar red del backend |
| AC-06 | `EXPO_PUBLIC_CLAUDE_API_KEY` eliminada de `.env` y EAS | `grep` + revisión EAS Dashboard |
| AC-07 | Respuesta < 15 s | Cronómetro foto-a-prellenado |
| AC-08 | Permiso `vehiculos.combustible.ocr` en BD | SQL en Supabase |

---

## Riesgos operacionales

| Riesgo | Mitigación |
|---|---|
| `ANTHROPIC_API_KEY` no está en Railway | Verificar en T1 antes de hacer push; si no existe → agregarla |
| El interceptor JWT del APK no retoma el 401 | Cubrir en T9: forzar expiración y verificar retry |
| La latencia extra APK→backend→Anthropic es perceptible | Esperado < 100 ms (Railway same-region); aceptable vs 5-10 s de OCR |

---

## Siguiente paso

```
/speckit-tasks
```

Genera `tasks.md` con las tareas atómicas en el orden correcto para que `/speckit-implement` las ejecute.
