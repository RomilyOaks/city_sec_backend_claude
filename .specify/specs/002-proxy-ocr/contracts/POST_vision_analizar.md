# Contract: POST /api/v1/vision/analizar

**Módulo**: Visión / OCR  
**Feature**: TD-P-002 — Proxy OCR de Comprobantes de Combustible  
**Versión del contrato**: 1.0

---

## Request

```
POST /api/v1/vision/analizar
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Headers requeridos

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <ACCESS_TOKEN>` — JWT emitido por `/api/v1/auth/login` |
| `Content-Type` | `application/json` |

### Body

```json
{
  "imageBase64": "<BASE64_STRING>",
  "mediaType": "image/jpeg"
}
```

| Campo | Tipo | Requerido | Validaciones |
|---|---|---|---|
| `imageBase64` | `string` | ✅ | mínimo 100 caracteres (base64 real); no vacío |
| `mediaType` | `string` | ✅ | enum: `image/jpeg`, `image/png`, `image/webp`, `image/gif` |

---

## Responses

### 200 OK — Análisis exitoso

```json
{
  "success": true,
  "message": "Comprobante analizado correctamente",
  "data": {
    "fecha": "2026-05-15",
    "hora": "14:30",
    "proveedor": "Grifo El Trebol",
    "tipo_combustible": "gasohol_95",
    "galones": 10.5,
    "precio_por_galon": 17.50,
    "monto_total": 183.75,
    "numero_comprobante": "E001-001234",
    "placa_vehiculo": "ABC-123"
  }
}
```

> Cualquier campo puede ser `null` si no es legible en el comprobante.

### 400 Bad Request — Validación fallida

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    { "field": "imageBase64", "message": "La imagen es requerida y debe ser un base64 válido" },
    { "field": "mediaType", "message": "El tipo de media no es válido" }
  ]
}
```

### 401 Unauthorized — Sin token o token inválido/expirado

```json
{
  "success": false,
  "message": "Token de autenticación requerido"
}
```

### 403 Forbidden — Token válido pero sin permiso `vehiculos.combustible.ocr`

```json
{
  "success": false,
  "message": "No tienes permiso para realizar esta acción"
}
```

### 502 Bad Gateway — Error de Anthropic API

```json
{
  "success": false,
  "message": "Error al analizar el comprobante",
  "data": null
}
```

> Incluye: timeout (30s), HTTP error de Anthropic, error de parsing del JSON de respuesta.

---

## Permiso RBAC requerido

`vehiculos.combustible.ocr`

Roles con acceso por defecto:

| Rol | Acceso |
|---|---|
| `super_admin` | ✅ bypass |
| `admin` | ✅ (asignado en migración) |
| `supervisor` | ✅ (asignado en migración) |
| `operador` | ✅ (asignado en migración) |
| `consulta` | ❌ |
| `usuario_basico` | ❌ |

---

## Comportamiento interno

```
1. authenticate middleware → valida JWT
2. requirePermission('vehiculos.combustible.ocr') → verifica permiso
3. express-validator → valida body
4. visionController.analizarComprobante:
   a. Llama a https://api.anthropic.com/v1/messages con AbortSignal.timeout(30_000)
   b. model: claude-sonnet-4-20250514, max_tokens: 512
   c. system: <prompt de extracción de comprobante>
   d. Extrae el primer bloque JSON de la respuesta
   e. Retorna { success: true, data: <parsed JSON> }
   f. En error: retorna { success: false, message: "Error al analizar el comprobante", data: null }
```

---

## Cambio en city_sec_patrol — visionService.js

```javascript
// ANTES (llamada directa a Anthropic — inseguro)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': process.env.EXPO_PUBLIC_CLAUDE_API_KEY },
  ...
});

// DESPUÉS (proxy seguro vía backend)
const response = await client.post('/vision/analizar', {
  imageBase64: base64,
  mediaType: 'image/jpeg',
});
return response.data.data; // el JSON del comprobante
```

El cliente Axios `client` ya tiene el interceptor JWT — sin cambios adicionales.
