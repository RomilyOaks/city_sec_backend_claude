# SPEC — TD-P-002: Proxy OCR de Comprobantes de Combustible
**Versión:** 1.0  
**Fecha:** 2026-06-04  
**Autor:** Romily Robles  
**Repo principal afectado:** `city_sec_backend_claude`  
**Repo secundario afectado:** `city_sec_patrol`  
**Prioridad:** ALTA (riesgo de seguridad activo)  
**Estado:** Borrador — pendiente de aprobación

---

<!--
  ╔══════════════════════════════════════════════════════════════════╗
  ║  NOTA PEDAGÓGICA — ¿Qué es un SPEC en SDD?                     ║
  ║                                                                  ║
  ║  Un spec es el contrato escrito de una feature ANTES de tocar   ║
  ║  código. Responde SIEMPRE estas 6 preguntas:                    ║
  ║    1. ¿Qué problema resuelve?   (sección 1)                     ║
  ║    2. ¿Qué hace exactamente?    (sección 3)                     ║
  ║    3. ¿Qué NO hace?             (sección 4)                     ║
  ║    4. ¿Cómo se valida?          (sección 5)                     ║
  ║    5. ¿Qué restricciones tiene? (sección 6)                     ║
  ║    6. ¿Cómo se implementa?      (sección 7 — el plan)           ║
  ║                                                                  ║
  ║  Claude Code leerá ESTE archivo antes de escribir una sola      ║
  ║  línea de código. El spec ES la fuente de verdad.               ║
  ╚══════════════════════════════════════════════════════════════════╝
-->

---

## 1. Problema que resuelve

<!--
  NOTA PEDAGÓGICA — Sección "problema"
  Esta sección explica el WHY. No describas la solución todavía.
  Un buen spec separa "qué está mal" de "qué vamos a hacer".
  Si no puedes explicar el problema sin mencionar la solución,
  es señal de que no entiendes bien el problema aún.
-->

### Situación actual

La funcionalidad de OCR de comprobantes de combustible en `city_sec_patrol` funciona
enviando la foto del comprobante **directamente desde el APK al API de Anthropic**,
usando la clave `EXPO_PUBLIC_CLAUDE_API_KEY` inyectada en el build de EAS.

El problema crítico es que esta variable **queda embebida en el bundle JavaScript
del APK**. Cualquier persona que descargue el APK puede extraer la clave con
herramientas de reverse engineering estándar (apktool, jadx, dex2jar) en menos
de 5 minutos, sin conocimientos avanzados.

Con esa clave en su poder, un atacante puede:
- Hacer llamadas ilimitadas a la API de Anthropic a costo de la cuenta del municipio.
- El límite de gasto mensual (si no está configurado en Anthropic Console) puede
  alcanzar cientos o miles de dólares antes de ser detectado.
- La clave no puede ser rotada sin generar un nuevo APK y redistribuirlo a todos
  los serenos — lo que tarda días o semanas.

### Por qué es urgente

La deuda TD-P-002 fue clasificada como riesgo ALTO en el PRD. El APK ya fue
compilado y distribuido (último build exitoso: `c2fbea9e`, 2026-05-27), lo que
significa que la clave está actualmente expuesta en producción.

---

## 2. Contexto técnico

<!--
  NOTA PEDAGÓGICA — Sección "contexto"
  Aquí describes cómo funciona el sistema HOY, para que cualquier
  agente IA (o un nuevo desarrollador) entienda el estado de partida.
  No asumas que el lector recuerda todo el código — cítalo explícitamente.
-->

### Flujo actual (inseguro)

```
[SerenoCombustibleScreen.jsx]
  └─► toma foto con expo-camera
  └─► llama visionService.analizarComprobante(imageUri)
        └─► lee EXPO_PUBLIC_CLAUDE_API_KEY del bundle
        └─► convierte imagen a base64
        └─► POST https://api.anthropic.com/v1/messages  ← LLAMADA DIRECTA
              headers: { x-api-key: EXPO_PUBLIC_CLAUDE_API_KEY }
              body: { model, max_tokens, messages: [imagen en base64] }
        └─► retorna JSON con los campos del comprobante
  └─► prelllena el formulario con los datos extraídos
```

### Archivos involucrados

| Archivo | Repo | Rol actual |
|---|---|---|
| `src/services/visionService.js` | `city_sec_patrol` | Llama directo a Anthropic con la API key |
| `src/screens/combustible/CombustibleScreen.jsx` | `city_sec_patrol` | Consume `visionService` |
| `.env` / EAS env vars | `city_sec_patrol` | Contiene `EXPO_PUBLIC_CLAUDE_API_KEY` |
| `src/controllers/` | `city_sec_backend_claude` | Aquí vivirá el nuevo endpoint proxy |
| `src/routes/` | `city_sec_backend_claude` | Aquí se registrará la nueva ruta |

### Restricciones de arquitectura relevantes

- El backend usa **Express 5 + Sequelize + Supabase PostgreSQL** (schema `citysecure`).
- El backend ya tiene middleware `requirePermission` y `authMiddleware` para JWT.
- Los permisos siguen el formato `modulo.recurso.accion`.
- El APK ya usa Axios con interceptor JWT para todas las llamadas al backend.
- Las imágenes se envían como base64 (no como archivo multipart) hacia Anthropic.
- El backend está en Railway — tiene la variable `ANTHROPIC_API_KEY` como env var
  de servidor (privada, nunca expuesta al cliente).

---

## 3. Outcomes — qué debe hacer esta feature

<!--
  NOTA PEDAGÓGICA — Sección "outcomes"
  Los outcomes son el RESULTADO observable desde afuera, no la implementación.
  Escríbelos desde la perspectiva del usuario final o del sistema.
  Un outcome bien escrito puede convertirse directamente en un test.
  Usa el formato "dado X, cuando Y, entonces Z" (Given/When/Then).
-->

### Outcome 1 — Proxy funcional en el backend

**Dado** que un sereno autenticado toma una foto de un comprobante de combustible,  
**cuando** el APK envía la imagen al backend (no a Anthropic directamente),  
**entonces** el backend la reenvía a Anthropic, recibe el JSON estructurado y
lo devuelve al APK en el mismo formato que antes, sin que el sereno perciba
ningún cambio en la experiencia.

### Outcome 2 — API key eliminada del APK

**Dado** que se genera un nuevo build del APK tras este cambio,  
**cuando** un investigador de seguridad inspecciona el bundle JavaScript,  
**entonces** no encuentra ninguna referencia a `ANTHROPIC_API_KEY` ni a
`EXPO_PUBLIC_CLAUDE_API_KEY` en el código.

### Outcome 3 — Endpoint protegido por JWT

**Dado** que alguien intenta llamar al endpoint proxy sin token JWT válido,  
**cuando** el backend recibe la petición,  
**entonces** responde `401 Unauthorized` y no realiza ninguna llamada a Anthropic.

### Outcome 4 — Transparencia de errores

**Dado** que Anthropic devuelve un error (timeout, rate limit, fallo de análisis),  
**cuando** el backend recibe ese error,  
**entonces** lo propaga al APK con un mensaje claro, y el formulario queda en
blanco para llenado manual (comportamiento idéntico al actual).

### Outcome 5 — Rotación de clave sin nuevo APK

**Dado** que es necesario rotar la API key de Anthropic (por compromiso u otro motivo),  
**cuando** se actualiza la variable `ANTHROPIC_API_KEY` en Railway,  
**entonces** el cambio entra en vigor sin necesidad de compilar ni redistribuir el APK.

---

## 4. Scope — qué NO incluye este spec

<!--
  NOTA PEDAGÓGICA — Sección "scope"
  Esta es una de las partes más importantes del spec y la más olvidada.
  Definir explícitamente qué NO se hace previene el "scope creep":
  que durante la implementación se agreguen cosas no planificadas.
  Si alguien pregunta "¿y también hacemos X?", la respuesta es
  "X no está en el scope — abrimos otro spec para eso."
-->

- ❌ No se implementa caché de resultados de OCR (no es necesario — cada comprobante es único).
- ❌ No se almacena la imagen en Supabase Storage (el APK ya sube la foto por su cuenta si es necesario).
  → Pospuesto intencionalmente a SPEC-backend-almacenamiento-comprobantes.md.
     Razón: el storage de auditoría es un requerimiento independiente al
     problema de seguridad que resuelve este spec. Mezclarlos retrasaría
     el fix del riesgo ALTO activo.
- ❌ No se modifica el flujo de 4 pasos de `CombustibleScreen.jsx` (Foto → Análisis → Formulario → Confirmación).
- ❌ No se agrega rate limiting al nuevo endpoint (queda como TD-P-006 para v1.2).
- ❌ No se toca el módulo de GPS, Novedades ni Auth — este spec es solo sobre OCR.
- ❌ No se migra a multipart/form-data — se mantiene base64 para simplificar.
- ❌ No se cambia el modelo de Anthropic (`claude-sonnet-4-20250514` se mantiene).

---

## 5. Criterios de aceptación

<!--
  NOTA PEDAGÓGICA — Sección "criterios de aceptación"
  Estos son los tests. Cada criterio debe ser verificable de forma
  objetiva — no "funciona bien" sino "devuelve HTTP 200 con campo X".
  En SDD maduro, estos criterios se convierten en tests automáticos.
  Por ahora los verificamos manualmente, pero están escritos de forma
  que se puedan automatizar con Jest + Supertest en el futuro.
-->

| ID | Criterio | Cómo verificar |
|---|---|---|
| AC-01 | El APK envía la imagen al backend (no a `api.anthropic.com`) | Capturar tráfico de red con Charles Proxy o similar — no debe haber llamadas a anthropic.com desde el APK |
| AC-02 | El backend devuelve el JSON de Anthropic al APK intacto | Comparar el JSON que llega al formulario antes y después — debe tener los mismos campos |
| AC-03 | Sin JWT → 401 Unauthorized | Llamar al endpoint sin header Authorization → respuesta 401 |
| AC-04 | Con JWT expirado → 401 (el interceptor del APK hace refresh) | Esperar expiración del token y hacer una foto → el interceptor renueva y reintenta |
| AC-05 | Si Anthropic falla → formulario en blanco (no crash) | Cortar red del backend entre análisis → formulario vacío, toast de error |
| AC-06 | `EXPO_PUBLIC_CLAUDE_API_KEY` eliminada del `.env` y de EAS | Revisar `.env`, `.env.example` y EAS Dashboard → ninguna referencia a la clave de Anthropic |
| AC-07 | El endpoint responde en < 15 s (timeout de Anthropic) | Cronometrar desde toma de foto hasta prellenado de formulario |
| AC-08 | El permiso `vehiculos.combustible.ocr` existe en BD y está asignado a `operador` | Consultar `citysecure.permisos` y `citysecure.rol_permisos` |

---

## 6. Restricciones y decisiones técnicas

<!--
  NOTA PEDAGÓGICA — Sección "restricciones"
  Aquí documentas las DECISIONES que ya tomaste y que el agente IA
  NO debe cuestionar ni cambiar. Son constraints, no sugerencias.
  Esto evita que Claude Code "mejore" el diseño de formas no deseadas.
-->

### Decisiones tomadas (no modificar)

1. **Endpoint en el backend principal** (`city_sec_backend_claude`), no en el Voice Gateway.
   _Razón: el Voice Gateway está pausado y no tiene contexto de permisos RBAC._

2. **Transporte base64, no multipart.**
   _Razón: el APK ya convierte a base64 — cambiar a multipart requeriría refactorizar `visionService.js` completamente._

3. **El backend NO almacena la imagen.**
   _Razón: no hay requerimiento de auditoría de imágenes por ahora._

4. **Permiso nuevo: `vehiculos.combustible.ocr`**
   _Razón: sigue el formato `modulo.recurso.accion` de la Constitution. Se asigna a roles `operador` y `supervisor`._

5. **Timeout del endpoint: 30 segundos.**
   _Razón: Anthropic puede tardar hasta 15 s en analizar imágenes grandes. El backend necesita el doble de margen._

6. **El APK elimina `EXPO_PUBLIC_CLAUDE_API_KEY` — no la reemplaza con otra variable.**
   _Razón: la URL del backend ya está en `EXPO_PUBLIC_API_URL`._

### Convenciones del proyecto que aplican

- Respuesta estándar: `{ success: boolean, message: string, data: any }`
- Soft delete y audit logging NO aplican aquí (no es una entidad persistida).
- Nunca hardcodear `ANTHROPIC_API_KEY` — leer desde `process.env.ANTHROPIC_API_KEY`.
- Timezone: no aplica (no hay fechas en este endpoint).

---

## 7. Plan de implementación

<!--
  NOTA PEDAGÓGICA — Sección "plan"
  Esta es la diferencia clave entre un spec y un plan.
  El SPEC dice QUÉ. El PLAN dice CÓMO, en qué orden, y con qué granularidad.
  Las tareas deben ser ATÓMICAS: cada una tiene un inicio y un fin claros,
  y puede ser ejecutada por Claude Code de forma independiente.
  El orden importa: las tareas posteriores dependen de las anteriores.
  
  En Spec Kit, este plan se convierte en el archivo PLAN.md y luego
  en tareas individuales ejecutadas con /speckit-tasks.
-->

### Fase 1 — Backend: nuevo endpoint proxy

#### Tarea 1.1 — Crear el permiso en la migración SQL

```sql
-- Archivo: database/migrations/add_vision_permission.sql
-- Ejecutar en Supabase MCP

INSERT INTO citysecure.permisos (nombre, slug, descripcion, modulo, es_sistema)
VALUES (
  'Analizar comprobante OCR',
  'vehiculos.combustible.ocr',
  'Permite enviar imágenes de comprobantes al servicio de análisis IA',
  'vehiculos',
  false
);

-- Asignar a operador y supervisor
INSERT INTO citysecure.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM citysecure.roles r, citysecure.permisos p
WHERE r.slug IN ('operador', 'supervisor')
  AND p.slug = 'vehiculos.combustible.ocr';
```

**Verificar:** `SELECT slug FROM citysecure.permisos WHERE slug = 'vehiculos.combustible.ocr';`

---

#### Tarea 1.2 — Crear el controlador proxy

```
Archivo nuevo: src/controllers/visionController.js
```

El controlador debe:
- Recibir `{ imageBase64, mediaType }` en el body.
- Validar que `imageBase64` existe y no está vacío.
- Validar que `mediaType` es uno de: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Llamar a Anthropic con el mismo prompt y parámetros que usa actualmente `visionService.js` del APK.
- Devolver la respuesta de Anthropic en el formato estándar `{ success, message, data }`.
- En caso de error de Anthropic: `{ success: false, message: "Error al analizar comprobante", data: null }`.
- Timeout de 30 segundos en la llamada a Anthropic.

```javascript
// Prompt a usar (copiar exactamente del visionService.js actual del APK):
// Analiza este comprobante de combustible y extrae los siguientes campos en JSON...
// (verificar el prompt exacto en city_sec_patrol/src/services/visionService.js)
```

---

#### Tarea 1.3 — Crear el validador

```
Archivo nuevo: src/validators/vision.validators.js
```

Usando Joi (consistente con el resto del backend):
```javascript
// body: {
//   imageBase64: string, requerido, min 100 chars (base64 real)
//   mediaType: string, requerido, enum ['image/jpeg','image/png','image/webp','image/gif']
// }
```

---

#### Tarea 1.4 — Crear la ruta

```
Archivo a modificar: src/routes/vision.routes.js  (nuevo)
```

```javascript
// POST /api/v1/vision/analizar
// Middlewares en orden:
//   1. authMiddleware          ← valida JWT
//   2. requirePermission('vehiculos.combustible.ocr')  ← valida permiso
//   3. validateBody(visionSchema)  ← valida el body
//   4. visionController.analizarComprobante
```

---

#### Tarea 1.5 — Registrar la ruta en app.js

```
Archivo a modificar: src/app.js
```

Agregar junto a las otras rutas:
```javascript
import visionRoutes from './routes/vision.routes.js';
app.use('/api/v1/vision', visionRoutes);
```

---

#### Tarea 1.6 — Verificar variable de entorno en Railway

Confirmar que `ANTHROPIC_API_KEY` existe en las variables de entorno del servicio
backend en Railway. Si no existe, agregarla.

**No commitear el valor real — solo documentar que debe existir.**

---

### Fase 2 — APK Patrol: apuntar al backend

#### Tarea 2.1 — Refactorizar visionService.js

```
Archivo a modificar: city_sec_patrol/src/services/visionService.js
```

Cambios:
1. Eliminar el import/uso de `EXPO_PUBLIC_CLAUDE_API_KEY`.
2. Eliminar el `fetch` directo a `api.anthropic.com`.
3. Reemplazar con una llamada al cliente Axios del proyecto:
   ```javascript
   // Usar el apiClient existente (ya tiene interceptor JWT)
   import apiClient from '../api/client.js';
   
   // En analizarComprobante(imageUri):
   //   1. Convertir imageUri a base64 (lógica existente — no cambiar)
   //   2. POST /vision/analizar con { imageBase64, mediaType }
   //   3. Retornar response.data.data (el JSON del comprobante)
   ```

---

#### Tarea 2.2 — Limpiar variables de entorno del APK

```
Archivos a modificar:
  city_sec_patrol/.env
  city_sec_patrol/.env.example
```

- Eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` de `.env`.
- Eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` de `.env.example`.
- En EAS Dashboard (expo.dev): eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` del entorno `preview`.

**Verificar:** después de limpiar, hacer `grep -r "CLAUDE_API_KEY" city_sec_patrol/` → debe retornar vacío.

---

#### Tarea 2.3 — Actualizar CLAUDE.md del APK

```
Archivo a modificar: city_sec_patrol/CLAUDE.md
```

- En la sección de variables de entorno: eliminar la mención de `EXPO_PUBLIC_CLAUDE_API_KEY`.
- Agregar nota: "El OCR de comprobantes se realiza vía proxy en el backend — la clave de Anthropic no vive en el APK."
- Actualizar la tabla de deudas técnicas: marcar TD-P-002 como RESUELTO.

---

### Fase 3 — Verificación

#### Tarea 3.1 — Test manual del flujo completo

1. Levantar backend local: `npm run dev` en `city_sec_backend_claude`.
2. Configurar `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1` en el APK.
3. Iniciar sesión en el APK como usuario con rol `operador`.
4. Ir a Tab Combustible → tomar foto de un comprobante (o usar imagen de prueba).
5. Verificar que el formulario se prellena correctamente.
6. Verificar en los logs del backend que el endpoint `/vision/analizar` fue llamado.
7. Verificar que NO hay tráfico saliente del APK hacia `api.anthropic.com`.

#### Tarea 3.2 — Test de seguridad básico

1. Llamar a `POST /api/v1/vision/analizar` sin Authorization header → debe responder 401.
2. Buscar en el bundle del APK cualquier referencia a "CLAUDE" o "ANTHROPIC" → debe ser vacío.

#### Tarea 3.3 — Documentar en CONSTITUTION.md

Actualizar la sección "Deudas Técnicas Globales" de `CONSTITUTION.md`:
- Marcar TD-P-002 como RESUELTO con la fecha.
- Agregar nota: "OCR proxificado vía `POST /api/v1/vision/analizar` en backend."

---

## 8. Relación con otros servicios

<!--
  NOTA PEDAGÓGICA — Sección "impacto en otros servicios"
  En un ecosistema de múltiples repos como CitySecure, un cambio en
  un servicio puede romper otro. Esta sección documenta qué otros
  servicios se ven afectados y cómo.
-->

```
city_sec_patrol (APK)
  └─► ANTES: llamaba a api.anthropic.com directamente
  └─► DESPUÉS: llama a city_sec_backend_claude/api/v1/vision/analizar

city_sec_backend_claude
  └─► NUEVO: endpoint POST /api/v1/vision/analizar
  └─► REQUIERE: ANTHROPIC_API_KEY en Railway env vars

city_sec_frontend_v2
  └─► NO AFECTADO — no usa OCR de comprobantes

city_sec_voice_gateway
  └─► NO AFECTADO — este spec no toca el Voice Gateway

city_sec_alert
  └─► NO AFECTADO
```

---

## 9. Riesgos y mitigaciones

<!--
  NOTA PEDAGÓGICA — Sección "riesgos"
  Todo cambio tiene riesgos. Documentarlos previene sorpresas.
  Para cada riesgo define la probabilidad, el impacto y cómo mitigarlo.
-->

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El nuevo endpoint introduce latencia adicional (red APK→backend→Anthropic vs APK→Anthropic) | MEDIA | BAJO — el OCR ya tarda 5-10 s | El backend está en Railway (misma región que Anthropic) — latencia extra < 100 ms |
| El interceptor JWT del APK no maneja el 401 del nuevo endpoint correctamente | BAJA | MEDIO — el sereno tendría que hacer login manual | Verificar en tarea 3.1 que el refresh funciona sobre este endpoint nuevo |
| La variable `ANTHROPIC_API_KEY` no existe en Railway del backend | BAJA | ALTO — el endpoint falla en producción | Verificar en tarea 1.6 antes de hacer deploy |
| Un sereno con rol `consulta` intenta usar el módulo de combustible | BAJA | BAJO — solo ven error 403 | El permiso `vehiculos.combustible.ocr` no está asignado a `consulta` por diseño |

---

## 10. Definición de "Done"

<!--
  NOTA PEDAGÓGICA — "Definition of Done"
  Este es el checklist final. La feature NO está terminada hasta que
  todos los ítems estén marcados. Evita el "ya funciona en mi máquina"
  como criterio de aceptación.
-->

- [ ] Endpoint `POST /api/v1/vision/analizar` desplegado en Railway y respondiendo.
- [ ] `visionService.js` del APK apunta al backend, no a Anthropic.
- [ ] `EXPO_PUBLIC_CLAUDE_API_KEY` eliminada de `.env`, `.env.example` y EAS Dashboard.
- [ ] Todos los criterios de aceptación (AC-01 al AC-08) verificados manualmente.
- [ ] `grep -r "CLAUDE_API_KEY" city_sec_patrol/` retorna vacío.
- [ ] TD-P-002 marcado como RESUELTO en CLAUDE.md del APK y en CONSTITUTION.md.
- [ ] Nuevo build APK generado (cuando se reinicie el cupo EAS el 2026-06-01).

---

*Spec aprobado por: Romily Robles*  
*Próximo artefacto: `PLAN-TD-P-002.md` (generado con `/speckit-plan` en Claude Code)*