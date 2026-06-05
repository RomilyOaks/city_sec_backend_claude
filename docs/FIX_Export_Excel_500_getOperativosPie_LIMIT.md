# FIX: Exportar Excel devuelve 500 — getOperativosPie parámetros LIMIT sin placeholder

## Síntoma

Al hacer clic en el botón **Excel** del Dashboard Reportes Operativos, el endpoint
`GET /reportes-operativos/combinados/exportar?formato=excel` devuelve `500 Internal Server Error`.

## Causa raíz

En la función `getOperativosPie`, el `baseQuery` SQL **no incluye** `LIMIT ? OFFSET ?` al final,
pero el array `baseReplacements` **sí agrega** esos 2 valores (línea ~1174):

```js
// Línea ~1174 — se empujan LIMIT y OFFSET al array de replacements:
baseReplacements.push(sanitizedLimit, offset);
```

Sin embargo el SQL termina así (línea ~1106):
```sql
ORDER BY ot.fecha, ht.nro_orden, ot.fecha_hora_inicio;  -- sin LIMIT ? OFFSET ?
```

**En MySQL** el driver `mysql2` ignoraba los parámetros sobrantes — funcionaba sin error.
**En PostgreSQL** el driver `pg` (Sequelize + Supabase) es estricto: lanza `"bind message
supplies N parameters, but prepared statement has N-2 parameters"`, lo que causa el 500.

Esto no afecta a `getOperativosVehiculares` porque ese SQL sí tiene `LIMIT ? OFFSET ?`
(línea ~336). Solo falta en `getOperativosPie`.

## Archivo a modificar

`src/services/reportesOperativosService.js`

## Fix — agregar LIMIT ? OFFSET ? al baseQuery de getOperativosPie

Buscar la línea dentro de `getOperativosPie` que contiene:

```sql
ORDER BY ot.fecha, ht.nro_orden, ot.fecha_hora_inicio;
```

Reemplazar por:

```sql
ORDER BY ot.fecha, ht.nro_orden, ot.fecha_hora_inicio
LIMIT ? OFFSET ?
```

(quitar el punto y coma del ORDER BY y agregar `LIMIT ? OFFSET ?` sin punto y coma al final del template string)

## Fix secundario — límite de 100 filas en exportación

El controlador de exportación llama `getOperativosPie` con `limit: 10000`, pero dentro de la
función hay:

```js
const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit))) || 10;
```

Esto limita la exportación a 100 filas máximo, ignorando el `limit: 10000` del export.

**Solución**: en el `exportarReportesCombinados`, pasar `export_mode: true` en el `exportQuery`
y dentro de `getOperativosPie` respetar un límite mayor cuando es modo export:

```js
// En exportarReportesCombinados (controller):
const exportQuery = { ...req.query, limit: 10000, page: 1, export_mode: true };

// En getOperativosPie (service) — cambiar la sanitización:
const sanitizedLimit = queryParams.export_mode
  ? Math.min(10000, parseInt(limit) || 10000)
  : Math.min(100, Math.max(1, parseInt(limit)) || 10);
```

Aplicar el mismo cambio en `getOperativosVehiculares` y `getNovedadesNoAtendidas` si también
tienen el `Math.min(100, ...)`.

## Verificación

Después del fix:
1. Clic en botón Excel del Dashboard Reportes Operativos
2. Debe descargarse el archivo `.xlsx` sin error 500
3. El archivo debe contener todas las novedades del rango de fechas seleccionado
   (vehiculares + pie + no atendidas en hojas separadas o combinadas)
