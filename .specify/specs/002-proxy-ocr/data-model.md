# Data Model — TD-P-002: Proxy OCR de Comprobantes de Combustible

**Generado por**: `/speckit-plan`  
**Fecha**: 2026-06-04

---

## Entidades nuevas

Este feature **no crea tablas nuevas**. El endpoint es un proxy sin persistencia.

---

## Cambio en BD: nuevo permiso

Se inserta una fila en la tabla `citysecure.permisos` (existente) y filas en `citysecure.rol_permisos` (existente).

### Tabla: `citysecure.permisos`

| Campo | Valor |
|---|---|
| `nombre` | `'Analizar comprobante OCR'` |
| `slug` | `'vehiculos.combustible.ocr'` |
| `descripcion` | `'Permite enviar imágenes de comprobantes al servicio de análisis IA'` |
| `modulo` | `'vehiculos'` |
| `es_sistema` | `false` |

### Tabla: `citysecure.rol_permisos`

| `rol_id` (via slug) | `permiso_id` (via slug) |
|---|---|
| `operador` | `vehiculos.combustible.ocr` |
| `supervisor` | `vehiculos.combustible.ocr` |
| `admin` | `vehiculos.combustible.ocr` |

> `super_admin` tiene bypass completo (no necesita fila explícita).

### SQL de migración

```sql
-- Migración: agregar permiso OCR de comprobantes
-- Ejecutar en Supabase MCP vía mcp__supabase__apply_migration

INSERT INTO citysecure.permisos (nombre, slug, descripcion, modulo, es_sistema)
VALUES (
  'Analizar comprobante OCR',
  'vehiculos.combustible.ocr',
  'Permite enviar imágenes de comprobantes al servicio de análisis IA',
  'vehiculos',
  false
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO citysecure.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM citysecure.roles r, citysecure.permisos p
WHERE r.slug IN ('operador', 'supervisor', 'admin')
  AND p.slug = 'vehiculos.combustible.ocr'
ON CONFLICT DO NOTHING;
```

---

## Payload — sin entidad persistida

El endpoint recibe y procesa el siguiente payload pero **no lo almacena**:

```
Entrada (request body):
  imageBase64   string   Base64 de la imagen del comprobante (JPEG en la práctica)
  mediaType     string   MIME type: image/jpeg | image/png | image/webp | image/gif

Salida (response.data):
  fecha              string | null   "YYYY-MM-DD"
  hora               string | null   "HH:MM"
  proveedor          string | null   Nombre del grifo
  tipo_combustible   string | null   gasohol_90 | gasohol_95 | diesel | glp | otro
  galones            number | null   Decimal
  precio_por_galon   number | null   Decimal
  monto_total        number | null   Decimal
  numero_comprobante string | null   "E001-000123"
  placa_vehiculo     string | null   Placa si aparece en el comprobante
```

Este JSON es el mismo que producía `visionService.js` directamente — sin cambio de contrato hacia el APK.

---

## Archivos nuevos (no BD)

| Archivo | Descripción |
|---|---|
| `src/controllers/visionController.js` | Recibe imagen, llama a Anthropic, devuelve JSON |
| `src/validators/vision.validator.js` | Valida `imageBase64` y `mediaType` con express-validator |
| `src/routes/vision.routes.js` | `POST /vision/analizar` con auth + permiso + validator |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/routes/index.routes.js` | Import + `router.use('/vision', visionRoutes)` |
| `city_sec_patrol/src/services/visionService.js` | Reemplaza fetch directo a Anthropic por POST al backend |
| `city_sec_patrol/.env` | Eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` |
| `city_sec_patrol/.env.example` | Eliminar `EXPO_PUBLIC_CLAUDE_API_KEY` |
