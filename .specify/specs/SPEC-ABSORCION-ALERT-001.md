# SPEC: Absorción de city_sec_alert en city_sec_backend_claude

**ID:** SPEC-ABSORCION-ALERT-001  
**Fecha:** 2026-06-08  
**Revisión:** v2 — ajustado tras confirmar arquitectura real de Supabase  
**Metodología:** Spec-Driven Development (SDD)  
**Estado:** APROBADO ✅  
**Repos afectados:**
- `city_sec_backend_claude` — receptor (se extiende)
- `city_sec_alert/backend` — donante (se depreca su servicio Railway)
- `city_sec_alert/frontend` — **NO se toca** (solo cambia `EXPO_PUBLIC_API_URL` y prefijos de rutas)
- `city_sec_alert/web-app` — **NO se toca** (solo cambia su `API_URL`)

**Motivación estratégica:** Consolidar toda la lógica de negocio en un único backend (`city_sec_backend_claude`), eliminar el servicio Railway de `city_sec_alert/backend`, y simplificar la arquitectura antes de construir el SaaS multi-tenant.

---

## 1. Estado real de la base de datos (confirmado)

Todo vive en **un único proyecto Supabase** (`nkjmengotpcantnkziwt`). No hay dos proyectos separados.

| Schema | Tabla | Estado | Acción requerida |
|---|---|---|---|
| `citysecure_alert` | `usuarios` | Existe — ciudadanos registrados en la app | Migrar datos a `citysecure.ciudadanos` y eliminar |
| `citysecure` | `reportes` | Existe con datos en producción | Renombrar a `reportes_ciudadano` |
| `citysecure` | `playas` | Existe con 8 registros | Sin cambio — ya está en el schema correcto |
| `citysecure` | `api_call_log` | Existe — propiedad del Voice Gateway | Sin cambio — no se toca |

**Resumen del trabajo real en BD:**
- Un `ALTER TABLE` (renombrar `reportes` → `reportes_ciudadano`)
- Un `CREATE TABLE` + `INSERT INTO ... SELECT` (crear `ciudadanos` y migrar datos desde `citysecure_alert.usuarios`)
- Un `DROP TABLE` (eliminar `citysecure_alert.usuarios` una vez verificada la migración)

No hay migración entre proyectos Supabase. No hay copia de Storage. Todo ocurre dentro del mismo proyecto.

---

## 2. Decisiones de diseño

### 2.1 Nombre de la tabla: `ciudadanos`

La tabla `citysecure_alert.usuarios` se migra a `citysecure.ciudadanos` para evitar colisión con `citysecure.usuarios` (personal interno del serenazgo) y claridad semántica.

| Tabla | Schema | Representa |
|---|---|---|
| `usuarios` | `citysecure` | Personal interno del serenazgo: serenos, supervisores, admins |
| `ciudadanos` | `citysecure` | Personas externas que reportan incidentes vía la app móvil |

### 2.2 Autenticación: mantener Supabase Auth para ciudadanos

El backend de CitySecure usa JWT propio (`jsonwebtoken`). El backend de alert usa Supabase Auth. **No se migra la autenticación ciudadana al JWT propio** — forzaría a todos los ciudadanos registrados a resetear contraseña.

El módulo ciudadano incorpora un middleware de validación de JWT de Supabase (`SUPABASE_JWT_SECRET`) paralelo al JWT interno, usado exclusivamente en rutas `/api/v1/ciudadanos/*`.

Ambos sistemas de auth coexisten sin interferirse:
- Rutas `/api/v1/auth/*` (interno) → valida JWT propio de CitySecure
- Rutas `/api/v1/ciudadanos/*` → valida JWT de Supabase Auth

### 2.3 Storage: ya está en el mismo proyecto Supabase

Los buckets `reportes-fotos` y `reportes-audio` ya existen en el proyecto Supabase compartido. Las URLs almacenadas en `citysecure.reportes` (y las novedades de CitySecure que las referencian como adjuntos) **siguen siendo válidas sin ningún cambio**. No hay migración de archivos.

Solo se necesita agregar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como variables de entorno en el backend de CitySecure para que pueda subir nuevos archivos al Storage existente.

### 2.4 Prefijo de rutas del módulo ciudadano

| Grupo | Método | Ruta |
|---|---|---|
| Auth ciudadano | POST | `/api/v1/ciudadanos/auth/register` |
| Auth ciudadano | POST | `/api/v1/ciudadanos/auth/login` |
| Auth ciudadano | GET | `/api/v1/ciudadanos/auth/me` |
| Auth ciudadano | POST | `/api/v1/ciudadanos/auth/forgot-password` |
| Auth ciudadano | POST | `/api/v1/ciudadanos/auth/reset-password` |
| Reportes ciudadano | POST | `/api/v1/ciudadanos/reportes` |
| Reportes ciudadano | GET | `/api/v1/ciudadanos/reportes/mis-reportes` |
| Reportes ciudadano | DELETE | `/api/v1/ciudadanos/reportes/:id` |
| Catálogos públicos | GET | `/api/v1/ciudadanos/playas` |

La app móvil y el web-app solo necesitan actualizar su `API_URL` base y ajustar el prefijo `/ciudadanos/` en sus llamadas. No se modifica lógica de frontend.

### 2.5 `api_call_log`: no se toca

Es propiedad lógica del Voice Gateway. El campo `reportes_ciudadano.voice_log_id` sigue referenciando esos registros como FK lógica (sin constraint formal, igual que hoy).

---

## 3. Cambios en base de datos

### 3.1 Migration SQL: `001_absorcion_alert.sql`

Se crea como archivo versionado en `supabase/migrations/` del repo.

```sql
-- ============================================================
-- PASO 1: Renombrar citysecure.reportes → citysecure.reportes_ciudadano
-- ============================================================
ALTER TABLE citysecure.reportes RENAME TO reportes_ciudadano;

-- Renombrar índices existentes para consistencia
ALTER INDEX IF EXISTS reportes_pkey RENAME TO reportes_ciudadano_pkey;

-- Agregar índices nuevos que no existían
CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_created_by
  ON citysecure.reportes_ciudadano(created_by);

CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_novedad_id
  ON citysecure.reportes_ciudadano(novedad_id);

CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_sync_status
  ON citysecure.reportes_ciudadano(novedad_sync_status);

CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_created_at
  ON citysecure.reportes_ciudadano(created_at DESC);

-- ============================================================
-- PASO 2: Crear citysecure.ciudadanos
-- ============================================================
CREATE TABLE citysecure.ciudadanos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE NOT NULL,
  username      VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  telefono      VARCHAR(20),            -- centralizado aquí (en alert solo vivía en reportes)
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  deleted_by    UUID
);

CREATE INDEX idx_ciudadanos_user_id ON citysecure.ciudadanos(user_id);
CREATE INDEX idx_ciudadanos_email   ON citysecure.ciudadanos(email);

-- ============================================================
-- PASO 3: Migrar datos de citysecure_alert.usuarios → citysecure.ciudadanos
-- ============================================================
INSERT INTO citysecure.ciudadanos (
  id, user_id, username, email,
  created_at, updated_at, deleted_at, deleted_by
)
SELECT
  id, user_id, username, email,
  created_at, updated_at, deleted_at, deleted_by
FROM citysecure_alert.usuarios;

-- Nota: la columna telefono no existía en citysecure_alert.usuarios.
-- Queda NULL para ciudadanos migrados; se completará cuando vuelvan a iniciar sesión
-- (PhoneSetupModal de la app lo captura automáticamente).

-- ============================================================
-- PASO 4: Eliminar tabla original (ejecutar SOLO después de verificar PASO 3)
-- ============================================================
-- DROP TABLE citysecure_alert.usuarios;
-- (Comentado intencionalmente — ejecutar manualmente tras verificación)
```

**Nota sobre el PASO 4:** El `DROP TABLE` está comentado. Claude Code NO lo ejecuta automáticamente. Se ejecuta manualmente desde el dashboard de Supabase después de verificar que los datos migraron correctamente y que la app funciona con el nuevo backend.

### 3.2 Columna `telefono` en `ciudadanos`

Es una adición respecto al schema original de `citysecure_alert.usuarios`. Centralizar el teléfono en el perfil del ciudadano permite que el operador de CitySecure lo vea sin tener que buscar en los reportes. Para ciudadanos migrados quedará `NULL` inicialmente — el `PhoneSetupModal` de la app lo captura la próxima vez que inicien sesión.

---

## 4. Nuevos archivos en city_sec_backend_claude

```
src/
├── models/
│   ├── Ciudadano.js                    ← NUEVO
│   └── ReporteCiudadano.js             ← NUEVO
│   (Playa.js no es necesario — la tabla ya existe y el backend
│    puede consultarla directamente; se agrega modelo si se necesita
│    lógica de negocio sobre playas en el futuro)
├── middlewares/
│   └── supabaseAuthMiddleware.js       ← NUEVO
├── controllers/
│   ├── ciudadanosAuthController.js     ← NUEVO
│   ├── reportesCiudadanoController.js  ← NUEVO
│   └── playasController.js             ← NUEVO
├── routes/
│   └── ciudadanos.routes.js            ← NUEVO
├── validators/
│   ├── ciudadanosValidator.js          ← NUEVO
│   └── reportesCiudadanoValidator.js   ← NUEVO
└── services/
    ├── supabaseStorageService.js       ← NUEVO (port de SupabaseStorageService.ts de alert)
    └── voiceGatewayBridgeService.js    ← NUEVO (port de VoiceGatewayBridgeClient.ts de alert)
```

### 4.1 Modelo `Ciudadano.js`

```javascript
// src/models/Ciudadano.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Ciudadano = sequelize.define('Ciudadano', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:    { type: DataTypes.UUID, unique: true, allowNull: false, field: 'user_id' },
    username:  { type: DataTypes.STRING, allowNull: false },
    email:     { type: DataTypes.STRING, unique: true, allowNull: false },
    telefono:  { type: DataTypes.STRING(20), allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: 'deleted_by' },
  }, {
    tableName: 'ciudadanos',
    schema: process.env.DB_SCHEMA || 'citysecure',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false, // soft-delete manual
  });
  return Ciudadano;
};
```

### 4.2 Modelo `ReporteCiudadano.js`

Mapea `citysecure.reportes_ciudadano` con todos sus campos. Incluye asociación:
```javascript
ReporteCiudadano.belongsTo(Ciudadano, {
  foreignKey: 'created_by', targetKey: 'user_id', as: 'creador'
});
Ciudadano.hasMany(ReporteCiudadano, {
  foreignKey: 'created_by', sourceKey: 'user_id', as: 'reportes'
});
```

### 4.3 Middleware `supabaseAuthMiddleware.js`

```javascript
// src/middlewares/supabaseAuthMiddleware.js
// Valida Bearer JWT emitido por Supabase Auth.
// Independiente de authMiddleware.js (que valida JWT interno de CitySecure).
//
// Lógica:
// 1. Extraer Bearer token del header Authorization
// 2. Verificar firma con SUPABASE_JWT_SECRET
// 3. Si válido: req.ciudadano = { userId, email }
// 4. Si inválido: 401 { success: false, error: 'TOKEN_INVALIDO' }
```

### 4.4 `supabaseStorageService.js`

Port de `SupabaseStorageService.ts` de alert, adaptado a ES Modules JavaScript. Mantiene:
- Sanitización de `userId` antes de usarlo como path (lección de seguridad documentada en CLAUDE.md de alert)
- Validación de extensión y MIME type
- Subida a los buckets `reportes-fotos` y `reportes-audio` existentes

### 4.5 `voiceGatewayBridgeService.js`

Port de `VoiceGatewayBridgeClient.ts` de alert, adaptado a ES Modules JavaScript. Mantiene:
- Uso de `axios` con `formData.getHeaders()` (no fetch nativo — lección aprendida en alert)
- Validación de dominio en URLs antes de hacer requests (mitigación SSRF)
- Campos: `audio`, `userId`, `incidentType`, `ubicacion`, `telefono`, `fotoUrl1`, `fotoUrl2`, `audioUrl`

### 4.6 Registro de rutas

En `src/routes/index.routes.js`:
```javascript
import ciudadanosRoutes from './ciudadanos.routes.js';
router.use('/ciudadanos', ciudadanosRoutes);
```

---

## 5. Variables de entorno nuevas en city_sec_backend_claude

Agregar en `.env.example` y en Railway (producción):

```env
# Supabase Auth — validación JWT de ciudadanos
# Obtener en: Supabase Dashboard → Settings → API → JWT Secret
SUPABASE_JWT_SECRET=...

# Supabase Storage — subida de fotos y audio de reportes ciudadanos
# Mismo proyecto ya vinculado (nkjmengotpcantnkziwt)
SUPABASE_URL=https://nkjmengotpcantnkziwt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...    # Settings → API → service_role key

# Voice Gateway — sincronización async de reportes
VOICE_GATEWAY_URL=https://citysecvoicegateway-production.up.railway.app
VOICE_GATEWAY_TIMEOUT_MS=60000
```

---

## 6. Plan de implementación (orden para Claude Code)

### Fase 1 — Base de datos (sin tocar código)
1. Aplicar `supabase/migrations/001_absorcion_alert.sql` (pasos 1–3, el DROP queda comentado)
2. Verificar en el dashboard de Supabase que:
   - `citysecure.reportes_ciudadano` existe con todos los registros originales
   - `citysecure.ciudadanos` existe con los registros migrados desde `citysecure_alert.usuarios`

### Fase 2 — Modelos y middleware
3. Crear `Ciudadano.js` y `ReporteCiudadano.js` en `src/models/`
4. Registrar asociaciones en `src/models/index.js`
5. Crear `supabaseAuthMiddleware.js`

### Fase 3 — Servicios
6. Crear `supabaseStorageService.js` (port desde alert)
7. Crear `voiceGatewayBridgeService.js` (port desde alert)

### Fase 4 — Controladores, rutas y validators
8. Crear `ciudadanosAuthController.js`
9. Crear `reportesCiudadanoController.js`
10. Crear `playasController.js`
11. Crear `ciudadanos.routes.js`
12. Crear validators
13. Registrar rutas en `index.routes.js`

### Fase 5 — Variables de entorno y despliegue
14. Agregar variables nuevas al `.env.example` y a Railway
15. Deploy y smoke test de endpoints principales

### Fase 6 — Cutover de la app
16. Actualizar `EXPO_PUBLIC_API_URL` en `city_sec_alert/frontend` con URL de CitySecure
17. Actualizar prefijos de rutas en el frontend (añadir `/ciudadanos/`)
18. Generar nuevo APK vía EAS
19. Verificar flujo completo: registro → login → reporte → novedad en CitySecure

### Fase 7 — Limpieza (después de verificar Fase 6)
20. Ejecutar manualmente el `DROP TABLE citysecure_alert.usuarios` desde Supabase dashboard
21. Pausar el servicio Railway de `city_sec_alert/backend`

---

## 7. Deudas técnicas de alert resueltas en la absorción

| TD | Descripción | Cómo se resuelve |
|---|---|---|
| TD-001 | Rate limiting deshabilitado | Se usa `rateLimitMiddleware.js` ya existente en CitySecure |
| TD-009 | Sin validación de env vars al inicio | CitySecure ya valida env vars en `app.js` |

---

## 8. Lo que explícitamente NO entra en este spec

| Item | Motivo |
|---|---|
| Migración del `web-app` de alert | Cliente independiente — solo cambia su `API_URL` |
| Roles de ciudadano (`vecino`, `operador`, `admin`) | Planificado para Hito #3 de alert — se porta en spec separado |
| Notificaciones push (`pushToken`) | Ídem |
| Estado de reporte visible en app | Ídem |
| Modo offline | Funcionalidad de app móvil, no de backend |
| Panel de estadísticas de reportes ciudadanos en el dashboard | Spec separado |
| Modelo `Playa.js` en Sequelize | La tabla ya existe; se añade el modelo solo si se necesita lógica de negocio |

---

## 9. Criterios de aceptación (Definition of Done)

**Base de datos:**
- [ ] `citysecure.reportes_ciudadano` existe con todos los registros de `citysecure.reportes` originales
- [ ] `citysecure.ciudadanos` existe con los registros migrados desde `citysecure_alert.usuarios`
- [ ] Todos los índices definidos en la migration existen

**Endpoints:**
- [ ] `POST /api/v1/ciudadanos/auth/register` crea usuario en Supabase Auth y registro en `ciudadanos`
- [ ] `POST /api/v1/ciudadanos/auth/login` retorna JWT de Supabase válido
- [ ] `GET /api/v1/ciudadanos/auth/me` retorna perfil del ciudadano autenticado
- [ ] `POST /api/v1/ciudadanos/reportes` sube archivos al Storage existente y guarda en `reportes_ciudadano`
- [ ] El reporte dispara sincronización async con Voice Gateway y actualiza `novedad_sync_status`
- [ ] `GET /api/v1/ciudadanos/reportes/mis-reportes` retorna solo reportes del ciudadano autenticado
- [ ] `DELETE /api/v1/ciudadanos/reportes/:id` hace soft-delete solo si el reporte pertenece al ciudadano
- [ ] `GET /api/v1/ciudadanos/playas` retorna las 8 playas activas

**Seguridad:**
- [ ] Un JWT interno de CitySecure NO funciona en rutas `/ciudadanos/*`
- [ ] Un JWT de Supabase de ciudadano NO funciona en rutas internas de CitySecure
- [ ] `userId` sanitizado antes de usarse como path en Storage

**Cutover:**
- [ ] El nuevo APK apunta al backend de CitySecure y el flujo completo funciona en producción
- [ ] El servicio Railway de `city_sec_alert/backend` puede pausarse sin afectar nada

---

## 10. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Referencias a `citysecure.reportes` en el código de alert/VG dejan de funcionar tras el rename | Media | Alto | Hacer el rename en BD ANTES del cutover del APK; los dos backends corren en paralelo durante la transición |
| Ciudadanos migrados sin teléfono generan errores en VG | Baja | Medio | VG ya maneja `telefono` como campo opcional; PhoneSetupModal lo captura en el siguiente login |
| El `SUPABASE_JWT_SECRET` de alert difiere del esperado | Baja | Alto | Verificar el secret desde el dashboard antes de implementar el middleware |

---

## 11. Dependencias para iniciar implementación

- [ ] Obtener `SUPABASE_JWT_SECRET` desde Supabase Dashboard → Settings → API → JWT Secret
- [ ] Obtener `SUPABASE_SERVICE_ROLE_KEY` desde Supabase Dashboard → Settings → API → service_role
- [ ] Confirmar nombres exactos de los 8 registros en `citysecure.playas` (para el seeder si se necesita)
- [ ] Confirmar que `supabase link` apunta al proyecto correcto (`nkjmengotpcantnkziwt`) desde el directorio de `city_sec_backend_claude`

---

*Spec v2 — ajustado tras confirmar que todo el ecosistema vive en un único proyecto Supabase. Aprobado para implementación con Claude Code.*