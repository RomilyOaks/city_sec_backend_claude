# FIX: Dashboard — Análisis por Turnos, Prioridad y Tendencias muestran valores incorrectos

## Síntoma

Después del fix anterior (`FIX_Dashboard_Reportes_TotalNovedades_Concatenacion.md`), el KPI
Total Novedades ya muestra el valor correcto (ej. 4). Sin embargo, los gráficos de detalle siguen
mostrando valores inflados:

| Gráfico | Valor incorrecto | Valor real |
|---|---|---|
| Análisis por Turnos — NOCHE | 12 | 3 |
| Análisis por Prioridad — ALTA | 12 | 3 |
| Tendencias — Total Período | 121 | 4 |

## Causa raíz

La misma causa que el bug anterior: el driver `pg` (PostgreSQL) retorna `COUNT(*)` como **string**
(`"1"`, `"2"`, `"1"`). Al acumular con `+` sin castear, JavaScript concatena en lugar de sumar:

```
Vehiculares NOCHE total = "1"
Pie         NOCHE total = "2"
No atend.   Tendencia   = "1"

0 + "1"       = "01"
"01" + "2"    = "012"
"012" + "1"   = "0121"

El frontend aplica parseInt("012",  10) = 12  ← mostrado en Turnos y Prioridad
El frontend aplica parseInt("0121", 10) = 121 ← mostrado en Tendencias
```

## Archivo a modificar

`src/services/reportesOperativosService.js`

---

## Cambio 1 — función `combinarAnalisisTurnos` (líneas ~2472 y ~2478)

Hay **dos líneas idénticas**: una para datos vehiculares y otra para datos de pie.

```js
// ANTES (ambas líneas):
turnosCombinados[turno] = (turnosCombinados[turno] || 0) + (dato.total || 0);

// DESPUÉS (ambas líneas):
turnosCombinados[turno] = (turnosCombinados[turno] || 0) + (parseInt(dato.total, 10) || 0);
```

---

## Cambio 2 — función `combinarAnalisisPrioridad` (línea ~2504)

Los datos vehiculares/pie tienen el campo `total` (string); los datos de no_atendidas tienen `cantidad`
(integer). La expresión `dato.cantidad || dato.total` coge el string cuando `cantidad` es undefined.

```js
// ANTES:
prioridadesCombinadas[prioridad] = (prioridadesCombinadas[prioridad] || 0) + (dato.cantidad || dato.total || 0);

// DESPUÉS:
const rawVal = dato.cantidad !== undefined ? dato.cantidad : dato.total;
prioridadesCombinadas[prioridad] = (prioridadesCombinadas[prioridad] || 0) + (parseInt(rawVal, 10) || 0);
```

O si se prefiere una sola línea:

```js
prioridadesCombinadas[prioridad] = (prioridadesCombinadas[prioridad] || 0) +
  (parseInt(dato.cantidad !== undefined ? dato.cantidad : dato.total, 10) || 0);
```

---

## Cambio 3 — función `combinarTendencias` (líneas ~2607, ~2612, ~2617)

Hay **tres líneas idénticas**: una para cada fuente (vehiculares, pie, no atendidas).
`item.cantidad` viene de `COUNT(DISTINCT ni.id)` → string.

```js
// ANTES (las tres líneas):
tendenciasCombinadas[item.fecha] = (tendenciasCombinadas[item.fecha] || 0) + item.cantidad;

// DESPUÉS (las tres líneas):
tendenciasCombinadas[item.fecha] = (tendenciasCombinadas[item.fecha] || 0) + (parseInt(item.cantidad, 10) || 0);
```

---

## Resultado esperado después del fix

Con datos reales (1 vehicular + 2 pie + 1 no atendida, todos en turno NOCHE, 3 con prioridad ALTA):

| Gráfico | Antes | Después |
|---|---|---|
| Análisis por Turnos — NOCHE | 12 | 3 |
| Análisis por Prioridad — ALTA | 12 | 3 |
| Tendencias — Total Período | 121 | 4 |
| Tendencias — Promedio Diario | 121.0 | 4.0 |
| Tendencias — Pico Máximo | 121 | 4 |

## Patrón general para este servicio

Cualquier `COUNT(*)`, `COUNT(DISTINCT ...)` o `SUM(...)` de una query SQL raw (Sequelize
`QueryTypes.SELECT` o `db.query`) devuelve **string** en PostgreSQL/Supabase. La protección
estándar es envolver con `parseInt(valor, 10) || 0` (para enteros) o `parseFloat(valor) || 0`
(para decimales) antes de acumular con `+`.
