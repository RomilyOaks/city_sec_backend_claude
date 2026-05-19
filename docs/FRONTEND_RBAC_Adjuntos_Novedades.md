# Frontend — Control de acceso RBAC para adjuntos en novedades

**Versión:** 1.0  
**Fecha:** 2026-05-18  
**Complementa:** `FRONTEND_Adjuntos_Novedades.md`

---

## Nuevos permisos

Se agregaron tres slugs al sistema de permisos para controlar el acceso a los adjuntos (fotos y audio) originados desde la app **vecino alerta**.

| Slug | Recurso | Acción | Descripción |
|------|---------|--------|-------------|
| `novedades.fotos.viewer` | Fotos | Ver | Recibir las URLs de fotos en la respuesta JSON |
| `novedades.fotos.downloader` | Fotos | Descargar | Mostrar botón de descarga / abrir en pestaña nueva |
| `novedades.audio.player` | Audio | Reproducir | Recibir las URLs de audio en la respuesta JSON |

---

## Dónde aplica cada permiso

### Permisos de backend (campo redactado en JSON)

Los siguientes permisos controlan si el **campo aparece o no en la respuesta**:

| Permiso | Campo afectado | Sin permiso |
|---------|----------------|-------------|
| `novedades.fotos.viewer` | `fotos_adjuntas` | El campo llega como `null` |
| `novedades.audio.player` | `parte_adjuntos` | El campo llega como `null` |

El backend redacta los campos directamente — el frontend **no puede bypass** este control aunque tenga la URL.

### Permisos de frontend (UI/UX)

El permiso `novedades.fotos.downloader` **no redacta ningún campo** en el JSON. Su uso es exclusivamente en el frontend: controla si se muestra el botón de descarga o el enlace de apertura en pestaña nueva.

---

## Política de asignación por rol

| Rol | `viewer` | `downloader` | `player` |
|-----|:--------:|:------------:|:--------:|
| `super_admin` | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ |
| `supervisor` | ✅ | ✅ | ✅ |
| `operador` | ✅ | ❌ | ✅ |
| `consulta` | ✅ | ❌ | ✅ |
| `usuario_basico` | ❌ | ❌ | ❌ |

---

## Cómo leer los permisos del usuario en el frontend

El login devuelve el token JWT. Al decodificarlo (o al llamar `GET /api/v1/auth/profile`), el frontend obtiene los permisos del usuario activo:

```js
// Respuesta de GET /api/v1/auth/profile (o del contexto de sesión)
{
  "id": 5,
  "username": "jperez",
  "rol": "operador",
  "roles": ["operador"],
  "permisos": [
    "novedades.incidentes.read",
    "novedades.fotos.viewer",
    "novedades.audio.player",
    // ... otros permisos del rol
  ]
}
```

---

## Ejemplos de código

### Hook de permisos (React)

```js
// hooks/usePermisos.js
import { useAuth } from './useAuth' // tu contexto de sesión

export function usePermisos() {
  const { user } = useAuth()
  const permisos = user?.permisos ?? []

  return {
    puede: (slug) => permisos.includes(slug),
    puedeVerFotos:      permisos.includes('novedades.fotos.viewer'),
    puedeDescargarFotos: permisos.includes('novedades.fotos.downloader'),
    puedeReproducirAudio: permisos.includes('novedades.audio.player'),
  }
}
```

### Componente con control RBAC (React)

```jsx
// components/AdjuntosNovedad.jsx
import { usePermisos } from '@/hooks/usePermisos'

export function AdjuntosNovedad({ novedad }) {
  const { puedeVerFotos, puedeDescargarFotos, puedeReproducirAudio } = usePermisos()

  // El backend ya redacta los campos null si no hay permiso,
  // pero la guardia local evita renders innecesarios.
  const fotos = novedad.fotos_adjuntas ?? []
  const audios = (novedad.parte_adjuntos ?? []).filter(p => p.tipo?.startsWith('audio/'))

  const hayContenido = fotos.length > 0 || audios.length > 0
  if (!hayContenido) return null

  return (
    <section className="adjuntos-novedad">

      {/* ── Fotos ─────────────────────────────────── */}
      {puedeVerFotos && fotos.length > 0 && (
        <div className="adjuntos-fotos">
          <h4>Fotos ({fotos.length})</h4>
          <div className="fotos-grid">
            {fotos.map((foto, i) => (
              <div key={i} className="foto-item">
                <img
                  src={foto.url}
                  alt={foto.nombre ?? `Foto ${i + 1}`}
                  loading="lazy"
                  className="foto-thumb"
                />

                {/* Botón de descarga: solo si tiene permiso downloader */}
                {puedeDescargarFotos && (
                  <a
                    href={foto.url}
                    download={foto.nombre ?? `foto_${i + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-descargar"
                    title="Descargar foto"
                  >
                    ⬇ Descargar
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Audios ────────────────────────────────── */}
      {puedeReproducirAudio && audios.length > 0 && (
        <div className="adjuntos-audios">
          <h4>Audio del reporte</h4>
          {audios.map((audio, i) => (
            <div key={i} className="audio-item">
              <span>{audio.nombre ?? `Audio ${i + 1}`}</span>
              <audio controls src={audio.url} preload="none">
                Tu navegador no soporta audio.
              </audio>
            </div>
          ))}
        </div>
      )}

    </section>
  )
}
```

### Composable Vue 3

```js
// composables/usePermisosAdjuntos.js
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function usePermisosAdjuntos() {
  const auth = useAuthStore()
  const permisos = computed(() => auth.user?.permisos ?? [])

  return {
    puedeVerFotos:        computed(() => permisos.value.includes('novedades.fotos.viewer')),
    puedeDescargarFotos:  computed(() => permisos.value.includes('novedades.fotos.downloader')),
    puedeReproducirAudio: computed(() => permisos.value.includes('novedades.audio.player')),
  }
}
```

```vue
<!-- En el template -->
<template>
  <section v-if="hayContenido">

    <div v-if="puedeVerFotos && fotos.length">
      <img v-for="(foto, i) in fotos" :key="i" :src="foto.url" loading="lazy" />
      <a v-if="puedeDescargarFotos" :href="foto.url" :download="foto.nombre">
        Descargar
      </a>
    </div>

    <div v-if="puedeReproducirAudio && audios.length">
      <audio v-for="(a, i) in audios" :key="i" controls :src="a.url" preload="none" />
    </div>

  </section>
</template>
```

---

## Comportamiento por escenario

### Usuario con rol `operador`
- `fotos_adjuntas` → llega con las URLs ✅ (`viewer` asignado)
- `parte_adjuntos` → llega con las URLs ✅ (`player` asignado)
- Botón de descarga → **NO mostrar** (`downloader` NO asignado)

```json
// Respuesta del backend para operador:
{
  "fotos_adjuntas": [{ "url": "https://...", "nombre": "foto_001.jpg" }],
  "parte_adjuntos": [{ "url": "https://...", "nombre": "audio_001.m4a" }]
}
```

### Usuario con rol `consulta`
- `fotos_adjuntas` → llega con las URLs ✅
- `parte_adjuntos` → llega con las URLs ✅
- Botón de descarga → **NO mostrar**

### Usuario con rol `admin` o `supervisor`
- `fotos_adjuntas` → llega con las URLs ✅
- `parte_adjuntos` → llega con las URLs ✅
- Botón de descarga → **Mostrar** ✅

### Usuario sin ningún permiso de adjuntos (`usuario_basico`)
- `fotos_adjuntas` → llega como `null` (redactado por backend)
- `parte_adjuntos` → llega como `null` (redactado por backend)
- Sección de adjuntos → **no renderizar**

```json
// Respuesta del backend para usuario_basico:
{
  "fotos_adjuntas": null,
  "parte_adjuntos": null
}
```

---

## Endpoints afectados por el filtrado de backend

| Endpoint | Aplica filtrado |
|----------|----------------|
| `GET /api/v1/novedades` | ✅ Sí |
| `GET /api/v1/novedades/:id` | ✅ Sí |
| `POST /api/v1/novedades` (respuesta crear) | No — el creador tiene permiso por construcción |
| `PUT /api/v1/novedades/:id` (respuesta actualizar) | No — solo supervisor/admin |

---

## Checklist de implementación en frontend

- [ ] Agregar `puedeVerFotos`, `puedeDescargarFotos`, `puedeReproducirAudio` al hook/composable de permisos
- [ ] Guardar permisos del usuario en el store de sesión tras login
- [ ] En el componente de detalle de novedad: condicionar render de fotos con `puedeVerFotos`
- [ ] En el componente de detalle de novedad: condicionar render de audio con `puedeReproducirAudio`
- [ ] El botón/enlace de descarga de foto: mostrarlo solo si `puedeDescargarFotos`
- [ ] En la tabla de lista: el badge `📷 N` solo mostrarlo si `puedeVerFotos && fotos.length > 0`
- [ ] Normalizar siempre con guardia: `novedad.fotos_adjuntas ?? []` antes de iterar
