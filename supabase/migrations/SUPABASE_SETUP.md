# SUPABASE_SETUP.md — CitySecure Backend en Supabase

Guía para conectar CitySecure Backend a PostgreSQL/Supabase como base de datos alternativa a MySQL.
Leer junto con `MIGRATION_AUDIT.md` (en `/mnt/d/Project/city_sec_docs/`) para contexto completo.

---

## 1. Requisitos previos

Antes de ejecutar cualquier script, los siguientes pasos deben estar completos:

| Paso | Detalle |
|---|---|
| Proyecto Supabase creado | Plan Free o Pro — región `us-east-1` recomendada para latencia desde Railway |
| Schema `citysecure` creado manualmente | En el SQL Editor: `CREATE SCHEMA citysecure;` |
| `pg` instalado | `npm install pg` — el driver PostgreSQL para Sequelize |

> **Nota:** El schema `citysecure` es obligatorio. Las tablas de CitySecure nunca deben ir al schema `public`, que pertenece a otros proyectos (Alerta Chorrillos, Voice Gateway).

---

## 2. Cómo obtener la connection string de Supabase

### Desde el Dashboard de Supabase:

1. Ir a **Settings → Database** en el menú lateral izquierdo.
2. En la sección **Connection parameters**, copiar los valores del **Transaction Pooler (IPv4)**:

| Parámetro Supabase | Variable de entorno | Ejemplo |
|---|---|---|
| **Host** (Transaction pooler) | `DB_HOST` | `aws-1-us-east-1.pooler.supabase.com` |
| **Port** | `DB_PORT` | `6543` — **NO usar 5432** |
| **User** | `DB_USER` | `postgres.{project_ref}` |
| **Password** | `DB_PASSWORD` | Tu "Database Password" del dashboard |
| **Database** | `DB_NAME` | `postgres` (siempre así en Supabase) |

> **Formato del usuario:** Supabase usa `postgres.{project_ref}` en el pooler (no solo `postgres`). El Project Ref aparece en Settings → General.

### Modos de conexión disponibles:

| Modo | Host/Puerto | Cuándo usar |
|---|---|---|
| **Direct** | `db.<project_ref>.supabase.co:5432` | Desarrollo local con IPv6, migraciones |
| **Session pooler** | `<region>.pooler.supabase.co:5432` | No usar en Railway (ver advertencia abajo) |
| **Transaction pooler** | `<region>.pooler.supabase.co:6543` | **Railway — SIEMPRE usar este** |

> ⚠️ **Railway no soporta IPv6.** El Direct Connection (`db.<ref>.supabase.co:5432`) y el Session pooler (`<region>.pooler.supabase.co:5432`) pueden devolver una IP IPv6 según la región — Railway los rechaza con `ECONNREFUSED`. Usar **siempre el Transaction Pooler (puerto 6543)**, que resuelve a IPv4.

---

## 3. Configuración SSL requerida

Supabase requiere conexiones SSL. Configurar en `.env`:

```env
DB_SSL=true
```

Esto activa en `src/config/database.js`:
```js
ssl: { require: true, rejectUnauthorized: false }
```

`rejectUnauthorized: false` es necesario porque Supabase usa un proxy SSL cuyo certificado no coincide con el hostname directo de conexión. Es la configuración estándar para Supabase con Node.js.

---

## 4. Orden de ejecución en el SQL Editor de Supabase

Los dos archivos deben ejecutarse **manualmente** en el SQL Editor de Supabase (`SQL Editor → New query`):

### Paso 1 — Crear schema (una sola vez, si no existe):
```sql
CREATE SCHEMA IF NOT EXISTS citysecure;
```

### Paso 2 — Ejecutar schema completo:
```
supabase/migrations/001_citysecure_schema.sql
```
Crea las 52 tablas, triggers PL/pgSQL e índices. Es idempotente (`IF NOT EXISTS` en todo).

### Paso 3 — Ejecutar seeds:
```
supabase/migrations/002_citysecure_seeds.sql
```
Inserta 6 roles, 122 permisos, asignaciones y el usuario admin. Es idempotente (`ON CONFLICT DO NOTHING`).

> **Antes de ejecutar 002:** Generar el hash bcrypt del password del admin:
> ```bash
> node -e "const b=require('bcryptjs');console.log(b.hashSync('Admin123!',10))"
> ```
> Reemplazar `PLACEHOLDER_HASH_REEMPLAZAR_CON_HASH_REAL_DE_Admin123!` en el archivo SQL.

### Verificación tras ejecutar:
El archivo `002_seeds.sql` termina con un `SELECT` de verificación. El resultado esperado:

| entidad | total |
|---|---|
| Roles | 6 |
| Permisos | 122 |
| Rol-Permisos | ≥ 210 |
| Usuarios | 1 |
| Usuario-Roles | 1 |

---

## 5. Variables de entorno en Railway para la versión Supabase

En Railway, ir a **Variables** del servicio `city_sec_backend_claude` y agregar/modificar:

```env
# ── Dialecto y schema ──────────────────────────────────────
DB_DIALECT=postgres
DB_SCHEMA=citysecure
DB_SSL=true

# ── Conexión Supabase (Transaction Pooler IPv4 — requerido para Railway) ──
DB_HOST=aws-1-us-east-1.pooler.supabase.com   # Transaction Pooler, no Direct
DB_PORT=6543                                   # 6543, NO 5432
DB_USER=postgres.tu_project_ref                # formato: postgres.{project_ref}
DB_PASSWORD=tu_database_password_de_supabase
DB_NAME=postgres

# ── Pool (mantener igual que producción MySQL) ─────────────
DB_POOL_MAX=20
# DB_POOL_MIN NO configurar — está hardcodeado a 0 en database.js
#             (crítico para Railway cold-start)
```

> **Nunca configurar `DB_POOL_MIN` en Railway.** Está hardcodeado a `0` en `src/config/database.js` para evitar que Sequelize abra conexiones al instanciar, lo que bloquearía el cold-start en Railway.

---

## 6. Por qué NO se usa Row Level Security (RLS) de Supabase

CitySecure implementa su propio sistema RBAC en Express:

- Los permisos se verifican en `src/middlewares/authMiddleware.js` → `requirePermission('modulo.recurso.accion')`
- El control de acceso ocurre en la capa de aplicación, no en la base de datos
- RLS agregaría complejidad sin beneficio en este contexto (las queries ya están restringidas por middleware antes de llegar a la DB)
- Supabase RLS está diseñado para proyectos que acceden directamente a la DB desde el cliente (ej. React + supabase-js), no para backends con ORM

**No activar RLS en ninguna tabla del schema `citysecure`.**

---

## 7. Cómo alternar entre MySQL y PostgreSQL localmente

Modificar `.env` cambiando solo el bloque de base de datos:

### Activar MySQL (configuración actual):
```env
DB_DIALECT=mysql
DB_SCHEMA=public    # ignorado en MySQL
DB_SSL=false
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_local
DB_NAME=citizen_security_v2
```

### Activar PostgreSQL/Supabase (Transaction Pooler — IPv4):
```env
DB_DIALECT=postgres
DB_SCHEMA=citysecure
DB_SSL=true
DB_HOST=aws-1-us-east-1.pooler.supabase.com   # Transaction Pooler IPv4
DB_PORT=6543                                   # NO 5432
DB_USER=postgres.tu_project_ref                # formato: postgres.{project_ref}
DB_PASSWORD=tu_database_password_de_supabase
DB_NAME=postgres
```

### Verificar la conexión activa:
```bash
node src/scripts/test-db-connection.js
```

El script muestra el dialecto activo, el schema y reporta el estado de cada tabla principal con ✅/❌.

---

## Archivos de migración generados

| Archivo | Descripción |
|---|---|
| `supabase/migrations/001_citysecure_schema.sql` | 52 tablas + triggers + índices (1.800+ líneas) |
| `supabase/migrations/002_citysecure_seeds.sql` | 6 roles + 122 permisos + usuario admin |

---

## Compatibilidad con la rama `feature/supabase-support`

Los cambios son **completamente retrocompatibles** con MySQL:

| Componente | MySQL (`DB_DIALECT=mysql`) | PostgreSQL (`DB_DIALECT=postgres`) |
|---|---|---|
| `src/config/database.js` | dialectOptions MySQL + timezone `-05:00` | dialectOptions PG + timezone `America/Lima` |
| Modelos | `schema` ignorado en MySQL | `schema: citysecure` activo |
| `CURDATE()` | Eliminado → `CURRENT_DATE` (compatible en ambos) | ✅ |
| `FIELD()` | Usa rama MySQL del ternario | Usa `CASE WHEN` |
| `Op.like` | Sigue usando `like` en MySQL | Usa `iLike` |
| `BIGINT.UNSIGNED` | Eliminado → `BIGINT` (compatible en MySQL) | ✅ |

La aplicación detecta el dialecto en tiempo de carga del módulo y configura todo automáticamente.
