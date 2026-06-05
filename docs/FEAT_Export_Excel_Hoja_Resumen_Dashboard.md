# FEAT: Excel Export — Agregar hoja "RESUMEN" con KPIs del Dashboard

## Objetivo

El Excel generado por `/reportes-operativos/combinados/exportar?formato=excel` debe tener
**dos pestañas**:

1. **RESUMEN** (primera) — KPIs del dashboard: totales, distribución por tipo, tasa de atención
2. **DETALLE OPERATIVOS** (segunda) — las filas de datos que ya existen hoy

Los datos del resumen se computan directamente de los arrays ya fetcheados
(`vehicularesResult.data`, `pieResult.data`, `noAtendidasResult.data`) — sin llamadas
adicionales a la BD.

---

## Archivo a modificar

`src/controllers/reportesOperativosController.js` — función `exportarReportesCombinados`

---

## Cambios

### 1. Renombrar la hoja de detalle (línea ~665)

```js
// ANTES:
const worksheet = workbook.addWorksheet("Reportes Combinados Operativos");

// DESPUÉS (agregar hoja resumen PRIMERO, luego la de detalle):
const wsResumen = workbook.addWorksheet("RESUMEN");
const worksheet  = workbook.addWorksheet("DETALLE OPERATIVOS");
```

### 2. Calcular métricas a partir de los datos ya obtenidos

Insertar **antes** de la sección `// 3. Exportar en el formato solicitado` (línea ~662):

```js
// --- Métricas para hoja de resumen ---
const totalVehiculares   = vehicularesResult.data?.length   || 0;
const totalPie           = pieResult.data?.length           || 0;
const totalNoAtendidas   = noAtendidasResult.data?.length   || 0;
const totalGeneral       = totalVehiculares + totalPie + totalNoAtendidas;
const totalAtendidas     = totalVehiculares + totalPie;
const tasaAtencion       = totalGeneral > 0
  ? ((totalAtendidas / totalGeneral) * 100).toFixed(2)
  : "0.00";
const pctVehiculares     = totalGeneral > 0 ? ((totalVehiculares / totalGeneral) * 100).toFixed(2) : "0.00";
const pctPie             = totalGeneral > 0 ? ((totalPie         / totalGeneral) * 100).toFixed(2) : "0.00";
const pctNoAtendidas     = totalGeneral > 0 ? ((totalNoAtendidas / totalGeneral) * 100).toFixed(2) : "0.00";

// Rango de fechas del filtro
const fechaInicioLabel = req.query.fecha_inicio || "—";
const fechaFinLabel    = req.query.fecha_fin    || "—";
const generadoEn       = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
```

### 3. Construir la hoja RESUMEN con ExcelJS

Insertar **dentro del bloque `if (formato === "excel")`**, justo después de crear `wsResumen`
y antes de construir las columnas de `worksheet`:

```js
// === HOJA RESUMEN ===

// Configurar anchos de columna
wsResumen.columns = [
  { key: "A", width: 30 },
  { key: "B", width: 18 },
  { key: "C", width: 14 },
];

// Helper para agregar fila con estilos
const addResumenRow = (col1, col2, col3 = "", boldCols = [], bgColor = null) => {
  const row = wsResumen.addRow([col1, col2, col3]);
  row.eachCell((cell, colNum) => {
    cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "center" };
    cell.border = {
      top:    { style: "thin", color: { argb: "FFD0D0D0" } },
      left:   { style: "thin", color: { argb: "FFD0D0D0" } },
      bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
      right:  { style: "thin", color: { argb: "FFD0D0D0" } },
    };
    if (boldCols.includes(colNum)) cell.font = { bold: true };
    if (bgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
  });
  row.height = 22;
  return row;
};

// Título principal
const titleRow = wsResumen.addRow(["DASHBOARD REPORTES OPERATIVOS — CitySecure", "", ""]);
wsResumen.mergeCells(`A${titleRow.number}:C${titleRow.number}`);
titleRow.getCell(1).font  = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
titleRow.getCell(1).fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4E8C1F" } };
titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
titleRow.height = 30;

// Período y fecha de generación
addResumenRow(`Período: ${fechaInicioLabel}  al  ${fechaFinLabel}`, "", "", [], "FFF0F9E8");
addResumenRow(`Generado: ${generadoEn}`, "", "", [], "FFF0F9E8");

// Separador
wsResumen.addRow([]);

// Encabezado sección KPIs
const kpiHeaderRow = wsResumen.addRow(["KPIs PRINCIPALES", "", ""]);
wsResumen.mergeCells(`A${kpiHeaderRow.number}:C${kpiHeaderRow.number}`);
kpiHeaderRow.getCell(1).font  = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
kpiHeaderRow.getCell(1).fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF365C14" } };
kpiHeaderRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
kpiHeaderRow.height = 24;

// Encabezado columnas
addResumenRow("Indicador", "Valor", "", [1, 2], "FFD4EDDA");

// Filas KPI
addResumenRow("Total Novedades",     totalGeneral,              "", [1, 2]);
addResumenRow("Novedades Atendidas", totalAtendidas,            "", [1, 2]);
addResumenRow("Novedades No Atendidas", totalNoAtendidas,       "", [1, 2]);
addResumenRow("Tasa de Atención",    `${tasaAtencion}%`,        "", [1, 2]);

// Separador
wsResumen.addRow([]);

// Encabezado sección distribución
const distHeaderRow = wsResumen.addRow(["DISTRIBUCIÓN POR TIPO OPERATIVO", "", ""]);
wsResumen.mergeCells(`A${distHeaderRow.number}:C${distHeaderRow.number}`);
distHeaderRow.getCell(1).font  = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
distHeaderRow.getCell(1).fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF365C14" } };
distHeaderRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
distHeaderRow.height = 24;

// Encabezado columnas distribución
addResumenRow("Tipo Operativo", "Cantidad", "Porcentaje", [1, 2, 3], "FFD4EDDA");

// Filas distribución
addResumenRow("Vehiculares",   totalVehiculares, `${pctVehiculares}%`,  [1]);
addResumenRow("A Pie",         totalPie,         `${pctPie}%`,          [1]);
addResumenRow("No Atendidas",  totalNoAtendidas, `${pctNoAtendidas}%`,  [1]);
addResumenRow("TOTAL",         totalGeneral,     "100.00%",             [1, 2, 3], "FFE9F5E1");
```

---

## Resultado esperado

El Excel descargado tendrá 2 pestañas:

**Pestaña 1 — RESUMEN:**
```
┌──────────────────────────────────────────────────────┐
│  DASHBOARD REPORTES OPERATIVOS — CitySecure          │  (verde oliva, blanco)
├──────────────────────────────────────────────────────┤
│  Período: 2026-05-24  al  2026-05-31                 │
│  Generado: 31/05/2026, 09:45:00                      │
├──────────────────────────────────────────────────────┤
│  KPIs PRINCIPALES                                    │  (verde oscuro)
│  Indicador              | Valor                      │
│  Total Novedades        | 8                          │
│  Novedades Atendidas    | 7                          │
│  Novedades No Atendidas | 1                          │
│  Tasa de Atención       | 87.50%                     │
├──────────────────────────────────────────────────────┤
│  DISTRIBUCIÓN POR TIPO OPERATIVO                     │  (verde oscuro)
│  Tipo Operativo  | Cantidad | Porcentaje             │
│  Vehiculares     | 3        | 37.50%                 │
│  A Pie           | 4        | 50.00%                 │
│  No Atendidas    | 1        | 12.50%                 │
│  TOTAL           | 8        | 100.00%                │
└──────────────────────────────────────────────────────┘
```

**Pestaña 2 — DETALLE OPERATIVOS:**
Las filas de datos que ya existen hoy (sin cambios).

---

## Notas

- Los colores usan verde oliva (`4E8C1F`) y verde oscuro (`365C14`) — identidad CitySecure.
- No se hace ninguna llamada adicional a la BD — métricas calculadas desde datos ya cargados.
- El orden de `workbook.addWorksheet()` define el orden de pestañas en Excel.
