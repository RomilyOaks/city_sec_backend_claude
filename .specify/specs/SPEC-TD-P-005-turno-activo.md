# SPEC — TD-P-005: Turno Activo del Sereno al Iniciar la App
**Versión:** 1.0  
**Fecha:** 2026-06-05  
**Autor:** Romily Robles  
**Repo principal afectado:** `city_sec_backend_claude`  
**Repo secundario afectado:** `city_sec_patrol`  
**Prioridad:** ALTA  
**Estado:** Borrador — pendiente de aprobación

---

## 1. Problema que resuelve

### Situación actual

La app `city_sec_patrol` tiene un campo `turnoActivo` en el `trackingStore`, pero
**nadie lo llena desde el backend**. Al arrancar la app, el sereno debe activar el
GPS manualmente sin que el sistema valide si realmente tiene un turno asignado hoy,
ni qué vehículo le corresponde (en caso de patrullaje vehicular).

Las consecuencias prácticas son dos:

1. **Contaminación del mapa operativo:** Si el sereno activa el GPS fuera de turno
   o con un `vehiculo_id` incorrecto (hardcodeado o seleccionado manualmente), el
   Mapa Operativo del dashboard muestra posiciones no autorizadas o asignadas al
   vehículo equivocado.

2. **HomeScreen sin datos reales:** La pantalla de inicio no puede mostrar información
   útil del turno ("Turno Mañana · 08:00–16:00 · Vehículo PB-123") porque no consulta
   el backend al arrancar.

### Qué ya existe

El endpoint `GET /api/v1/horarios-turnos/activo` **ya existe** en el backend.
Devuelve el horario de turno activo en función de la hora actual del servidor
(campos: nombre del turno, hora inicio, hora fin). **No devuelve** el vehículo
ni el cuadrante asignado al sereno logueado.

### Lo que falta

Un nuevo endpoint que, dado el usuario autenticado, devuelva:
- El horario de turno activo (consumiendo la lógica existente).
- El vehículo asignado al sereno como conductor (si aplica).
- El cuadrante asignado al vehículo o al personal (si está predefinido).
- Si no hay turno activo o no hay asignación: `data: null` (no es un error).

---

## 2. Contexto técnico

### Flujo actual (incompleto)

```
[App.jsx — init()]
  └─► authStore.init()
        └─► valida JWT
        └─► carga usuario
        └─► NO consulta turno activo ← gap

[HomeScreen.jsx]
  └─► muestra datos del store
        └─► turnoActivo: null siempre ← gap
        └─► vehiculoAsignado: null siempre ← gap
```

### Flujo objetivo

```
[App.jsx — init()]
  └─► authStore.init()
        └─► valida JWT
        └─► carga usuario
        └─► GET /api/v1/patrullaje/turno-activo  ← NUEVO
              └─► llena trackingStore.turnoActivo
              └─► llena trackingStore.vehiculoAsignado (si aplica)
              └─► llena trackingStore.cuadranteAsignado (si aplica)

[HomeScreen.jsx]
  └─► muestra turno, vehículo y cuadrante desde el store ← COMPLETO
```

### Tablas involucradas en el backend

| Tabla | Columnas clave | Rol |
|---|---|---|
| `citysecure.usuarios` | `id`, `personal_seguridad_id` | Punto de entrada desde el JWT |
| `citysecure.personal_seguridad` | `id`, `nombres`, `apellido_paterno` | Intermediario entre usuario y operativos |
| `citysecure.horarios_turnos` | `hora_inicio`, `hora_fin`, `orden` | Horario activo según hora actual |
| `citysecure.operativos_vehiculos` | `conductor_id`, `copiloto_id`, `vehiculo_id`, `hora_inicio`, `hora_fin`, `deleted_at` | Operativo vehicular del día |
| `citysecure.operativos_vehiculos_cuadrantes` | — | Cuadrantes del operativo vehicular |
| `citysecure.operativos_personal` | `personal_id`, `sereno_id`, `tipo_patrullaje`, `hora_inicio`, `hora_fin`, `deleted_at` | Operativo a pie del día |
| `citysecure.operativos_personal_cuadrantes` | — | Cuadrantes del operativo personal |

### Join completo para encontrar el turno del usuario logueado

```
JWT (usuario_id)
  └─► citysecure.usuarios.id
        └─► citysecure.usuarios.personal_seguridad_id
              └─► citysecure.personal_seguridad.id
                    │
                    ├─► operativos_vehiculos.conductor_id  → rol: CONDUCTOR
                    ├─► operativos_vehiculos.copiloto_id   → rol: COPILOTO
                    ├─► operativos_personal.personal_id    → rol: SERENO PRINCIPAL
                    └─► operativos_personal.sereno_id      → rol: SERENO AUXILIAR
```

### Lógica de asignación (importante para el spec)

- El `usuario_id` del JWT se usa para obtener `usuarios.personal_seguridad_id`.
- Ese `personal_seguridad_id` es el que se compara contra `conductor_id`, `copiloto_id`,
  `personal_id` y `sereno_id` en las tablas de operativos.
- Un sereno puede aparecer en **cualquiera** de los 4 roles — el endpoint busca en todos.
- Los cuadrantes pueden estar predefinidos o no — si no existen, `cuadrante: null`. No es error.
- Soft delete: filtrar siempre `deleted_at IS NULL` en operativos.

### Restricciones de arquitectura

- Backend: **Express 5 + Sequelize + Supabase PostgreSQL** (schema `citysecure`) — BD primaria.
- Backend: **Express 5 + Sequelize + MySQL Railway** — BD secundaria (misma lógica, distinto dialecto).
- El dialecto se controla con `DB_DIALECT` — nunca simultáneo, siempre uno u otro.
- Middleware existente: `verificarToken`, `verificarRolesOPermisos`, `requirePermission`.
- Respuesta estándar: `{ success: boolean, message: string, data: any }`.
- El APK usa Axios con interceptor JWT — no requiere cambios en `client.js`.

---

## 3. Outcomes — qué debe hacer esta feature

### Outcome 1 — HomeScreen muestra datos reales del turno

**Dado** que un sereno con rol `sereno` inicia sesión en la app,  
**cuando** la `HomeScreen` termina de cargar,  
**entonces** muestra el nombre del turno, hora inicio y hora fin obtenidos
del backend — no valores hardcodeados ni null.

### Outcome 2 — Vehículo asignado visible (patrullaje vehicular)

**Dado** que el sereno está registrado como conductor en `operativos_vehiculos`
para el día actual,  
**cuando** la app carga el turno activo,  
**entonces** el store tiene el `vehiculo_id` y la placa del vehículo asignado,
y la HomeScreen los muestra.

### Outcome 3 — Patrullaje a pie sin vehículo

**Dado** que el sereno está registrado en `operativos_personal` (a pie),  
**cuando** la app carga el turno activo,  
**entonces** `vehiculo_id` es `null` y la HomeScreen muestra "Patrullaje a pie".

### Outcome 4 — Sin turno activo

**Dado** que el sereno no tiene turno asignado en el horario actual,  
**cuando** la app consulta el endpoint,  
**entonces** el endpoint responde `{ success: true, data: null }` y la
HomeScreen muestra "Sin turno activo".

### Outcome 5 — GPS bloqueado sin turno asignado

**Dado** que `turnoActivo` es `null` en el store,  
**cuando** el sereno intenta activar el tracking GPS,  
**entonces** el switch de GPS está deshabilitado y muestra el mensaje
"No tienes turno asignado para este horario".

---

## 4. Scope — qué NO incluye este spec

- ❌ No se crea la gestión de turnos ni operativos desde la app (eso se hace en el dashboard web).
- ❌ No se modifica el flujo de despacho de novedades — ese proceso es independiente.
- ❌ No se implementa asignación automática de cuadrante — solo se lee si ya existe.
- ❌ No se modifica el endpoint existente `GET /api/v1/horarios-turnos/activo`.
- ❌ No se implementa notificación push al inicio/fin de turno (roadmap v2).
- ❌ No se crea UI de selección manual de vehículo — si el sereno no tiene asignación,
  el GPS queda bloqueado hasta que el supervisor lo asigne en el dashboard.
- ❌ No se toca el módulo de Novedades, Combustible ni el GPS service — solo el arranque.
  → La restricción del GPS (Outcome 5) es la única excepción: se deshabilita el switch
  si no hay turno, sin tocar `gpsService.js`.

---

## 5. Criterios de aceptación

| ID | Criterio | Cómo verificar |
|---|---|---|
| AC-01 | Con turno activo y vehículo asignado → response con turno + placa | curl con JWT de sereno conductor → JSON con `turno` y `vehiculo` |
| AC-02 | Con turno activo y patrullaje a pie → response con turno, vehiculo null | curl con JWT de sereno a pie → `vehiculo: null` |
| AC-03 | Sin turno activo → `{ success: true, data: null }` | curl fuera del horario configurado → data null |
| AC-04 | Sin JWT → 401 Unauthorized | curl sin Authorization header → 401 |
| AC-05 | Con JWT de rol distinto a `sereno` → 403 Forbidden | curl con JWT de `operador` → 403 |
| AC-06 | HomeScreen muestra nombre del turno, hora inicio y hora fin reales | Abrir app como sereno con turno → verificar UI |
| AC-07 | Switch GPS deshabilitado si `data: null` | Abrir app sin turno asignado → switch GPS no responde |
| AC-08 | Permiso `patrullaje.sereno.read` existe en BD y asignado al rol `sereno` | SQL en Supabase → verificar permisos |
| AC-09 | Funciona con `DB_DIALECT=postgres` y `DB_DIALECT=mysql` | Test en ambos entornos |

---

## 6. Restricciones y decisiones técnicas

### Decisiones tomadas (no modificar)

1. **Endpoint nuevo:** `GET /api/v1/patrullaje/turno-activo`
   No se modifica `horarios-turnos/activo` — se crea un endpoint específico para
   el APK que agrega la capa de asignación vehicular/personal.

2. **Rol nuevo: `sereno`**
   Los serenos de campo del APK usan un rol propio, separado del rol `operador`
   del dashboard web. El endpoint solo acepta el rol `sereno`.

3. **Permisos nuevos** (formato `modulo.recurso.accion`):

   | Permiso | Asignado a |
   |---|---|
   | `patrullaje.sereno.read` | `sereno` |
   | `patrullaje.conductor.read` | `sereno` |

   Solo se necesitan los permisos de lectura para este spec.
   Los permisos de escritura (`create`, `update`, `delete`) se definen en specs futuros.

4. **Si no hay asignación → no es error**
   El endpoint siempre responde 200. `data: null` significa "sin turno" — el APK
   maneja ese estado deshabilitando el GPS.

5. **Compatibilidad dual MySQL/PostgreSQL**
   Las queries deben funcionar con ambos dialectos vía Sequelize. No usar
   funciones SQL nativas de un solo motor (ej: no `NOW()::date` de PG puro —
   usar `Sequelize.fn('DATE', Sequelize.fn('NOW'))`).

6. **Timezone**
   La comparación de hora actual vs hora inicio/fin del turno debe hacerse en
   `America/Lima (UTC-5)`. Usar `moment-timezone` o `date-fns-tz` consistente
   con el resto del backend.

### Convenciones del proyecto que aplican

- Respuesta estándar: `{ success: boolean, message: string, data: any }`
- Soft delete: verificar que los operativos consultados no estén eliminados (`deleted_at IS NULL`).
- Audit logging: no aplica (es solo lectura).
- Push a GitHub: preguntar al usuario antes de hacer push.

---

## 7. Plan de implementación

### Fase 1 — Backend: rol, permisos y endpoint

#### Tarea 1.1 — Crear el rol `sereno` en BD (Verificar si ya existe previamente)

```sql
-- En Supabase SQL Editor (y equivalente MySQL para BD secundaria)
INSERT INTO citysecure.roles (nombre, slug, nivel, descripcion)
VALUES ('Sereno de Campo', 'sereno', 4, 'Agente de serenazgo con acceso al APK de patrullaje')
ON CONFLICT (slug) DO NOTHING;
```

> Nivel 4 — mismo nivel que `supervisor`. Ajustar según jerarquía real del proyecto.

#### Tarea 1.2 — Crear permisos del módulo `patrullaje`

```sql
INSERT INTO citysecure.permisos (modulo, recurso, accion, slug, descripcion, es_sistema)
VALUES
  ('patrullaje', 'sereno', 'read', 'patrullaje.sereno.read',
   'Ver turno activo y asignación del sereno', false),
  ('patrullaje', 'conductor', 'read', 'patrullaje.conductor.read',
   'Ver vehículo asignado como conductor', false)
ON CONFLICT (slug) DO NOTHING;

-- Asignar al rol sereno
INSERT INTO citysecure.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM citysecure.roles r, citysecure.permisos p
WHERE r.slug = 'sereno'
  AND p.slug IN ('patrullaje.sereno.read', 'patrullaje.conductor.read')
ON CONFLICT DO NOTHING;
```

#### Tarea 1.3 — Crear el controlador

```
Archivo nuevo: src/controllers/patrullajeController.js
Función: getTurnoActivo(req, res)
```

Lógica:
1. Obtener `usuario_id` del JWT (`req.user.id`).
2. Resolver `personal_seguridad_id`:
   ```js
   // usuarios.personal_seguridad_id donde usuarios.id = req.user.id
   const usuario = await Usuarios.findByPk(req.user.id, { attributes: ['personal_seguridad_id'] });
   if (!usuario?.personal_seguridad_id) return res.json({ success: true, data: null, message: 'Usuario sin personal asignado' });
   const psId = usuario.personal_seguridad_id;
   ```
3. Consultar horario activo (reusar lógica de `getHorarioActivo` de `horariosTurnosController`).
4. Si no hay horario activo → `return res.json({ success: true, data: null, message: 'Sin turno activo' })`.
5. Buscar en `operativos_vehiculos` donde `(conductor_id = psId OR copiloto_id = psId)` AND `deleted_at IS NULL`.
   - Si encontrado → rol: `conductor_id = psId ? 'CONDUCTOR' : 'COPILOTO'`, incluir `vehiculo_id`, cuadrantes.
6. Si no encontrado → buscar en `operativos_personal` donde `(personal_id = psId OR sereno_id = psId)` AND `deleted_at IS NULL`.
   - Si encontrado → rol: `personal_id = psId ? 'SERENO_PRINCIPAL' : 'SERENO_AUXILIAR'`, `tipo_patrullaje`, cuadrantes.
7. Si no encontrado en ninguna tabla → asignación null (tiene turno activo pero sin operativo asignado aún).
8. Devolver respuesta consolidada con: `turno`, `rol`, `vehiculo` (o null), `cuadrantes` (o []).

#### Tarea 1.4 — Crear el validador

```
Archivo nuevo: src/validators/patrullaje.validator.js
```
Sin parámetros de entrada — solo `verificarToken` y permiso. El validador es trivial
pero se crea por consistencia con el patrón del proyecto.

#### Tarea 1.5 — Crear la ruta

```
Archivo nuevo: src/routes/patrullaje.routes.js

GET /turno-activo
  1. verificarToken
  2. requirePermission('patrullaje.sereno.read')
  3. patrullajeController.getTurnoActivo
```

#### Tarea 1.6 — Registrar en `index.routes.js`

```javascript
import patrullajeRoutes from './patrullaje.routes.js';
router.use('/patrullaje', patrullajeRoutes);
```

Endpoint final: `GET /api/v1/patrullaje/turno-activo`

---

### Fase 2 — APK Patrol: consumir el endpoint

#### Tarea 2.1 — Crear `src/api/patrullaje.js`

```javascript
import client from './client.js';
export const getTurnoActivo = () => client.get('/patrullaje/turno-activo');
```

#### Tarea 2.2 — Actualizar `trackingStore.js`

Agregar campos al store:
```javascript
turnoActivo: null,        // { nombre, horaInicio, horaFin }
vehiculoAsignado: null,   // { vehiculoId, placa } | null
cuadranteAsignado: null,  // { cuadranteId, nombre } | null
setTurnoActivo: (data) => set({ turnoActivo: data?.turno, vehiculoAsignado: data?.vehiculo, cuadranteAsignado: data?.cuadrante }),
```

#### Tarea 2.3 — Llamar al endpoint en `authStore.init()`

Después de validar el JWT y cargar el usuario:
```javascript
const { data } = await getTurnoActivo();
trackingStore.getState().setTurnoActivo(data.data);
```

#### Tarea 2.4 — Actualizar `HomeScreen.jsx`

- Mostrar nombre del turno, hora inicio y hora fin desde `trackingStore`.
- Si `turnoActivo === null`: mostrar badge "Sin turno activo" en gris.
- Si `vehiculoAsignado !== null`: mostrar placa del vehículo.
- Si `vehiculoAsignado === null` y hay turno: mostrar "Patrullaje a pie".

#### Tarea 2.5 — Deshabilitar switch GPS sin turno

En `TrackingScreen.jsx`:
```javascript
const turnoActivo = useTrackingStore(s => s.turnoActivo);
// El Switch queda disabled si turnoActivo === null
<Switch disabled={!turnoActivo} ... />
```

---

### Fase 3 — Verificación

#### Tarea 3.1 — Test manual del endpoint

Ver criterios AC-01 al AC-05 usando curl con distintos usuarios.

#### Tarea 3.2 — Test visual del APK

- Login con usuario rol `sereno` con turno asignado → HomeScreen muestra datos reales.
- Login con usuario sin turno → HomeScreen muestra "Sin turno activo", GPS deshabilitado.

---

## 8. Relación con otros servicios

```
city_sec_patrol (APK)
  └─► GET /api/v1/patrullaje/turno-activo (al arrancar)
  └─► POST /api/v1/tracking/ubicacion (solo si turnoActivo !== null)

city_sec_backend_claude
  └─► NUEVO: GET /api/v1/patrullaje/turno-activo
  └─► Reutiliza lógica de horarios-turnos/activo

city_sec_frontend_v2
  └─► NO AFECTADO

city_sec_voice_gateway / city_sec_alert
  └─► NO AFECTADOS
```

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| La estructura de `operativos_vehiculos` no tiene `personal_id` como se asume | MEDIA | ALTO | Verificar esquema real con MCP antes de T1.3 |
| El rol `sereno` necesita nivel jerárquico diferente al propuesto | BAJA | BAJO | Ajustar en T1.1 según tabla de roles existente |
| Las queries de fecha no son compatibles con ambos dialectos | MEDIA | MEDIO | Usar `Sequelize.fn` y `Op` — nunca SQL crudo con funciones nativas |
| El `authStore.init()` ya es complejo y agregar la llamada al turno suma latencia | BAJA | BAJO | Hacer la llamada en paralelo con `Promise.all` si hay otras llamadas al init |

---

## 10. Definición de "Done"

- [ ] Rol `sereno` creado en BD (Supabase + MySQL).
- [ ] Permisos `patrullaje.sereno.read` y `patrullaje.conductor.read` creados y asignados.
- [ ] Endpoint `GET /api/v1/patrullaje/turno-activo` deployado en Railway.
- [ ] AC-01 al AC-09 verificados manualmente.
- [ ] HomeScreen muestra datos reales del turno al login.
- [ ] Switch GPS deshabilitado cuando no hay turno activo.
- [ ] TD-P-005 marcado como RESUELTO en `PRD.md` de Patrol y en `CONSTITUTION.md`.

---

## Nota sobre el spec de permisos completos

Los permisos `patrullaje.sereno.create/update/delete` y `patrullaje.conductor.create/update/delete`
quedan fuera de este spec intencionalmente — corresponden a la gestión de operativos
desde el APK, que es funcionalidad de roadmap v2. Se abrirá un spec separado cuando
ese módulo se planifique.

---

*Próximo artefacto: ejecutar `/speckit-plan` en `city_sec_backend_claude` con este spec.*