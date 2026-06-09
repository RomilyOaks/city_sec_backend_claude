# Soporte Dual Dialecto (MySQL + PostgreSQL)

### Contexto: por qué existen 2 motores de base de datos

El backend nació con **MySQL en Railway** como única base de datos (`DB_NAME=railway` en producción, `citizen_security_v2` en local — MySQL no usa schemas, la base de datos *es* la unidad de aislamiento). Más adelante se agregó soporte para **PostgreSQL/Supabase** como alternativa, donde sí existe el concepto de *schema*: todas las tablas de CitySecure viven dentro del schema `citysecure` en una base de datos compartida de Supabase.

Para no duplicar el código de acceso a datos, ambos casos se manejan con una sola capa Sequelize: la variable `DB_DIALECT` decide en tiempo de carga si el backend habla con MySQL (Railway, producción actual) o PostgreSQL (Supabase, alternativo). El dialecto se detecta **una sola vez al cargar el módulo** y configura toda la capa de persistencia (dialectOptions, define, timezone, schema) automáticamente — no hay branching disperso por el código.

> **MySQL ↔ Postgres no son intercambiables 1:1 a nivel de "schema":** en MySQL el equivalente funcional es el *nombre de la base de datos* (`DB_NAME`); en Postgres es el *schema* (`DB_SCHEMA`) dentro de una base de datos. `DB_SCHEMA` queda `undefined` en MySQL precisamente para que Sequelize lo ignore al construir las queries.

El backend corre sobre MySQL en Railway (producción) y puede conectarse a PostgreSQL/Supabase cambiando tres variables de entorno.

### Variables de control

```env
DB_DIALECT=mysql        # o "postgres"
DB_SCHEMA=public        # ignorado en MySQL; "citysecure" para Supabase
DB_SSL=false            # true para Supabase (activa rejectUnauthorized: false)
```

### Exports de database.js

```js
import sequelize, { DB_DIALECT, DB_SCHEMA, IS_POSTGRES } from "../config/database.js";
// IS_POSTGRES = (DB_DIALECT === "postgres")  — usar en guards dialect-específicos
```

### Todos los modelos deben declarar schema

```js
// ✅ En las opciones de todo modelo Sequelize
const MyModel = sequelize.define("MyModel", { ...fields }, {
  tableName: "my_table",
  schema: DB_SCHEMA,   // ignorado en MySQL, enruta al schema correcto en PostgreSQL
  ...
});
```

Si se agrega un modelo nuevo y no lleva `schema: DB_SCHEMA`, sus queries en PostgreSQL irán al schema `public` en vez de `citysecure`. Esto no produce error inmediato — falla silenciosamente con "table not found".

### Verificar la conexión activa

```bash
node src/scripts/test-db-connection.js
```

---

## Trampas Conocidas — PostgreSQL / Supabase

> Detalle completo con ejemplos de código en [`docs/historial.md`](../historial.md).

Reglas rápidas:
- Importar `Op` separado (`import { Op } from "sequelize"`), nunca `sequelize.Op`.
- Castear COUNT/SUM con `parseInt(val, 10) || 0` — el driver devuelve string.
- Alias SQL con mayúsculas: comillas dobles en ambos dialectos: `AS "NombreCampo"`.
- `DataTypes.BIGINT`, nunca `.UNSIGNED`. `CURRENT_DATE`, nunca `CURDATE()`. `Op.iLike` para búsquedas case-insensitive en PG.
- `pool.min = 0` — hardcodeado en `database.js` (nunca cambiar).
- Transacción: un solo `commit()` al final, después de todas las operaciones.
- GROUP BY en PG: incluir todas las columnas no-agregadas del SELECT.
- `boolean` en seeders: `true`/`false`, nunca `1`/`0`.

---

## Trampas Conocidas — Express 5 + Railway

> Detalle completo en [`docs/historial.md`](../historial.md) sección "Express 5 + Railway".

Reglas rápidas:
- Wildcards en rutas Express 5: `/(.*)/` regex, nunca `"*"` suelto.
- `process.on("uncaughtException")` al inicio de `app.js`, antes de cualquier setup.
- Swagger en `try/catch` — `swagger_output.json` puede no existir al arrancar.
- `GET /health` liviano antes de las rutas de API — Railway lo llama durante deploy.
- `app.listen()` independiente de la DB — HTTP arranca primero, DB conecta async.

---

## Migraciones de slugs RBAC en MySQL Railway

Conexión local → Railway MySQL: `*.railway.internal` solo resuelve dentro de la red privada de Railway. `railway run` ejecuta el comando **localmente**, no dentro de Railway — por eso un script local no puede usar `DB_HOST` interno.

Para scripts de migración one-shot ejecutados desde local, usar la URL pública del proxy (`MYSQL_PUBLIC_URL`, disponible en las variables del servicio `citizen_security_db`):

```bash
railway run --service citizen_security_db node src/scripts/<script>.js
# El script debe leer process.env.MYSQL_PUBLIC_URL y conectar con mysql2/promise directamente
```

⚠️ Este camino genera tráfico por la red pública de Railway entre dos recursos que están dentro del mismo proyecto, lo cual incrementa el billing innecesariamente. Alternativas más limpias para scripts futuros:
- `railway shell` — abre una sesión dentro de la red interna de Railway (puede usar `DB_HOST` interno).
- Un paso de migración gateado por variable de entorno dentro del arranque de `app.js`, ejecutado en el propio servicio `city_sec_backend` (ya está en la red interna).

⚠️ **Nunca** imprimir, commitear ni loguear la contraseña de root de MySQL — ni siquiera en exploraciones puntuales de variables de entorno.
