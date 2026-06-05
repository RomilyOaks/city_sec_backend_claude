# CONSTITUTION.md — CitySecure · Ecosistema Completo

**Versión:** 1.0.0  
**Fecha:** Junio 2026  
**Ubicación canónica:** `/mnt/d/robles/Project/CONSTITUTION.md`  
**Estado:** Activo — fuente de verdad para todo el ecosistema

Este documento contiene las **decisiones invariables** que aplican a todos los subproyectos
de CitySecure. Todo agente IA y todo desarrollador debe leer este archivo antes de leer
el CLAUDE.md del subproyecto específico.

> **Jerarquía de documentos:**
> ```
> CONSTITUTION.md          ← leer PRIMERO (este archivo)
>   └── city_sec_backend_claude/CLAUDE.md
>   └── city_sec_frontend_v2/CLAUDE.md
>   └── city_sec_voice_gateway/CLAUDE.md
>   └── city_sec_alert/AGENTS.md
>   └── [city_sec_patrol/CLAUDE.md]    ← pendiente de crear
> ```

---

## 1. ¿Qué es CitySecure?

Sistema integral de seguridad ciudadana para municipalidades peruanas.
Cliente actual: **Municipalidad de Chorrillos, Lima, Perú**.

Tiene dos audiencias principales:

- **Ciudadanos** — reportan incidentes desde su celular (app Android, Telegram, WhatsApp).
- **Serenazgo** — gestiona operaciones desde un dashboard web de escritorio.

El sistema centraliza incidentes, operativos de patrullaje, recursos (personal y vehículos)
e inteligencia geográfica para la toma de decisiones en tiempo real.

---

## 2. Mapa de Servicios

```
/mnt/d/robles/Project/
├── city_sec_backend_claude/    Backend principal (API REST — serenazgo)
├── city_sec_frontend_v2/       SPA de gestión (dashboard serenazgo)
├── city_sec_voice_gateway/     Microservicio de IA (reportes ciudadanos)
├── city_sec_alert/             App ciudadana — monorepo
│   ├── backend/                API de reportes ciudadanos
│   ├── frontend/               APK Android (React Native + Expo)
│   └── web-app/                Dashboard web ciudadano (MVP)
├── [city_sec_patrol/]          Tracking vehicular y personal en mapa (pendiente)
├── database/                   Scripts SQL y migraciones
└── documentation/              Docs generales del proyecto
```

---

## 3. Arquitectura y Flujo de Datos

```
CIUDADANOS
  city_sec_alert (APK)     Telegram Bot        WhatsApp Bot
         │ multipart          │ polling             │ webhook
         ▼                    ▼                     ▼
  ┌──────────────────────────────────────────────────────────┐
  │           city_sec_voice_gateway  :3001                  │
  │  1. Recibe audio/foto/texto                              │
  │  2. Whisper (OpenAI)  → transcripción                   │
  │  3. GPT-4o            → análisis de imágenes            │
  │  4. Claude AI (claude-sonnet-4) → tipo/subtipo novedad  │
  │  5. POST /api/v1/novedades → city_sec_backend_claude    │
  │  Audit logs → Supabase (schema: public)                 │
  └──────────────────────────┬───────────────────────────────┘
                             │ JWT Bearer
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │      city_sec_backend_claude  :3000                      │
  │      Node.js 18 · Express 5 · Sequelize · Supabase PG   │
  │      Auth: JWT (access 1h + refresh 7d)                  │
  │      RBAC: modulo.recurso.accion                         │
  └──────────────────┬───────────────────────────────────────┘
                     │ REST API (Axios + JWT Bearer)
                     ▼
  ┌──────────────────────────────────────────────────────────┐
  │      city_sec_frontend_v2  :5173 (dev)                   │
  │      React 19 · Vite · TailwindCSS · Zustand            │
  │      SPA de gestión operativa del serenazgo             │
  └──────────────────────────────────────────────────────────┘

Flujo paralelo — App ciudadana:
  city_sec_alert/frontend (APK)
    POST /api/v1/reportes → city_sec_alert/backend
      └─ sube a Supabase Storage
      └─ guarda reporte (novedad_sync_status: pending)
      └─ [async] POST /bridge/alert/transcribe → voice_gateway
             └─ voice_gateway crea novedad en city_sec_backend_claude
             └─ backend actualiza novedad_sync_status: linked
```

---

## 4. Stack por Servicio

| Servicio | Runtime | Framework | BD | Deploy | Puerto |
|---|---|---|---|---|---|
| **city_sec_backend_claude** | Node.js 18+ · ES Modules | Express 5 | Supabase PG 15 (primaria) · MySQL 8 (secundaria) · Sequelize | Railway | 3000 |
| **city_sec_frontend_v2** | React 19 · Vite 7 | — | — | — | 5173 (dev) |
| **city_sec_voice_gateway** | Node.js 18+ · ES Modules | Express 5 | — (sin BD propia) | Railway | 3001 |
| **city_sec_alert/backend** | Node.js 20 · TypeScript 5 | Express 4 | PostgreSQL (Supabase · Prisma 6) | Railway (Docker) | ~3010 |
| **city_sec_alert/frontend** | React Native 0.81.5 · Expo SDK 54 | — | AsyncStorage | EAS Build → APK | — |
| **[city_sec_patrol]** | Por definir | Por definir | Supabase PG | Railway | Por definir |

---

## 5. Base de Datos

### Historia y coexistencia de motores en city_sec_backend_claude

El backend nació con **MySQL 8** y todo su desarrollo inicial se realizó sobre ese motor
con Sequelize como ORM. Posteriormente se adoptó **Supabase (PostgreSQL 15)** como plataforma
principal, pero la implementación MySQL se conserva y sigue siendo funcional.

**Ambos motores coexisten en el mismo repositorio.** Sequelize abstrae las diferencias y,
con ajustes mínimos en variables de entorno, el backend puede operar sobre uno u otro.
No funcionan simultáneamente: en cada entorno se activa solo uno.

```
Primaria  → Supabase PostgreSQL 15   (producción activa)
Secundaria → MySQL 8                 (Railway — mantenida, usable)
```

### Conmutación entre motores — variable `DB_DIALECT`

```env
# Activar Supabase (PostgreSQL) — PRIMARIA
DB_DIALECT=postgres
DB_HOST=<supabase-host>
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=<supabase-password>
DB_PORT=5432

# Activar MySQL — SECUNDARIA
DB_DIALECT=mysql
DB_HOST=<mysql-host>
DB_NAME=citizen_security_v2
DB_USER=root
DB_PASSWORD=<mysql-password>
DB_PORT=3306
```

Sequelize lee `DB_DIALECT` al iniciar y configura el dialecto, driver y pool correspondiente.
**Nunca cambiar el dialecto en caliente** — requiere reinicio del servidor.

### Reglas cuando se trabaja con Supabase (PostgreSQL) — BD primaria

- **Schema:** `citysecure` — TODAS las queries del backend principal deben usar este schema.
- **ORM:** Sequelize 6 con `searchPath: 'citysecure'` configurado en `database.js`.
- **Nunca** usar el schema `public` para tablas operativas de serenazgo.
- El driver `pg` debe estar instalado (`npm install pg`).

```sql
-- Siempre con prefijo de schema en queries directas
SELECT * FROM citysecure.novedades WHERE ...;
SET search_path TO citysecure;
```

### Reglas cuando se trabaja con MySQL — BD secundaria

- Base de datos: `citizen_security_v2` (local) / `railway` (Railway production).
- Sin concepto de schema — las tablas viven directamente en la base de datos.
- El driver `mysql2` debe estar instalado.
- Las queries directas no usan prefijo de schema.

```sql
-- Sin prefijo de schema en MySQL
SELECT * FROM novedades WHERE ...;
```

### Consideraciones de compatibilidad Sequelize (ambos motores)

| Aspecto | PostgreSQL (Supabase) | MySQL 8 |
|---|---|---|
| Booleanos | `true` / `false` nativos | `1` / `0` — pueden requerir cast en el frontend |
| Auto-increment | `SERIAL` / `BIGSERIAL` | `AUTO_INCREMENT` |
| Schema prefix | `citysecure.tabla` | No aplica |
| Driver npm | `pg` | `mysql2` |
| `searchPath` en config | Obligatorio | No aplica |

Al implementar queries raw o migraciones, verificar compatibilidad con ambos dialectos
si se pretende mantener la portabilidad.

### Supabase — schema `public` (Voice Gateway logs)

Tablas exclusivas del Voice Gateway para auditoría. Independientes del backend principal:
- `api_call_log`
- `conversation_log`
- `error_log`

### Supabase — city_sec_alert

Base de datos separada, gestionada por Prisma (no Sequelize).
Supabase Storage para fotos y audios: buckets `reportes-fotos`, `reportes-audio`.

### Regla universal de BD — todos los servicios

**NUNCA ejecutar sin autorización explícita del usuario:**
`DROP TABLE`, `DROP DATABASE`, `DROP SCHEMA`, `DELETE FROM`, `TRUNCATE`,
`ALTER TABLE ... DROP COLUMN`, `sequelize.sync({ force: true })`.

El usuario debe escribir **"AUTORIZO OPERACIÓN DESTRUCTIVA"** para habilitar estas acciones.

---

## 6. Dominio de Negocio

### Glosario obligatorio — usar siempre estos términos

| Término | Definición |
|---|---|
| **Novedad** | Incidente de seguridad ciudadana reportado. Entidad central del sistema. |
| **Operativo** | Turno de patrullaje con recursos asignados (vehículos + personal + cuadrantes). |
| **Cuadrante** | Zona geográfica mínima de patrullaje. Toda novedad, vehículo y efectivo se asigna a un cuadrante. |
| **Sector** | Agrupación de cuadrantes dentro de un distrito. |
| **Serenazgo** | Cuerpo de seguridad ciudadana municipal (no PNP). |
| **Efectivo** | Agente de serenazgo (personal de seguridad). |
| **TETRA** | Sistema de radio digital trunking para comunicaciones de seguridad. |
| **Grifo** | Estación de combustible/gasolinera donde se abastecen los vehículos. |
| **Mz/Lote** | Sistema de dirección informal en urbanizaciones (alternativo al numerado municipal). |
| **Ubigeo** | Código geográfico estándar del Perú (INEI). Jerarquía: Departamento → Provincia → Distrito. |
| **Unidad Oficina** | Institución operacional: SERENAZGO, PNP, BOMBEROS, AMBULANCIA. |
| **Auditoría** | Registro automático en `auditoria_acciones` de toda acción de escritura del sistema. |

### Ciclo de vida de una novedad

```
PENDIENTE/REPORTADA → DESPACHADA → EN RUTA → EN LUGAR → EN ATENCIÓN → RESUELTA → CERRADA
        ↓                                                                    ↓
   (NO ATENDIDA)                                                         DERIVADA
                                                                             ↓
                                                                         CANCELADA
```

- Las transiciones están restringidas por rol vía `RolEstadoNovedad`.
- **Criterio "No Atendidas":** `estado_novedad_id` con `es_inicial = 1`.

### Jerarquía geográfica

```
Ubigeo (Departamento → Provincia → Distrito)
  └─ Sector
       └─ Subsector
            └─ Cuadrante
                 └─ Tramo de Calle (CallesCuadrantes)
                      └─ Dirección
```

---

## 7. Sistema RBAC (aplicable a todos los servicios)

### Roles jerárquicos

| Rol | Slug | Nivel | Descripción |
|---|---|---|---|
| Super Administrador | `super_admin` | 0 | Bypass completo de todos los permisos. |
| Administrador | `admin` | 1 | Gestión completa de recursos y usuarios. |
| Supervisor | `supervisor` | 2 | Operativos, novedades, reportes, auditoría. |
| Operador | `operador` | 3 | Registro de novedades, consulta de recursos. |
| Consulta | `consulta` | 4 | Solo lectura. |
| Usuario Básico | `usuario_basico` | 5 | Acceso mínimo (ciudadano/portal externo). |

### Formato de permisos

```
modulo.recurso.accion

Ejemplos:
  novedades.incidentes.create
  novedades.incidentes.update_estado
  usuarios.usuarios.read
  vehiculos.combustible.read
  operativos.turnos.create
```

### Reglas de RBAC

- `super_admin` tiene bypass completo en backend y frontend. No requiere slugs asignados en BD.
- `admin` **NO** tiene bypass automático en el frontend (`canPerformAction`). Los permisos deben estar asignados en BD.
- Los permisos con `es_sistema: true` **no se pueden editar ni eliminar**.
- **Antes de implementar cualquier check de permiso**, verificar el slug en BD:

```sql
SELECT slug FROM citysecure.permisos WHERE slug LIKE 'modulo.%' ORDER BY slug;
```

- En backend: `requirePermission('modulo.recurso.accion')`.
- En frontend: `canPerformAction(user, 'modulo.recurso.accion')` o `useAuthStore`.

---

## 8. Contratos de API Críticos

### CitySecure Backend ← Voice Gateway / Frontend
```
Authorization: Bearer <JWT>
Content-Type: application/json
Respuesta estándar: { success: boolean, message: string, data: any }
```

### Voice Gateway ← Alert App
```
POST /bridge/report-incident  (multipart/form-data)
Campos: userId, incidentType, location (JSON lat/lng), ubicacion,
        description, telefono, fotoUrl1, fotoUrl2, audioUrl,
        audioDuracionSeg, audio (buffer binario)
Respuesta: { success, novedad_id, novedad_code, trace_id }
```

### Voice Gateway → CitySecure Backend
```
POST /api/v1/novedades   Authorization: Bearer <JWT>
Body: { tipo_novedad_id, subtipo_novedad_id, descripcion,
        fecha_hora, latitud, longitud, canal_reporte,
        fotos_adjuntas?, parte_adjuntos? }
```

---

## 9. Convenciones Universales

### Idioma y estilo
- Código fuente: **inglés** (variables, funciones, clases, nombres de archivos).
- Comentarios, UI, mensajes al usuario: **español peruano**.
- Entidades de dominio en modelos: español (ej: `Novedad`, `Cuadrante`, `PersonalSeguridad`).
- Commits backend JS: `Add:`, `Fix:`, `Update:`, `Refactor:`, `Docs:`
- Commits backend TS (city_sec_alert): `FEAT:`, `FIX:`, `DOCS:`, `REFAC:`

### Timezone — regla invariable en todos los servicios
- **Timezone del sistema:** `America/Lima` (UTC-5)
- **NUNCA** usar `toISOString()` para fechas que se muestran en la UI (desfase UTC).
- Formato de fechas para la UI: `YYYY-MM-DD HH:mm:ss` (hora Perú).
- Variable de entorno: `APP_TIMEZONE=America/Lima` / `TIMEZONE_OFFSET=-5`

### ES Modules (todos los servicios Node)
```js
// ✅ Correcto
import express from 'express';
import { myFunc } from './my-module.js'; // siempre con extensión .js

// ❌ Nunca
const express = require('express');
```

### Seguridad — reglas inamovibles en todos los servicios
- **Nunca** commitear API keys, tokens ni contraseñas (ni en seeders, ni en ejemplos).
- Todas las credenciales en `.env` (local) y variables de entorno en Railway (producción).
- **Nunca** incluir credenciales en logs ni en respuestas HTTP.
- `.env.example` solo puede tener placeholders descriptivos, nunca valores reales.
- Archivos temporales de audio → eliminar siempre en bloque `finally`.
- Revisar CVEs al agregar dependencias: `npm audit` antes de commitear.
- Imágenes Docker: **nunca** ejecutar como root — usar usuario `node` (UID 1000).

### Push a GitHub
- **Siempre preguntar al usuario** antes de hacer push o PR en cualquier servicio.
- Nunca push automático, ni con CI/CD habilitado sin confirmación explícita.

---

## 10. Integraciones de IA (city_sec_voice_gateway)

| Proveedor | Modelo | Uso |
|---|---|---|
| OpenAI | `whisper-1` | Transcripción de audio |
| OpenAI | `gpt-4o` | Análisis de imágenes |
| Anthropic | `claude-sonnet-4-20250514` | Clasificación de incidentes (tipo/subtipo) |

**Validaciones antes de enviar a Claude:**
1. La transcripción no es alucinación de Whisper (`"Subtítulos realizados por la comunidad de Amara.org"`).
2. Longitud ≥ 10 caracteres.
3. No es solo espacios o puntuación.

**Patrón fallback de subtipo** (3 niveles):
1. `findBestMatch()` — mejor coincidencia por nombre en catálogo.
2. Primer subtipo activo del tipo encontrado.
3. Primer subtipo activo de todo el catálogo.

**Catálogo en memoria**: tipos/subtipos y calles se cargan al inicio y se refrescan cada 30 min.

---

## 11. Almacenamiento Externo

| Servicio | Qué almacena |
|---|---|
| **PostgreSQL Supabase** (schema `citysecure`) | Toda la operativa de serenazgo: novedades, usuarios, vehículos, personal, sectores. |
| **PostgreSQL Supabase** (schema `public`) | Audit logs del Voice Gateway: `api_call_log`, `conversation_log`, `error_log`. |
| **PostgreSQL Supabase** (city_sec_alert) | Reportes ciudadanos, gestionado por Prisma. |
| **Supabase Storage** | Fotos y audios de reportes ciudadanos (`reportes-fotos`, `reportes-audio`). |

---

## 12. Deploy — Railway

- **Plataforma:** Railway para todos los servicios backend.
- **Auto-deploy:** push a `main` en GitHub dispara deploy automático.
- **Healthcheck:** todo servicio debe tener `GET /health` que responda sin depender de la BD.
- **SMTP:** Railway bloquea puertos SMTP — usar Resend SDK (HTTPS 443) para emails.
- **Puertos SMTP bloqueados:** usar siempre Resend SDK como primario, nodemailer como fallback.

---

## 13. Deudas Técnicas Globales

| ID | Servicio | Descripción | Riesgo |
|---|---|---|---|
| TD-001 | city_sec_alert | Rate limiting deshabilitado | ALTO |
| TD-002 | backend | Tests unitarios: cobertura parcial | MEDIO |
| TD-003 | city_sec_alert | Dashboard web usa `fetch` en lugar de `axios` | MEDIO |
| TD-004 | backend | Swagger desactualizado en endpoints nuevos | BAJO |
| TD-005 | backend | Refresh token no persistido en BD | MEDIO |
| TD-006 | city_sec_alert | Sin tests de integración en backend | MEDIO |
| TD-007 | backend | Historial de contraseñas no implementado | MEDIO |
| ~~TD-P-002~~ | ~~city_sec_patrol~~ | ~~API key Anthropic embebida en APK~~ | ~~ALTO~~ **RESUELTO 2026-06-05** — OCR proxificado vía `POST /api/v1/vision/analizar` |

---

## 14. Cumplimiento Legal

- **Ley N° 29733 (Perú) — Protección de datos personales:** aplica a `city_sec_alert`.
  - La pantalla `TermsAndPermissionsScreen` debe mostrarse **siempre** en el primer inicio.
  - El consentimiento se guarda en `AsyncStorage` con key versionada.
  - Al cambiar el texto legal, incrementar la versión en `TermsAndPermissionsScreen.tsx` y `App.tsx`.
  - **Nunca** eliminar ni bypassear la verificación de términos.

---

## 15. Protocolo de Limpieza de Secretos en Git

Si se detecta un secreto commiteado en cualquier repo del ecosistema:

```bash
# 1. Instalar git-filter-repo (una sola vez)
pip install git-filter-repo

# 2. Crear archivo de reemplazos
echo "literal:SECRETO_REAL==>REDACTED" > replacements.txt

# 3. Reescribir TODO el historial
git filter-repo --replace-text replacements.txt --force

# 4. Restaurar el remote (filter-repo lo elimina por seguridad)
git remote add origin https://github.com/RomilyOaks/<repo>.git

# 5. Force push (destruye el historial remoto — confirmar antes)
git push --force origin main

# 6. Limpiar archivo temporal
rm replacements.txt

# 7. OBLIGATORIO: rotar el secret en producción (Railway)
```

**Regla:** Commitear todos los cambios pendientes ANTES de ejecutar `filter-repo`
(sobreescribe el working tree con el nuevo HEAD).

---

## 16. Para Nuevos Desarrollos — Flujo SDD

Todo módulo o feature nueva en cualquier subproyecto sigue este flujo:

```
1. SPEC.md    → Qué hace, qué NO hace, endpoints/pantallas, 
                esquema DB, criterios de aceptación, roles que acceden.
2. PLAN.md    → Tareas atómicas y ordenadas (ejecutables por Claude Code).
3. Código     → Claude Code ejecuta tarea por tarea siguiendo el spec.
4. Validación → Los criterios de aceptación del spec se verifican.
5. Actualizar → Si el requisito cambia, actualizar SPEC.md PRIMERO.
```

Los specs de features viven en `specs/` dentro del repo correspondiente.

---

*Última actualización: Junio 2026*  
*Mantenido por: Romily Robles — Área de Tecnología, Municipalidad de Chorrillos*