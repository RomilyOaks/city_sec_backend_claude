# Frontend — Adjuntos en Novedades (fotos + audio)
## Cómo consumir `fotos_adjuntas` y `parte_adjuntos`

**Versión:** 1.0  
**Fecha:** 2026-05-18  
**Aplica a:** Panel de operaciones CitySec · Detalle de novedad · Lista de novedades

---

## Estado del backend

Los campos ya están disponibles **sin cambios adicionales** en el backend.  
Se retornan automáticamente en todos los endpoints principales de novedades:

| Endpoint | Incluye adjuntos |
|----------|-----------------|
| `GET /api/v1/novedades` | ✅ Sí (lista paginada) |
| `GET /api/v1/novedades/:id` | ✅ Sí (detalle completo) |
| `POST /api/v1/novedades` (respuesta) | ✅ Sí |
| `PUT /api/v1/novedades/:id` (respuesta) | ✅ Sí |
| `GET /api/v1/novedades/dashboard/stats` | ➖ No aplica (agregación) |
| `GET /api/v1/novedades/dashboard/en-atencion` | ➖ No aplica (widget de conteo) |

---

## Estructura de la respuesta

### Novedad con adjuntos — respuesta de `GET /api/v1/novedades/:id`

```json
{
  "success": true,
  "data": {
    "id": 1042,
    "novedad_code": "0000001042",
    "descripcion": "Vecino reporta presencia de sujetos sospechosos...",
    "origen_llamada": "BOTON_DENUNCIA_VECINO_ALERTA",
    "prioridad_actual": "ALTA",
    "reportante_nombre": "Juan Pérez",
    "reportante_telefono": "987654321",

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
    ],

    "videos_adjuntos": null,

    "novedadTipoNovedad": { "id": 3, "nombre": "Sospechosos", "color_hex": "#FF8C00" },
    "novedadEstado": { "id": 1, "nombre": "REPORTADA", "color_hex": "#6B7280" }
  }
}
```

### Valores posibles de los campos adjuntos

| Valor | Significado |
|-------|-------------|
| `null` | No se adjuntó nada en ese campo |
| `[]` | Array vacío (no debería ocurrir, pero manejarlo igual que `null`) |
| `[{ url, nombre, tipo, ... }]` | Uno o más archivos adjuntos |

---

## Reglas de renderizado

### `fotos_adjuntas`
- Cada item con `tipo` que empiece con `image/` → renderizar como `<img>`
- La `url` es pública de Supabase — no requiere autenticación para acceder
- Máximo 10 fotos por novedad

### `parte_adjuntos`
- Cada item con `tipo` que empiece con `audio/` → renderizar como `<audio>`
- Cada item con `tipo` = `application/pdf` → enlace de descarga o visor PDF
- Otros tipos → enlace de descarga genérico

### `videos_adjuntos`
- Campo reservado para uso futuro
- Tratar igual que `parte_adjuntos` con tipos `video/*`
- Por ahora, siempre llega como `null`

---

## Ejemplos de código

### React — Componente `AdjuntosNovedad`

```jsx
// components/AdjuntosNovedad.jsx

export function AdjuntosNovedad({ novedad }) {
  const fotos = novedad.fotos_adjuntas ?? []
  const partes = novedad.parte_adjuntos ?? []

  const audios = partes.filter(p => p.tipo?.startsWith('audio/'))
  const documentos = partes.filter(p => !p.tipo?.startsWith('audio/'))

  const hayAdjuntos = fotos.length > 0 || partes.length > 0
  if (!hayAdjuntos) return null

  return (
    <section className="adjuntos-novedad">
      {/* ── Fotos ───────────────────────────────────── */}
      {fotos.length > 0 && (
        <div className="adjuntos-fotos">
          <h4>Fotos ({fotos.length})</h4>
          <div className="fotos-grid">
            {fotos.map((foto, i) => (
              <a key={i} href={foto.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={foto.url}
                  alt={foto.nombre ?? `Foto ${i + 1}`}
                  className="foto-thumb"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Audios ──────────────────────────────────── */}
      {audios.length > 0 && (
        <div className="adjuntos-audios">
          <h4>Audio del reporte</h4>
          {audios.map((audio, i) => (
            <div key={i} className="audio-item">
              <span className="audio-nombre">{audio.nombre ?? `Audio ${i + 1}`}</span>
              {audio.duracion_seg && (
                <span className="audio-duracion">
                  {Math.floor(audio.duracion_seg / 60)}:{String(audio.duracion_seg % 60).padStart(2, '0')} min
                </span>
              )}
              <audio controls src={audio.url} preload="none">
                Tu navegador no soporta reproducción de audio.
              </audio>
            </div>
          ))}
        </div>
      )}

      {/* ── Documentos / otros ──────────────────────── */}
      {documentos.length > 0 && (
        <div className="adjuntos-documentos">
          <h4>Documentos adjuntos</h4>
          {documentos.map((doc, i) => (
            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.nombre}>
              📎 {doc.nombre ?? `Documento ${i + 1}`}
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
```

### React — Badge en la tabla de lista de novedades

Para mostrar un indicador visual en la tabla (no cargar las imágenes, solo informar que existen):

```jsx
// Dentro del componente de fila de tabla
function BadgeAdjuntos({ novedad }) {
  const nFotos = novedad.fotos_adjuntas?.length ?? 0
  const nAudio = novedad.parte_adjuntos?.length ?? 0

  if (nFotos === 0 && nAudio === 0) return null

  return (
    <span className="badge-adjuntos" title={`${nFotos} foto(s), ${nAudio} audio(s)`}>
      {nFotos > 0 && <span>📷 {nFotos}</span>}
      {nAudio > 0 && <span>🎙 {nAudio}</span>}
    </span>
  )
}
```

### Vue 3 — Composable `useAdjuntosNovedad`

```js
// composables/useAdjuntosNovedad.js
import { computed } from 'vue'

export function useAdjuntosNovedad(novedad) {
  const fotos = computed(() => novedad.value?.fotos_adjuntas ?? [])
  const partes = computed(() => novedad.value?.parte_adjuntos ?? [])

  const audios = computed(() =>
    partes.value.filter(p => p.tipo?.startsWith('audio/'))
  )
  const documentos = computed(() =>
    partes.value.filter(p => !p.tipo?.startsWith('audio/'))
  )

  const tieneAdjuntos = computed(() =>
    fotos.value.length > 0 || partes.value.length > 0
  )

  return { fotos, audios, documentos, tieneAdjuntos }
}
```

```vue
<!-- AdjuntosNovedad.vue -->
<template>
  <section v-if="tieneAdjuntos" class="adjuntos-novedad">
    <!-- Fotos -->
    <div v-if="fotos.length" class="adjuntos-fotos">
      <h4>Fotos ({{ fotos.length }})</h4>
      <div class="fotos-grid">
        <a v-for="(foto, i) in fotos" :key="i" :href="foto.url" target="_blank">
          <img :src="foto.url" :alt="foto.nombre ?? `Foto ${i + 1}`" loading="lazy" />
        </a>
      </div>
    </div>

    <!-- Audios -->
    <div v-if="audios.length" class="adjuntos-audios">
      <h4>Audio del reporte</h4>
      <div v-for="(audio, i) in audios" :key="i" class="audio-item">
        <span>{{ audio.nombre ?? `Audio ${i + 1}` }}</span>
        <audio controls :src="audio.url" preload="none" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { toRef } from 'vue'
import { useAdjuntosNovedad } from '@/composables/useAdjuntosNovedad'

const props = defineProps({ novedad: Object })
const { fotos, audios, documentos, tieneAdjuntos } = useAdjuntosNovedad(toRef(props, 'novedad'))
</script>
```

---

## Casos edge a manejar

```js
// Función utilitaria de guardia — usar antes de renderizar
function normalizarAdjuntos(campo) {
  if (!campo || !Array.isArray(campo)) return []
  return campo.filter(item => item && typeof item.url === 'string' && item.url.length > 0)
}

// Uso:
const fotos = normalizarAdjuntos(novedad.fotos_adjuntas)
const partes = normalizarAdjuntos(novedad.parte_adjuntos)
```

| Caso | Comportamiento esperado |
|------|------------------------|
| `fotos_adjuntas: null` | No mostrar sección de fotos |
| `fotos_adjuntas: []` | No mostrar sección de fotos |
| URL de Supabase con error 403/404 | Mostrar placeholder de imagen rota |
| Audio sin soporte en navegador | El elemento `<audio>` muestra mensaje de fallback |
| `duracion_seg` ausente o `null` | No mostrar duración |
| `nombre` ausente o `null` | Usar `"Foto N"` / `"Audio N"` como fallback |

---

## CSS sugerido (Tailwind)

```jsx
// Fotos en grid responsivo
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
  {fotos.map((foto, i) => (
    <a key={i} href={foto.url} target="_blank" rel="noopener noreferrer"
       className="block overflow-hidden rounded-lg border border-gray-200 hover:border-blue-400 transition-colors">
      <img src={foto.url} alt={foto.nombre}
           className="w-full h-32 object-cover" loading="lazy" />
    </a>
  ))}
</div>

// Audio player
<div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
    <span>🎙</span>
    <span className="font-medium">{audio.nombre}</span>
    {audio.duracion_seg && (
      <span className="text-gray-400">
        {Math.floor(audio.duracion_seg / 60)}:{String(audio.duracion_seg % 60).padStart(2, '0')}
      </span>
    )}
  </div>
  <audio controls src={audio.url} preload="none" className="w-full h-8" />
</div>
```

---

## Dónde mostrar los adjuntos en el panel

| Vista | Recomendación |
|-------|---------------|
| **Tabla lista de novedades** | Badge contador `📷 2  🎙 1` — no cargar las imágenes |
| **Modal de detalle rápido** | Sección colapsable al pie, fotos en grid 2×N, audio debajo |
| **Vista detalle completa** | Sección expandida con lightbox para fotos y player de audio |
| **PDF / exportación** | Incluir URLs como hipervínculos o embeber miniaturas si el generador lo soporta |

---

## Lightbox recomendado (opcional)

Si el panel ya usa una librería de UI, verificar compatibilidad:

- **Shadcn/UI + React**: implementar Dialog con `<img>` a tamaño completo
- **Vue + Naive UI**: usar `n-image` con `preview-src-list`
- **Sin librería**: `<dialog>` nativo de HTML5 es suficiente para este caso de uso
