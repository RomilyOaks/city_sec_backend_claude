# Research — TD-P-005: Turno Activo del Sereno

**Fase 0 completada:** 2026-06-05

---

## 1. Rol `sereno` — Estado real en BD

**Decision:** El rol ya existe. No crear.

| Campo | Valor |
|---|---|
| id | 83 |
| nombre | Sereno |
| slug | sereno |
| nivel_jerarquia | 8 |

La columna de jerarquía se llama `nivel_jerarquia` (no `nivel` ni `nivel_jerarquico`).
El seeder T1.1 solo debe verificar existencia vía `findOrCreate` — nunca INSERT incondicional.

---

## 2. Permisos `patrullaje.*` — Estado real en BD

**Decision:** No existen. Deben crearse.

Query verificada:
```sql
SELECT slug FROM citizen_security.permisos WHERE slug LIKE 'patrullaje%';
-- → 0 rows
```

Permisos a insertar (T1.2):
- `patrullaje.sereno.read`
- `patrullaje.conductor.read`

---

## 3. Esquema real de tablas involucradas

### `operativos_vehiculos`
Columnas relevantes para el endpoint:
- `id` (BIGINT), `operativo_turno_id` (BIGINT)
- `vehiculo_id` (INT), `conductor_id` (INT NULL), `copiloto_id` (INT NULL)
- `hora_inicio` (DATETIME), `hora_fin` (DATETIME NULL)
- `deleted_at` (DATETIME NULL) — soft delete via Sequelize `paranoid: true`
- `activo_unico` (TINYINT NULL) — flag de registro activo

### `operativos_personal`
Columnas relevantes:
- `id` (BIGINT), `operativo_turno_id` (BIGINT)
- `personal_id` (INT), `sereno_id` (INT NULL)
- `tipo_patrullaje` ENUM('SERENAZGO', 'PPFF', 'GUARDIA', 'VIGILANTE', 'OTRO')
- `hora_inicio` (DATETIME), `hora_fin` (DATETIME NULL)
- `deleted_at` (DATETIME NULL) — soft delete

### `operativos_turno`
Columnas relevantes:
- `id` (BIGINT), `fecha` (DATE), `turno` ENUM('MAÑANA','TARDE','NOCHE')
- `fecha_hora_inicio` (DATETIME), `fecha_hora_fin` (DATETIME NULL)
- `sector_id` (INT), `estado` ENUM('ACTIVO','CERRADO','ANULADO')
- `deleted_at` (DATETIME NULL)

### `horarios_turnos`
- PK es `turno` (ENUM), no `id`
- `hora_inicio` (TIME), `hora_fin` (TIME), `cruza_medianoche` (TINYINT)
- `estado` (TINYINT), `deleted_at` (DATETIME NULL)

### `operativos_vehiculos_cuadrantes`
- `tiempo_minutos` es columna REAL (INT) en MySQL — en Supabase puede ser columna o virtual
- `activo_unico` (TINYINT) — verificar para filtrar el cuadrante activo actual

### `vehiculos`
Campos para la respuesta: `id`, `codigo_vehiculo`, `placa`, `marca`

### `cuadrantes`
Campos para la respuesta: `id`, `nombre`, `sector_id`

### `usuarios`
- `personal_seguridad_id` (INT) — FK que vincula al efectivo

---

## 4. Lógica de `getHorarioActivo` — reutilizable

La función `convertirAHoraLocal` en `horariosTurnosController.js` usa `Intl.DateTimeFormat`
para convertir la hora UTC del servidor a `America/Lima`. Es compatible con ambos dialectos
(no usa SQL). Se puede extraer a `src/utils/dateHelper.js` o reutilizar directamente con
un import nombrado.

**Decision:** Extraer la lógica de detección del horario activo a una función helper
`getHorarioActivoInternal(timezone?)` que retorne el objeto `HorariosTurnos` o `null`
— sin envolver en `res.json`. El controlador `patrullajeController.js` la llamará.

---

## 5. Estrategia de consulta de operativos — fecha actual

El join requiere encontrar operativos del día actual. La relación es:
```
horarios_turnos.turno (enum: MAÑANA/TARDE/NOCHE)
    → operativos_turno.turno (mismo enum)
    → operativos_turno.fecha = TODAY (America/Lima)
    → operativos_vehiculos.operativo_turno_id
```

Para buscar el operativo del día sin SQL raw (dual dialect):
```js
const hoyPeru = /* fecha local America/Lima en formato YYYY-MM-DD */;
const operativo = await OperativosTurno.findOne({
  where: {
    turno: horarioActivo.turno,  // MAÑANA | TARDE | NOCHE
    fecha: hoyPeru,
    deleted_at: null,
  }
});
```

El campo `fecha` de `operativos_turno` es `DATEONLY` — compararlo con `YYYY-MM-DD` es
seguro en ambos dialectos sin conversión adicional.

**Decision:** Usar Sequelize ORM (no SQL raw) en todo el controlador para garantizar
compatibilidad dual dialecto. Las comparaciones de fecha se hacen con `Op.eq` sobre
campos DATEONLY.

---

## 6. Timezone — método sin dependencias externas

`moment-timezone` y `date-fns-tz` NO están instalados en el proyecto. El backend ya usa
`Intl.DateTimeFormat` con `timeZone: 'America/Lima'` en `horariosTurnosController.js`.

**Decision:** Usar el mismo patrón `Intl.DateTimeFormat` — sin agregar dependencias nuevas.
Extraer una función `getLocalDateString(timezone)` que retorne `'YYYY-MM-DD'` para la
fecha actual en Lima.

---

## 7. Middleware de autenticación — nombres reales

El proyecto usa:
- `authenticate` (no `verificarToken`) — desde `src/middlewares/authMiddleware.js`
- `requirePermission('slug')` — mismo archivo

```js
import { authenticate, requirePermission } from '../middlewares/authMiddleware.js';
```

---

## 8. Cuadrante activo — criterio de selección

`operativos_vehiculos_cuadrantes` puede tener múltiples cuadrantes por operativo.
El cuadrante "actual" es el que tiene `hora_salida IS NULL` y `deleted_at IS NULL`.
Si no existe ninguno con esas condiciones, se devuelve el último cuadrante registrado
o `null`.

**Decision:** El endpoint devuelve el primer cuadrante con `hora_salida IS NULL`.
Si no hay ninguno, `cuadrante: null`.
