# FIX: Dashboard Reportes Operativos — Total Novedades muestra concatenación en lugar de suma

## Síntoma

En el Dashboard de Reportes Operativos (`/reportes-operativos`), el KPI **Total Novedades** muestra un valor incorrecto que es la concatenación de los subtotales en lugar de su suma.

Ejemplo con datos reales:
- Vehiculares: 2
- A pie: 3
- No atendidas: 1
- **Resultado incorrecto: 231** (debería ser 6)

## Causa raíz

El driver `pg` (node-postgres) retorna `COUNT(*)` y otros tipos `BIGINT` como **string** para evitar overflow de enteros JS. Esto aplica tanto a `pg` (PostgreSQL/Supabase) como a `mysql2` (MySQL).

En `getResumenVehicular`, `getResumenPie` y `getResumenNovedadesNoAtendidas`, el campo `total_novedades` se retorna tal cual desde la query SQL sin castear a número.

Luego, en `getDashboardOperativos`:

```js
// total_novedades viene como string "2", "3", "1"
const totalVehiculares = resumenVehicular.data?.total_novedades || 0; // "2"
const totalPie = resumenPie.data?.total_novedades || 0;               // "3"
const totalNoAtendidas = resumenNoAtendidas.data?.total_novedades_no_atendidas || 0; // "1"
const totalGeneral = totalVehiculares + totalPie + totalNoAtendidas;  // "231" ← bug
```

El `|| 0` no ayuda porque `"2"` es truthy — el string pasa intacto.

---

## Archivo a modificar

`src/services/reportesOperativosService.js`

---

## Cambio 1 — `getDashboardOperativos` (líneas ~2246–2249)

```js
// ANTES:
const totalVehiculares = resumenVehicular.data?.total_novedades || 0;
const totalPie = resumenPie.data?.total_novedades || 0;
const totalNoAtendidas = resumenNoAtendidas.data?.total_novedades_no_atendidas || 0;
const totalGeneral = totalVehiculares + totalPie + totalNoAtendidas;

// DESPUÉS:
const totalVehiculares = parseInt(resumenVehicular.data?.total_novedades, 10) || 0;
const totalPie = parseInt(resumenPie.data?.total_novedades, 10) || 0;
const totalNoAtendidas = parseInt(resumenNoAtendidas.data?.total_novedades_no_atendidas, 10) || 0;
const totalGeneral = totalVehiculares + totalPie + totalNoAtendidas;
```

---

## Cambio 2 — `getResumenVehicular` (línea ~626)

Buscar el bloque `return { success: true, data: { total_novedades: ... } }`:

```js
// ANTES:
total_novedades: totalNovedades[0]?.total || 0,

// DESPUÉS:
total_novedades: parseInt(totalNovedades[0]?.total, 10) || 0,
```

---

## Cambio 3 — `getResumenPie`

Buscar la línea equivalente donde retorna `total_novedades` desde `totalNovedades[0]?.total`:

```js
// ANTES:
total_novedades: totalNovedades[0]?.total || 0,

// DESPUÉS:
total_novedades: parseInt(totalNovedades[0]?.total, 10) || 0,
```

---

## Cambio 4 — `getResumenNovedadesNoAtendidas` (línea ~2112)

Buscar donde retorna `total_novedades_no_atendidas`:

```js
// ANTES:
total_novedades_no_atendidas: totalNovedades,

// DESPUÉS (si totalNovedades viene de COUNT sin castear):
total_novedades_no_atendidas: parseInt(totalNovedades, 10) || 0,
```

---

## Nota

Los `parseInt` en líneas 849–886 del mismo archivo (estadísticas vehiculares avanzadas) ya estaban correctos — solo faltaron los métodos `getResumenX` que alimentan el dashboard principal.

## Verificación

Después del fix, el KPI Total Novedades debe mostrar la suma aritmética:
- Vehiculares (2) + Pie (3) + No atendidas (1) = **6**

Y el campo `distribucion_tipo` del response también queda correcto porque usa las mismas variables ya casteadas.
