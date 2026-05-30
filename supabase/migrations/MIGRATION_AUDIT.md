# MIGRATION_AUDIT.md — CitySecure Backend: Auditoría MySQL → PostgreSQL

Registro de todas las incompatibilidades encontradas durante la migración de MySQL 8 (Railway) a PostgreSQL 15 (Supabase), con su estado de resolución.

---

## Resumen de estado

| Categoría | Total | Resueltos | Pendientes |
|---|---|---|---|
| Schema / DDL | 8 | 8 | 0 |
| Seeders / datos | 3 | 3 | 0 |
| Modelos Sequelize | 6 | 6 | 0 |
| Controladores | 1 | 1 | 0 |
| Infraestructura | 2 | 2 | 0 |

---

## 1. Incompatibilidades de Schema / DDL

### 1.1 `ADD CONSTRAINT IF NOT EXISTS` — sintaxis no soportada
- **Error:** `syntax error at or near "NOT"` en FKs circulares
- **Causa:** PostgreSQL 14 no tiene `ADD CONSTRAINT IF NOT EXISTS`
- **Solución:** Patrón `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$`
- **Tablas afectadas:** `personal_seguridad`, `novedades_incidentes`, `operativos_turno`, `tracking_vehiculos`
- **Estado:** ✅ Resuelto en `001_citysecure_schema.sql`

### 1.2 FK type mismatch — tipos incompatibles entre PK y FK
- **Error:** `foreign key constraint cannot be implemented — incompatible types`
- **Causa:** MySQL acepta FK `BIGINT → INTEGER`; PostgreSQL requiere tipos exactamente iguales
- **Solución:** `operativos_turno.id` cambiado a `BIGSERIAL` para coincidir con FK `BIGINT`
- **Estado:** ✅ Resuelto en `001_citysecure_schema.sql`

### 1.3 `BIGINT.UNSIGNED` / `INTEGER.UNSIGNED` no existen en PostgreSQL
- **Causa:** PostgreSQL no tiene tipos sin signo
- **Solución:** Reemplazados por `BIGINT` / `INTEGER` (retrocompatible en MySQL)
- **Estado:** ✅ Resuelto en modelos Sequelize y schema

### 1.4 `BOOLEAN NOT NULL DEFAULT` con datos históricos NULL
- **Error:** `null value in column "requiere_licencia" violates not-null constraint`
- **Causa:** MySQL permite insertar NULL en columnas con `NOT NULL DEFAULT` bajo ciertas condiciones; los datos migrados contienen NULLs
- **Solución:** `ALTER COLUMN ... DROP NOT NULL` en 11 columnas BOOLEAN y 8 SMALLINT con DEFAULT
- **Tablas afectadas:** `tipos_vehiculo`, `catalogo_desperfectos`, `estados_novedad`, `tipos_novedad`, `cargos`, `unidades_oficina`, `subtipos_novedad`, `sectores`, `cuadrantes`, `personal_seguridad`, `tipos_via`, `tipos_copiloto`, `horarios_turnos`, `subsectores`, `calles`, `calles_cuadrantes`, `direcciones`
- **Estado:** ✅ Resuelto en `001_citysecure_schema.sql` + `005_patch_schema_align_mysql.sql`

### 1.5 Columnas extras en MySQL no declaradas en schema PG
- **Error:** `column "X" of relation "Y" does not exist`
- **Causa:** El schema PG fue generado desde los modelos Sequelize, que no mapean todas las columnas presentes en MySQL (algunas se agregaron via `ALTER TABLE` directo en producción)
- **Columnas agregadas:**
  - `cargos.deleted_by`, `roles.deleted_by`, `personal_seguridad.deleted_by`, `sectores.deleted_by`
  - `catalogo_desperfectos`: 10 columnas extras (`codigo`, `prioridad`, `tiempo_estimado_reparacion`, `estado`, audit columns)
  - `horarios_turnos.created_by` — cambiado de NOT NULL a nullable
  - `permisos.created_by`, `permisos.deleted_by`, `permisos.deleted_at`
  - `direcciones.ajustado_en_mapa`, `direcciones.fecha_ajuste_mapa`
- **Estado:** ✅ Resuelto en `001_citysecure_schema.sql` + `005_patch_schema_align_mysql.sql`

### 1.6 `CURDATE()` es MySQL-only
- **Solución:** Reemplazado por `CURRENT_DATE` (estándar SQL)
- **Estado:** ✅ Resuelto en modelos Sequelize

### 1.7 `FIELD()` es MySQL-only
- **Solución:** Reemplazado por `CASE WHEN` condicional via `IS_POSTGRES`
- **Estado:** ✅ Resuelto en modelos Sequelize

### 1.8 Opciones MySQL-only en modelos (`charset`, `collate`, `engine`)
- **Causa:** Sequelize acepta estas opciones pero en PG genera DDL incorrecto
- **Solución:** Removidas de todos los modelos
- **Estado:** ✅ Resuelto en modelos Sequelize

---

## 2. Incompatibilidades de Seeders / datos

### 2.1 Commit prematuro de transacción
- **Error:** `cannot run INSERT in a transaction that has already been committed`
- **Causa:** `transaction.commit()` llamado inmediatamente después de `sequelize.transaction()`, antes de las operaciones — MySQL lo ignora, PostgreSQL falla
- **Solución:** Mover `commit()` al final de todas las operaciones
- **Estado:** ✅ Resuelto en `src/seeders/seedRBAC.js`

### 2.2 `sequelize.Op` no existe — importar `Op` directamente
- **Error:** Queries incorrectas o error en PG
- **Solución:** `import { Op } from "sequelize"` en lugar de `sequelize.Op`
- **Estado:** ✅ Resuelto en seeders y controladores

### 2.3 `BOOLEAN` vs `SMALLINT` en columnas de estado
- **Causa:** El script de exportación MySQL → PG usaba `1`/`0` para columnas que en PG son BOOLEAN
- **Error en INSERT:** `invalid input syntax for type boolean`
- **Solución:** `pgVal()` en `scripts/export-mysql-to-supabase.js` convierte `0/1 → FALSE/TRUE` para columnas en `BOOLEAN_COLS`
- **Estado:** ✅ Resuelto en `scripts/export-mysql-to-supabase.js`

---

## 3. Incompatibilidades de modelos Sequelize

### 3.1 `Op.like` — case-sensitive en PostgreSQL
- **Causa:** MySQL `LIKE` es case-insensitive; PostgreSQL `LIKE` distingue mayúsculas
- **Solución:** `IS_POSTGRES ? Op.iLike : Op.like`
- **Modelos afectados:** `Calle.js`, `PersonalSeguridad.js`, `Ubigeo.js`
- **Estado:** ✅ Resuelto

### 3.2 Comparaciones booleanas con literales `1`/`0` en modelos
- **Causa:** MySQL almacena BOOLEAN como TINYINT; `CASE WHEN activo = 1` funciona en MySQL pero falla en PG
- **Solución:** `IS_POSTGRES ? "CASE WHEN activo = true" : "CASE WHEN activo = 1"`
- **Estado:** ✅ Resuelto en modelos afectados

### 3.3 GROUP BY estricto en PostgreSQL
- **Error:** `column must appear in GROUP BY clause`
- **Causa:** PG requiere todas las columnas no-agregadas en GROUP BY
- **Modelos afectados:** `EstadoNovedad.js`, `Sector.js`, `TipoNovedad.js`, `TipoVehiculo.js`
- **Estado:** ✅ Resuelto

### 3.4 SQL crudo con funciones MySQL-only
- **Funciones afectadas:** `CAST(... AS UNSIGNED)`, `SUBSTRING_INDEX`, `IF()`
- **Solución:** Reemplazadas con lógica JavaScript pura
- **Modelos afectados:** `Vehiculo.js` (hook `beforeCreate`)
- **Estado:** ✅ Resuelto

### 3.5 `schema: DB_SCHEMA` ausente en modelos nuevos
- **Causa:** Modelos sin `schema: DB_SCHEMA` en sus opciones van al schema `public` en PG
- **Solución:** Todos los modelos deben incluir `schema: DB_SCHEMA` en el objeto de opciones
- **Estado:** ✅ Resuelto — patrón documentado en CLAUDE.md

### 3.6 Columnas generadas por trigger (`nombre_completo`, `direccion_completa`)
- **Causa:** `SELECT *` en MySQL no retorna columnas generadas de la misma forma; el script de exportación intentaba insertarlas en PG
- **Solución:** `SKIP_COLS` en `scripts/export-mysql-to-supabase.js` excluye estas columnas del INSERT
- **Tablas afectadas:** `calles`, `direcciones`
- **Estado:** ✅ Resuelto

---

## 4. Incompatibilidades en controladores

### 4.1 Comparaciones `boolean = integer` en WHERE de controladores
- **Fecha detectada:** 2026-05-30
- **Error:** `operator does not exist: boolean = integer`
- **Endpoints fallando:** `GET /api/v1/catalogos/unidades`, `GET /api/v1/sectores`, `GET /api/v1/personal/stats`, `GET /api/v1/rol-estados-novedad/rol/:rolId/estados`
- **Causa:** Controladores usaban `where: { estado: 1 }` para columnas que son BOOLEAN en PG. MySQL acepta enteros para BOOLEAN; PG rechaza la comparación de tipos.
- **Distinción importante:** Solo aplica a columnas definidas como BOOLEAN en PG. Las columnas SMALLINT (`vehiculos.estado`, `novedades_incidentes.estado`, `subsectores.estado`, etc.) aceptan enteros sin problema.
- **Solución:** `where: { estado: IS_POSTGRES ? true : 1 }` en 9 controladores
- **Commit:** `98d3f8f`
- **Estado:** ✅ Resuelto en controladores

**Controladores corregidos:**

| Controlador | Tablas BOOLEAN corregidas |
|---|---|
| `catalogosController.js` | TipoNovedad, SubtipoNovedad, EstadoNovedad, TipoVehiculo, Cargo, UnidadOficina |
| `rolEstadosNovedadController.js` | Rol, EstadoNovedad |
| `sectoresController.js` | Sector, Cuadrante, PersonalSeguridad |
| `personalController.js` | PersonalSeguridad (18 ocurrencias) |
| `novedadesController.js` | EstadoNovedad |
| `subsectoresController.js` | Cuadrante, Sector, PersonalSeguridad |
| `cuadrantesController.js` | Cuadrante |
| `abastecimientosController.js` | PersonalSeguridad |
| `trackingController.js` | tracking_vehiculos (raw SQL) |

---

## 5. Incompatibilidades de infraestructura

### 5.1 Railway no soporta IPv6
- **Error:** `ECONNREFUSED` al usar Direct Connection o Session Pooler de Supabase
- **Causa:** Railway resuelve hostnames en IPv4; el Direct Connection de Supabase puede devolver IPv6
- **Solución:** Usar siempre el **Transaction Pooler** (puerto `6543`, host `aws-1-us-east-1.pooler.supabase.com`)
- **Estado:** ✅ Resuelto — documentado en `SUPABASE_SETUP.md` y `.env.example`

### 5.2 Sequelize `pool.min > 0` bloquea cold-start
- **Error:** Servidor HTTP nunca arranca en Railway — healthcheck falla con timeout
- **Causa:** `pool.min > 0` hace que Sequelize abra conexiones TCP al instanciar; en Railway cold-start la DB no está lista
- **Solución:** `pool.min = 0` hardcodeado en `src/config/database.js` (jamás configurable via env)
- **Estado:** ✅ Resuelto — documentado en CLAUDE.md

---

## Archivos clave del proceso de migración

| Archivo | Propósito |
|---|---|
| `supabase/migrations/001_citysecure_schema.sql` | Schema PG completo — 52 tablas, triggers, índices |
| `supabase/migrations/002_citysecure_seeds.sql` | RBAC inicial — 6 roles, 122 permisos, usuario admin |
| `supabase/migrations/005_patch_schema_align_mysql.sql` | Patch idempotente para instancias pre-2026-05-30 |
| `scripts/export-mysql-to-supabase.js` | Exporta 19 tablas de catálogo desde MySQL → `004_seed_data_from_mysql.sql` |
| `src/config/database.js` | `IS_POSTGRES` — bandera usada en guards dialect-específicos |
