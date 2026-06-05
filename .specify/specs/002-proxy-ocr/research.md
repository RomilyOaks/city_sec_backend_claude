# Research — TD-P-002: Proxy OCR de Comprobantes de Combustible

**Generado por**: `/speckit-plan`  
**Fecha**: 2026-06-04  
**Estado**: Completo — todos los NEEDS CLARIFICATION resueltos

---

## Decisión 1 — Llamada a Anthropic: SDK vs fetch nativo

**Decision**: Usar `fetch` nativo de Node.js 18 para llamar a `api.anthropic.com/v1/messages`.

**Rationale**: Node.js 18 incluye `fetch` global estable. El backend no tiene `@anthropic-ai/sdk` instalado (`grep "anthropic" package.json` → sin resultados). El APK usa el mismo patrón (fetch + JSON manual) y funciona. Cero dependencias nuevas = zero CVE risk surface.

**Alternatives considered**:
- `@anthropic-ai/sdk` — más features (retries automáticos, streaming, type safety), pero innecesario para una sola llamada síncrona. Agrega ~200 KB al bundle. Se puede migrar en el futuro si se necesita streaming.

---

## Decisión 2 — Librería de validación: express-validator (no Joi)

**Decision**: Usar `express-validator` en `vision.validator.js`, igual que todos los demás validadores del proyecto.

**Rationale**: Revisando `src/validators/`, **todos** los módulos usan `express-validator` (`body`, `param`, `query` de `express-validator`). El spec.md mencionó "Joi" erróneamente. Introducir Joi crearía una inconsistencia sin beneficio.

**Alternatives considered**:
- Joi — más expresivo para schemas complejos. Rechazado: el payload de este endpoint (`imageBase64` + `mediaType`) es simple; express-validator es suficiente y consistente.

---

## Decisión 3 — Timeout en Node.js fetch: AbortSignal.timeout()

**Decision**: `AbortSignal.timeout(30_000)` para imponer el timeout de 30 segundos en la llamada a Anthropic.

**Rationale**: `AbortSignal.timeout(ms)` está disponible desde Node.js 17.3+ y es la forma idiomática en Node.js 18 sin dependencias. Genera `TimeoutError` si la llamada supera 30 s.

```js
const response = await fetch(url, {
  signal: AbortSignal.timeout(30_000),
  // ...
});
```

**Alternatives considered**:
- `AbortController` manual + `setTimeout` — mismo resultado pero más verboso.
- `axios` con `timeout` — no consistente; el backend no usa axios en la capa de servicio (solo en el APK).

---

## Decisión 4 — Nombre del archivo validador: `vision.validator.js`

**Decision**: `src/validators/vision.validator.js` (singular, sin "s", consistente con el resto: `abastecimiento.validator.js`, `novedad.validator.js`).

**Rationale**: Convención del proyecto es singular. El spec mencionó `vision.validators.js` (con "s") — esto es inconsistente con el codebase.

---

## Decisión 5 — Registro en index.routes.js (no en app.js)

**Decision**: La ruta se registra en `src/routes/index.routes.js`, no importando directamente en `app.js`.

**Rationale**: `app.js` solo monta un router: `app.use('/api/${API_VERSION}', indexRoutes)`. Todos los módulos nuevos se importan y registran en `index.routes.js`. El spec.md sección 7 (Tarea 1.5) decía agregar en `app.js` directamente, lo cual es incorrecto.

---

## Decisión 6 — mediaType por defecto en visionService.js del APK

**Decision**: El APK siempre envía `mediaType: 'image/jpeg'` porque `FileSystem.readAsStringAsync` con `EncodingType.Base64` no expone el MIME type original.

**Rationale**: Revisando `visionService.js` línea 46: `media_type: 'image/jpeg'` está hardcodeado. El APK usa `expo-camera` que siempre captura JPEG. El nuevo `visionService.js` debe enviar `mediaType: 'image/jpeg'` en el POST.

**Implication**: El validador del backend debe aceptar los 4 tipos del spec (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) pero en práctica siempre llegará JPEG.

---

## Decisión 7 — Dialecto: solo impacto en permiso SQL

**Decision**: El endpoint `POST /api/v1/vision/analizar` no usa Sequelize directamente. El único impacto en BD es el INSERT del permiso `vehiculos.combustible.ocr` vía Supabase MCP.

**Rationale**: El controlador solo llama a `fetch` (Anthropic) y devuelve JSON. No persiste datos. No hay compatibilidad MySQL/PostgreSQL que resolver para este endpoint.

**Implication**: La migración SQL debe usar `citysecure.permisos` (schema Supabase). Si se quiere compatibilidad MySQL también, agregar el permiso al seeder `seedRBAC.js` en la sección de nuevos permisos de módulo `vehiculos`.

---

## Decisión 8 — Prompt exacto a usar en el backend

El prompt del `visionService.js` del APK (líneas 6-19 del archivo actual) es:

```
Eres un asistente que extrae datos de comprobantes de combustible peruanos.
Devuelve ÚNICAMENTE un JSON con estos campos (usa null si el dato no es visible):
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "proveedor": "nombre del grifo o estación",
  "tipo_combustible": "gasohol_90|gasohol_95|diesel|glp|otro",
  "galones": número_decimal,
  "precio_por_galon": número_decimal,
  "monto_total": número_decimal,
  "numero_comprobante": "serie-número (ej: E001-000123)",
  "placa_vehiculo": "placa si aparece en el comprobante"
}
No incluyas explicaciones, markdown ni texto extra. Solo el JSON.
```

El texto del mensaje de usuario es:
```
Extrae los datos de este comprobante de combustible.
```

Modelo: `claude-sonnet-4-20250514`  
max_tokens: `512`

**Decision**: Copiar exactamente estos valores al controlador del backend — no modificar el prompt para no cambiar el comportamiento del formulario.

---

## Resolución de NEEDS CLARIFICATION

| Pregunta | Respuesta |
|---|---|
| ¿Usa el backend `@anthropic-ai/sdk`? | No — usar fetch nativo Node.js 18 |
| ¿Cuál es la librería de validación? | express-validator (no Joi) |
| ¿El permiso se inserta en MySQL también? | No requerido para este spec; solo Supabase MCP |
| ¿El APK sabe el mediaType de la foto? | No — hardcodear `image/jpeg` en el APK |
| ¿Los routes se agregan en app.js o index.routes.js? | index.routes.js (única fuente de rutas) |
