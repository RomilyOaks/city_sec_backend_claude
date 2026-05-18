# Integración voice_gateway → CitySec Backend
## Envío de adjuntos en denuncias vecinales (fotos + audio)

**Versión:** 1.0  
**Fecha:** 2026-05-18  
**Endpoint destino:** `POST /api/v1/novedades`  
**Flujo:** App móvil vecino → Supabase Storage → voice_gateway → CitySec Backend

---

## Contexto del flujo

El vecino reporta un incidente desde la app móvil:

1. Graba hasta **2 fotos** y **1 audio** en el celular
2. La app sube esos archivos a **Supabase Storage** y obtiene las URLs públicas
3. El vecino dicta o escribe la descripción del incidente (transcripción via Wispr Flow + Claude AI)
4. El **voice_gateway** recibe toda esa información y llama a CitySec Backend para crear la novedad

---

## Endpoint

```
POST /api/v1/novedades
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

El token JWT debe corresponder a un usuario con rol `operador`, `supervisor` o `super_admin`.

---

## Payload completo esperado

```json
{
  "tipo_novedad_id": 3,
  "subtipo_novedad_id": 12,
  "fecha_hora_ocurrencia": "2026-05-18T14:30:00",
  "descripcion": "Vecino reporta presencia de sujetos sospechosos en esquina de Av. Ejército con Jr. Puno, portando mochilas y revisando vehículos estacionados.",
  "localizacion": "Av. Ejército con Jr. Puno",
  "referencia_ubicacion": "Frente a la bodega La Estrella",
  "latitud": -16.3988,
  "longitud": -71.5369,
  "sector_id": 2,
  "cuadrante_id": 5,
  "origen_llamada": "BOTON_DENUNCIA_VECINO_ALERTA",
  "reportante_nombre": "Juan Pérez López",
  "reportante_telefono": "987654321",
  "reportante_doc_identidad": "42345678",
  "es_anonimo": 0,
  "observaciones": "El vecino indica que los sujetos llevan aprox. 20 minutos en el lugar.",

  "fotos_adjuntas": [
    {
      "url": "https://xyzproject.supabase.co/storage/v1/object/public/denuncias/2026/05/18/foto_001.jpg",
      "nombre": "foto_001.jpg",
      "tipo": "image/jpeg",
      "tamaño_bytes": 204800
    },
    {
      "url": "https://xyzproject.supabase.co/storage/v1/object/public/denuncias/2026/05/18/foto_002.jpg",
      "nombre": "foto_002.jpg",
      "tipo": "image/jpeg",
      "tamaño_bytes": 189440
    }
  ],

  "parte_adjuntos": [
    {
      "url": "https://xyzproject.supabase.co/storage/v1/object/public/denuncias/2026/05/18/audio_001.m4a",
      "nombre": "audio_001.m4a",
      "tipo": "audio/mp4",
      "tamaño_bytes": 512000,
      "duracion_seg": 45
    }
  ]
}
```

---

## Descripción de campos adjuntos

### `fotos_adjuntas` (JSON array, opcional)

Array de objetos. Cada objeto representa una foto subida a Supabase.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `url` | string | **Sí** | URL pública de Supabase. Debe ser una URL válida. |
| `nombre` | string | No | Nombre original del archivo |
| `tipo` | string | No | MIME type (`image/jpeg`, `image/png`, etc.) |
| `tamaño_bytes` | number | No | Peso del archivo en bytes |

**Restricciones:**
- Máximo 10 elementos en el array
- El campo `url` de cada elemento debe ser una URL válida (se valida con `new URL()`)
- Si no hay fotos, enviar `null` o no incluir el campo

### `parte_adjuntos` (JSON array, opcional)

Array de objetos. Cada objeto representa un archivo adjunto al parte: **audios**, documentos, etc.  
En el flujo de denuncia vecinal, aquí va el audio grabado.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `url` | string | **Sí** | URL pública de Supabase. Debe ser una URL válida. |
| `nombre` | string | No | Nombre original del archivo |
| `tipo` | string | No | MIME type (`audio/mp4`, `audio/mpeg`, `application/pdf`, etc.) |
| `tamaño_bytes` | number | No | Peso en bytes |
| `duracion_seg` | number | No | Duración en segundos (solo para audios) |

**Restricciones:**
- Máximo 10 elementos en el array
- El campo `url` de cada elemento debe ser una URL válida
- Si no hay audio, enviar `null` o no incluir el campo

---

## Casos posibles según lo que grabe el vecino

| Escenario | `fotos_adjuntas` | `parte_adjuntos` |
|-----------|-----------------|-----------------|
| Solo descripción de texto | `null` | `null` |
| 1 foto, sin audio | Array con 1 objeto | `null` |
| 2 fotos, sin audio | Array con 2 objetos | `null` |
| Sin fotos, con audio | `null` | Array con 1 objeto |
| 2 fotos + audio (caso completo) | Array con 2 objetos | Array con 1 objeto |

---

## Campos obligatorios del payload

Estos campos son siempre requeridos, independientemente de los adjuntos:

| Campo | Tipo | Reglas |
|-------|------|--------|
| `tipo_novedad_id` | integer | ID válido en catálogo `tipos_novedad` |
| `subtipo_novedad_id` | integer | ID válido en catálogo `subtipos_novedad` |
| `fecha_hora_ocurrencia` | string ISO 8601 | No puede ser más de 1 día en el futuro |
| `descripcion` | string | Mínimo 10 caracteres |
| `origen_llamada` | string ENUM | Para denuncias vecinales: `"BOTON_DENUNCIA_VECINO_ALERTA"` |
| `reportante_nombre` o `reportante_telefono` | string | Al menos uno de los dos es requerido (salvo denuncia anónima) |

### Valores válidos para `origen_llamada`

```
TELEFONO_107
RADIO_TETRA
REDES_SOCIALES
BOTON_EMERGENCIA_ALERTA
BOTON_DENUNCIA_VECINO_ALERTA   ← usar este para la app vecino
INTERVENCION_DIRECTA
VIDEO_CCO
ANALITICA
APP_PODER_JUDICIAL
BOT
```

---

## Respuesta exitosa (HTTP 201)

```json
{
  "success": true,
  "message": "Novedad creada exitosamente",
  "data": {
    "id": 1042,
    "novedad_code": "0000001042",
    "tipo_novedad_id": 3,
    "subtipo_novedad_id": 12,
    "estado_novedad_id": 1,
    "descripcion": "Vecino reporta presencia de sujetos sospechosos...",
    "origen_llamada": "BOTON_DENUNCIA_VECINO_ALERTA",
    "prioridad_actual": "MEDIA",
    "fotos_adjuntas": [
      {
        "url": "https://xyzproject.supabase.co/storage/v1/object/public/denuncias/2026/05/18/foto_001.jpg",
        "nombre": "foto_001.jpg",
        "tipo": "image/jpeg",
        "tamaño_bytes": 204800
      }
    ],
    "parte_adjuntos": [
      {
        "url": "https://xyzproject.supabase.co/storage/v1/object/public/denuncias/2026/05/18/audio_001.m4a",
        "nombre": "audio_001.m4a",
        "tipo": "audio/mp4",
        "duracion_seg": 45
      }
    ],
    "created_at": "2026-05-18T14:31:05.000Z",
    "novedadTipoNovedad": { "id": 3, "nombre": "Sospechosos", "color_hex": "#FF8C00" },
    "novedadEstado": { "id": 1, "nombre": "REPORTADA", "color_hex": "#6B7280" }
  }
}
```

---

## Respuesta de error de validación (HTTP 400)

Si una URL en `fotos_adjuntas` es inválida:

```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    {
      "field": "fotos_adjuntas",
      "value": [...],
      "message": "URL inválida en fotos_adjuntas: not-a-url",
      "location": "body"
    }
  ]
}
```

---

## Implementación en voice_gateway

### Flujo recomendado

```
1. Recibir datos del vecino (audio/texto + fotos)
2. Subir fotos a Supabase → obtener URLs
3. Subir audio a Supabase → obtener URL
4. Llamar a Claude AI con la transcripción para construir descripcion, tipo, subtipo, localizacion
5. Armar el payload con fotos_adjuntas y parte_adjuntos
6. POST /api/v1/novedades
7. Devolver novedad_code al vecino como confirmación
```

### Estructura del builder de payload (pseudocódigo)

```python
def build_novedad_payload(transcripcion, fotos_urls, audio_url, datos_vecino, gps):
    # Claude AI devuelve el análisis del incidente
    analisis = claude.analyze(transcripcion)

    fotos_adjuntas = [
        {"url": url, "nombre": f"foto_{i+1}.jpg", "tipo": "image/jpeg"}
        for i, url in enumerate(fotos_urls)
    ] if fotos_urls else None

    parte_adjuntos = [
        {
            "url": audio_url,
            "nombre": "audio_denuncia.m4a",
            "tipo": "audio/mp4",
            "duracion_seg": datos_vecino.get("audio_duracion_seg")
        }
    ] if audio_url else None

    return {
        "tipo_novedad_id": analisis["tipo_novedad_id"],
        "subtipo_novedad_id": analisis["subtipo_novedad_id"],
        "fecha_hora_ocurrencia": datetime.now().isoformat(),
        "descripcion": analisis["descripcion"],
        "localizacion": analisis.get("localizacion") or gps.get("direccion_aproximada"),
        "latitud": gps.get("latitud"),
        "longitud": gps.get("longitud"),
        "origen_llamada": "BOTON_DENUNCIA_VECINO_ALERTA",
        "reportante_nombre": datos_vecino.get("nombre"),
        "reportante_telefono": datos_vecino.get("telefono"),
        "es_anonimo": 0 if datos_vecino.get("nombre") else 1,
        "fotos_adjuntas": fotos_adjuntas,
        "parte_adjuntos": parte_adjuntos,
    }
```

### Convención de rutas en Supabase Storage

Se recomienda organizar los archivos por fecha para facilitar la auditoría:

```
bucket: denuncias
path:   {año}/{mes}/{dia}/{tipo}_{uuid}.{ext}

Ejemplos:
  2026/05/18/foto_3f8a2b1c.jpg
  2026/05/18/audio_9d4e7f2a.m4a
```

Permisos del bucket: `public` (lectura pública para que el backend y el frontend puedan acceder sin autenticación de Supabase).

---

## Validaciones que aplica el backend

| Campo | Validación |
|-------|-----------|
| `fotos_adjuntas` | Array de máx. 10 items. Cada item debe tener `url` válida. |
| `parte_adjuntos` | Array de máx. 10 items. Cada item debe tener `url` válida. |
| `url` en cada item | Se valida con `new URL(value)` — debe ser una URL completa con protocolo (`https://`) |
| Campos ausentes | Ambos campos son opcionales (`null` o ausente es válido) |

---

## Notas importantes

- Los campos `fotos_adjuntas` y `parte_adjuntos` se guardan **tal cual** en la BD como JSON. El backend no descarga ni procesa los archivos.
- Si Supabase devuelve una URL firmada (con expiración), asegurarse de usar la URL pública permanente, no la URL prefirmada.
- El campo `videos_adjuntos` también existe en el modelo para uso futuro, pero no está habilitado en el flujo actual del vecino.
- Al crear la novedad, el sistema emite automáticamente un evento SSE (`nueva_novedad`) a todos los operadores conectados al panel de control.
