# 📡 Implementación SSE — Novedades en Tiempo Real
> **Proyecto:** CitySecure Backend + Frontend  
> **Tecnología:** Server-Sent Events (SSE)  
> **Objetivo:** El operador ve nuevas Novedades instantáneamente sin hacer refresh  
> **Tiempo estimado:** 2-3 horas

---

## 🏗️ Arquitectura de la Solución

```
CitySecure Alert / WhatsApp / Telegram
        ↓
Voice Gateway crea Novedad en BD (POST /api/v1/novedades)
        ↓
Backend emite evento SSE a todos los clientes conectados
        ↓
Frontend (React) recibe el evento instantáneamente
        ↓
Lista de Novedades se actualiza — operador ve la novedad sin F5
```

---

## 📁 Archivos a Crear / Modificar

```
city_sec_backend_claude/
  src/
    utils/
      sse-manager.js          ← CREAR (gestor de conexiones SSE)
    routes/
      novedades.routes.js     ← MODIFICAR (agregar endpoint /stream)
    controllers/
      novedadesController.js ← MODIFICAR (notificar al crear novedad)

city_sec_frontend_v2/
  src/ (las carpetas son referenciales adaptar al proyectro real)
    hooks/
      useNovedadesStream.js   ← CREAR (hook React para SSE)
    components/novedades/
      NovedadesList.jsx       ← MODIFICAR (usar el hook)
      NovedadToast.jsx        ← CREAR (notificación visual)
```

---

## PASO 1 — Backend: Crear el SSE Manager

**Archivo:** `city_sec_backend_claude/src/utils/sse-manager.js`  
**Acción:** Crear archivo nuevo

```js
/**
 * @file sse-manager.js
 * @description Gestor de conexiones Server-Sent Events para CitySecure.
 * Mantiene un registro de todos los clientes conectados y permite
 * emitir eventos a todos ellos simultáneamente.
 */

import { logger } from './logger.js'; // ajusta la ruta según tu proyecto

// Mapa de clientes conectados: clientId → response object
const clients = new Map();

let clientCounter = 0;

/**
 * Registra un nuevo cliente SSE y devuelve su ID único.
 * Debe llamarse cuando el cliente se conecta al endpoint /stream.
 *
 * @param {import('express').Response} res - Objeto response de Express
 * @returns {number} clientId - ID único del cliente registrado
 */
export function addClient(res) {
  const clientId = ++clientCounter;
  clients.set(clientId, res);
  logger.info(`📡 [SSE] Cliente conectado. ID: ${clientId} | Total: ${clients.size}`);
  return clientId;
}

/**
 * Elimina un cliente del registro cuando se desconecta.
 *
 * @param {number} clientId - ID del cliente a eliminar
 */
export function removeClient(clientId) {
  clients.delete(clientId);
  logger.info(`📡 [SSE] Cliente desconectado. ID: ${clientId} | Total: ${clients.size}`);
}

/**
 * Emite un evento SSE a TODOS los clientes conectados.
 * Formato estándar SSE: "event: nombre\ndata: json\n\n"
 *
 * @param {string} eventName - Nombre del evento (ej: 'nueva_novedad')
 * @param {Object} data - Datos a enviar (se serializan como JSON)
 */
export function broadcastEvent(eventName, data) {
  if (clients.size === 0) {
    logger.debug(`📡 [SSE] No hay clientes conectados para el evento: ${eventName}`);
    return;
  }

  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

  logger.info(`📡 [SSE] Emitiendo "${eventName}" a ${clients.size} cliente(s)`);

  // Iterar sobre todos los clientes y enviar el evento
  for (const [clientId, res] of clients.entries()) {
    try {
      res.write(payload);
    } catch (error) {
      // Si falla la escritura, el cliente se desconectó — lo eliminamos
      logger.warn(`📡 [SSE] Error escribiendo al cliente ${clientId}, eliminando:`, error.message);
      removeClient(clientId);
    }
  }
}

/**
 * Devuelve la cantidad de clientes actualmente conectados.
 * Útil para health checks y métricas.
 *
 * @returns {number}
 */
export function getConnectedClientsCount() {
  return clients.size;
}
```

---

## PASO 2 — Backend: Agregar endpoint `/stream` en las rutas

**Archivo:** `city_sec_backend_claude/src/routes/v1/novedades.routes.js`  
**Acción:** Agregar la ruta GET `/stream` (antes del export)

```js
// Importar al inicio del archivo junto a los otros imports
import { addClient, removeClient } from '../../utils/sse-manager.js';

// ─── Agregar esta ruta ANTES del export del router ───────────────────────────

/**
 * GET /api/v1/novedades/stream
 * Endpoint SSE — mantiene conexión abierta y emite eventos en tiempo real.
 * El frontend se conecta una sola vez y recibe actualizaciones instantáneas.
 *
 * Requiere autenticación JWT igual que el resto de endpoints.
 */
router.get('/stream', authenticateToken, (req, res) => {
  // ── Configurar headers SSE ──────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Importante para Railway/Nginx
  res.flushHeaders(); // Enviar headers inmediatamente

  // ── Registrar cliente ───────────────────────────────────────────────────────
  const clientId = addClient(res);

  // ── Enviar evento inicial de confirmación ───────────────────────────────────
  // Confirma al frontend que la conexión SSE está activa
  res.write(`event: connected\ndata: ${JSON.stringify({
    message: 'Conectado al stream de novedades CitySecure',
    clientId,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  // ── Heartbeat cada 30 segundos ──────────────────────────────────────────────
  // Mantiene la conexión viva y evita timeouts en proxies/Railway
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n'); // Comentario SSE, no dispara eventos en el cliente
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  // ── Limpiar cuando el cliente se desconecta ─────────────────────────────────
  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(clientId);
  });
});
```

---

## PASO 3 — Backend: Notificar al crear una Novedad

**Archivo:** `city_sec_backend_claude/src/controllers/novedadesController.js`  
**Acción:** Importar `broadcastEvent` y llamarlo después de crear la novedad

### 3.1 — Agregar el import al inicio del archivo

```js
// Agregar junto a los otros imports existentes
import { broadcastEvent } from '../utils/sse-manager.js';
```

### 3.2 — Llamar a broadcastEvent después de crear la novedad

Busca en tu controller el bloque donde se crea la novedad exitosamente.  
Normalmente es algo como:

```js
// CÓDIGO EXISTENTE (no lo borres, solo agrega debajo)
const novedad = await NovedadIncidente.create(payload);

// ── AGREGAR ESTO después del create ─────────────────────────────────────────
// Notificar a todos los operadores conectados en tiempo real
broadcastEvent('nueva_novedad', {
  id: novedad.id,
  novedad_code: novedad.novedad_code,
  tipo_novedad_id: novedad.tipo_novedad_id,
  descripcion: novedad.descripcion,
  prioridad_actual: novedad.prioridad_actual,
  estado_novedad_id: novedad.estado_novedad_id,
  origen_llamada: novedad.origen_llamada,
  localizacion: novedad.localizacion,
  latitud: novedad.latitud,
  longitud: novedad.longitud,
  created_at: novedad.created_at,
});
// ─────────────────────────────────────────────────────────────────────────────
```

> **Nota:** Si usas transacciones de Sequelize, coloca el `broadcastEvent` DESPUÉS del `commit()` para garantizar que los datos ya están en BD antes de notificar.

---

## PASO 4 — Frontend: Crear el hook `useNovedadesStream`

**Archivo:** `city_sec_frontend_v2/src/hooks/useNovedadesStream.js`  
**Acción:** Crear archivo nuevo

```js
/**
 * @file useNovedadesStream.js
 * @description Hook React para conectarse al stream SSE de novedades.
 * Se conecta automáticamente al montar el componente y se desconecta
 * al desmontarlo. Llama a un callback cada vez que llega una novedad nueva.
 *
 * @example
 * // En tu componente de lista de novedades:
 * useNovedadesStream((novedad) => {
 *   setNovedades(prev => [novedad, ...prev]);
 *   toast.success(`Nueva novedad: ${novedad.novedad_code}`);
 * });
 */

import { useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const RECONNECT_DELAY_MS = 5000; // Reconectar tras 5s si se pierde la conexión

/**
 * Hook para escuchar el stream SSE de novedades en tiempo real.
 *
 * @param {Function} onNuevaNovedad - Callback que recibe la novedad nueva
 * @param {Object} options
 * @param {boolean} options.enabled - Si false, no se conecta (útil para roles sin acceso)
 */
export function useNovedadesStream(onNuevaNovedad, { enabled = true } = {}) {
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const onNuevaNovedad_stable = useCallback(onNuevaNovedad, []); // eslint-disable-line

  useEffect(() => {
    if (!enabled) return;

    // Obtener token JWT del localStorage (ajusta según tu sistema de auth)
    const token = localStorage.getItem('authToken') ||
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('authToken');

    if (!token) {
      console.warn('[SSE] No hay token JWT, no se conectará al stream');
      return;
    }

    /**
     * Establece la conexión SSE.
     * Se llama al montar y cada vez que hay que reconectar.
     */
    function connect() {
      // Cerrar conexión previa si existe
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Construir URL con token como query param
      // (EventSource no soporta headers personalizados)
      const url = `${API_URL}/api/v1/novedades/stream?token=${token}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // ── Evento: conexión establecida ────────────────────────────────────────
      eventSource.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        console.info(`[SSE] ✅ Conectado al stream. ClientID: ${data.clientId}`);
      });

      // ── Evento: nueva novedad ───────────────────────────────────────────────
      eventSource.addEventListener('nueva_novedad', (e) => {
        try {
          const novedad = JSON.parse(e.data);
          console.info(`[SSE] 🚨 Nueva novedad recibida: ${novedad.novedad_code}`);
          onNuevaNovedad_stable(novedad);
        } catch (error) {
          console.error('[SSE] Error parseando nueva_novedad:', error);
        }
      });

      // ── Evento: error de conexión ───────────────────────────────────────────
      eventSource.onerror = (error) => {
        console.warn('[SSE] ⚠️ Error de conexión, reconectando en 5s...', error);
        eventSource.close();
        // Reconectar automáticamente después de RECONNECT_DELAY_MS
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    // ── Cleanup al desmontar el componente ──────────────────────────────────
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      console.info('[SSE] 🔌 Desconectado del stream');
    };
  }, [enabled, onNuevaNovedad_stable]);
}
```

> **Nota sobre autenticación:** `EventSource` no soporta enviar headers `Authorization`. Por eso el token se pasa como query param `?token=`. En el backend debes aceptar el token tanto del header como del query param en el endpoint `/stream`. Ver sección de ajuste en PASO 2.

---

## PASO 5 — Frontend: Crear el componente Toast de notificación

**Archivo:** `city_sec_frontend_v2/src/components/novedades/NovedadToast.jsx`  
**Acción:** Crear archivo nuevo

```jsx
/**
 * @file NovedadToast.jsx
 * @description Notificación visual cuando llega una nueva novedad en tiempo real.
 * Aparece en la esquina inferior derecha y desaparece automáticamente.
 */

import { useState, useEffect } from 'react';

/**
 * @param {Object} props
 * @param {Object} props.novedad - Datos de la novedad nueva
 * @param {Function} props.onClose - Callback para cerrar el toast
 */
export function NovedadToast({ novedad, onClose }) {
  const [visible, setVisible] = useState(true);

  // Auto-cerrar después de 8 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Dar tiempo a la animación de salida
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  // Color según prioridad
  const prioridadColor = {
    ALTA: 'border-red-500 bg-red-50',
    MEDIA: 'border-yellow-500 bg-yellow-50',
    BAJA: 'border-green-500 bg-green-50',
  }[novedad.prioridad_actual] || 'border-blue-500 bg-blue-50';

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 w-80
      border-l-4 rounded-lg shadow-lg p-4
      animate-slide-in-right
      ${prioridadColor}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚨</span>
          <span className="font-bold text-gray-800 text-sm">
            Nueva Novedad
          </span>
        </div>
        <button
          onClick={() => { setVisible(false); onClose(); }}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Código */}
      <p className="text-xs font-mono text-gray-500 mb-1">
        {novedad.novedad_code || `#${novedad.id}`}
      </p>

      {/* Descripción */}
      <p className="text-sm text-gray-700 line-clamp-2">
        {novedad.descripcion || 'Nuevo incidente registrado'}
      </p>

      {/* Ubicación */}
      {novedad.localizacion && (
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <span>📍</span> {novedad.localizacion}
        </p>
      )}

      {/* Prioridad + Origen */}
      <div className="flex items-center justify-between mt-2">
        <span className={`
          text-xs font-semibold px-2 py-0.5 rounded-full
          ${novedad.prioridad_actual === 'ALTA' ? 'bg-red-200 text-red-800' :
            novedad.prioridad_actual === 'MEDIA' ? 'bg-yellow-200 text-yellow-800' :
            'bg-green-200 text-green-800'}
        `}>
          {novedad.prioridad_actual}
        </span>
        <span className="text-xs text-gray-400">
          {novedad.origen_llamada?.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}
```

---

## PASO 6 — Frontend: Integrar en el componente de Novedades

**Archivo:** `city_sec_frontend_v2/src/components/novedades/NovedadesList.jsx`  
**Acción:** Agregar el hook y el toast al componente existente

```jsx
// ── Agregar estos imports al inicio ──────────────────────────────────────────
import { useState, useCallback } from 'react';
import { useNovedadesStream } from '../../hooks/useNovedadesStream';
import { NovedadToast } from './NovedadToast';

// ── Dentro del componente NovedadesList ───────────────────────────────────────

export function NovedadesList() {
  // ... tu estado existente ...

  // Estado para el toast de nueva novedad
  const [toastNovedad, setToastNovedad] = useState(null);

  // ── Conectar al stream SSE ────────────────────────────────────────────────
  const handleNuevaNovedad = useCallback((novedad) => {
    // 1. Agregar la novedad al inicio de la lista sin recargar todo
    setNovedades(prev => [novedad, ...prev]);

    // 2. Mostrar notificación visual
    setToastNovedad(novedad);

    // 3. Opcional: sonido de alerta
    // new Audio('/sounds/alert.mp3').play().catch(() => {});

    // 4. Opcional: actualizar el título del tab
    document.title = `🚨 Nueva Novedad — CitySecure`;
    setTimeout(() => { document.title = 'CitySecure'; }, 5000);
  }, []);

  useNovedadesStream(handleNuevaNovedad);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Tu lista de novedades existente */}
      {/* ... */}

      {/* Toast de nueva novedad — agregar al final del JSX */}
      {toastNovedad && (
        <NovedadToast
          novedad={toastNovedad}
          onClose={() => setToastNovedad(null)}
        />
      )}
    </div>
  );
}
```

---

## PASO 7 — Ajuste de autenticación en el endpoint `/stream`

Como `EventSource` no soporta headers, el token llega como query param.  
Agrega este ajuste en el middleware de autenticación **solo para esta ruta**:

**En `city_sec_backend_claude/src/routes/novedades.routes.js`:**

```js
// Middleware que acepta token del header O del query param (solo para SSE)
function authenticateSSE(req, res, next) {
  // Intentar header primero (Bearer token)
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  // Fallback a query param (para EventSource)
  const queryToken = req.query.token;

  const token = headerToken || queryToken;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  // Reutilizar la misma lógica de verificación JWT que ya tienes
  try {
    const decoded = verifyJWT(token); // tu función existente
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Cambiar authenticateToken → authenticateSSE solo en la ruta /stream
router.get('/stream', authenticateSSE, (req, res) => {
  // ... el handler del PASO 2 ...
});
```

---

## PASO 8 — Configuración Railway (importante)

Railway usa un proxy que puede cortar conexiones SSE largas.  
Agrega estas variables de entorno en el servicio del **backend**:

```env
# En Railway → Variables del backend
SSE_TIMEOUT=0          # Sin timeout para conexiones SSE
```

Y verifica que el header `X-Accel-Buffering: no` esté presente (ya está en el PASO 2).

---

## 🧪 Cómo Probar

### Prueba 1 — Verificar el endpoint SSE desde terminal

```bash
# Reemplaza TOKEN con tu JWT real
curl -N -H "Authorization: Bearer TOKEN" \
  https://citysecbackendclaude-production.up.railway.app/api/v1/novedades/stream
```

Deberías ver:
```
event: connected
data: {"message":"Conectado al stream de novedades CitySecure","clientId":1}

: heartbeat
: heartbeat
```

### Prueba 2 — Verificar desde el frontend

1. Abre la pantalla de Novedades en CitySecure
2. Abre la consola del navegador (F12)
3. Deberías ver: `[SSE] ✅ Conectado al stream. ClientID: 1`
4. Envía un audio desde WhatsApp o CitySecure Alert
5. Deberías ver: `[SSE] 🚨 Nueva novedad recibida: NOV-2026-XXX`
6. La novedad aparece en la lista y el toast en la esquina

---

## 📊 Flujo Completo Final

```
Vecino envía audio por WhatsApp
        ↓
Voice Gateway procesa → POST /api/v1/novedades
        ↓
novedades.controller.js crea la Novedad en MySQL
        ↓
broadcastEvent('nueva_novedad', novedad)   ← NUEVO
        ↓
sse-manager.js escribe en todos los res SSE abiertos
        ↓
Frontend recibe evento 'nueva_novedad'     ← NUEVO
        ↓
useNovedadesStream llama handleNuevaNovedad
        ↓
setNovedades(prev => [novedad, ...prev])   ← Lista se actualiza
        ↓
<NovedadToast> aparece en pantalla         ← Operador es notificado
```

---

## 🚀 Orden de Implementación Sugerido

| Paso | Acción                                 | Tiempo |
|------|----------------------------------------|--------|
|   1  | Crear `sse-manager.js`                 | 10 min |
|   2  | Agregar ruta `/stream`                 | 15 min |
|   3  | Agregar `broadcastEvent` en controller | 10 min |
|   4  | Crear `useNovedadesStream.js`          | 20 min |
|   5  | Crear `NovedadToast.jsx`               | 20 min |
|   6  | Integrar en `NovedadesList.jsx`        | 20 min |
|   7  | Ajustar autenticación SSE              | 15 min |
| **Test completo** | Audio → Novedad → Toast | 15 min |

| **Test backend** | `curl` al endpoint | 10 min |

| 8 | Configurar Railway | 5 min |

**Total estimado: 2 horas**

---

## ⚠️ Consideraciones Futuras

Cuando el sistema escale a **múltiples instancias** en Railway (varios contenedores corriendo en paralelo), el `Map` de clientes en memoria no funcionará entre instancias. En ese momento migrar a:

- **Redis Pub/Sub** — cada instancia se suscribe a Redis y reenvía los eventos a sus clientes locales
- **Socket.io con Redis adapter** — la solución más robusta para producción distribuida

Por ahora con una sola instancia en Railway, el enfoque con `Map` en memoria es perfecto.

---

*Documento generado: 31 de marzo de 2026*  
*CitySecure — Sistema de Gestión de Seguridad Ciudadana | Lima, Perú*
