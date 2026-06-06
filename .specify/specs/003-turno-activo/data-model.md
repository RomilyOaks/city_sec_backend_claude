# Data Model — TD-P-005: Turno Activo del Sereno

## Entidades involucradas (solo lectura — ninguna tabla nueva)

Todas las tablas ya existen. Esta feature solo agrega permisos en `permisos` y
`rol_permisos`. No se crea ni modifica ninguna tabla.

---

## Grafo de join para `getTurnoActivo`

```
JWT (usuario_id)
  └─► usuarios.id → usuarios.personal_seguridad_id (psId)
  └─► horarios_turnos (hora actual Lima) → horarioActivo.turno
  └─► operativos_turno.fecha = TODAY_LIMA, turno = horarioActivo.turno
        │
        ├─► operativos_vehiculos WHERE (conductor_id=psId OR copiloto_id=psId)
        │     └─► vehiculos (id, codigo_vehiculo, placa, marca)
        │     └─► operativos_vehiculos_cuadrantes (hora_salida IS NULL)
        │           └─► cuadrantes (id, nombre)
        │
        └─► operativos_personal WHERE (personal_id=psId OR sereno_id=psId)
              └─► operativos_personal_cuadrantes (hora_salida IS NULL)
                    └─► cuadrantes (id, nombre)
```

---

## Nuevas filas en tablas existentes

### `permisos` (2 filas nuevas)

| Campo | Valor |
|---|---|
| modulo | `patrullaje` |
| recurso | `sereno` |
| accion | `read` |
| slug | `patrullaje.sereno.read` |
| descripcion | Ver turno activo y asignación del sereno |
| es_sistema | `false` |

| Campo | Valor |
|---|---|
| modulo | `patrullaje` |
| recurso | `conductor` |
| accion | `read` |
| slug | `patrullaje.conductor.read` |
| descripcion | Ver vehículo asignado como conductor |
| es_sistema | `false` |

### `rol_permisos` (2 filas nuevas)

Asignar ambos permisos al rol `sereno` (id=83).

---

## Shape de la respuesta consolidada

```js
// Caso: conductor vehicular
{
  success: true,
  message: "Turno activo obtenido exitosamente",
  data: {
    turno: {
      nombre: "MAÑANA",          // horarios_turnos.turno
      hora_inicio: "08:00:00",   // horarios_turnos.hora_inicio
      hora_fin: "16:00:00",      // horarios_turnos.hora_fin
      fecha: "2026-06-05"        // fecha local Lima
    },
    rol_operativo: "CONDUCTOR",   // CONDUCTOR | COPILOTO | SERENO_PRINCIPAL | SERENO_AUXILIAR
    vehiculo: {
      id: 12,
      codigo_vehiculo: "VH-001",
      placa: "ABC-123",
      marca: "Toyota"
    },
    tipo_patrullaje: "VEHICULAR",  // VEHICULAR | A_PIE
    cuadrante: {
      id: 5,
      nombre: "C-05"
    }
  }
}

// Caso: patrullaje a pie
{
  success: true,
  data: {
    turno: { ... },
    rol_operativo: "SERENO_PRINCIPAL",
    vehiculo: null,
    tipo_patrullaje: "A_PIE",
    cuadrante: { id: 3, nombre: "C-03" }
  }
}

// Caso: tiene turno activo pero sin operativo asignado aún
{
  success: true,
  data: {
    turno: { ... },
    rol_operativo: null,
    vehiculo: null,
    tipo_patrullaje: null,
    cuadrante: null
  }
}

// Caso: sin turno activo
{
  success: true,
  message: "Sin turno activo en este momento",
  data: null
}
```

---

## Notas de compatibilidad

- `horarios_turnos.turno` y `operativos_turno.turno` usan el mismo ENUM: `MAÑANA | TARDE | NOCHE`.
- El join usa `operativos_turno.fecha` (DATEONLY) comparado con la fecha Lima en string `YYYY-MM-DD` — seguro en MySQL y PostgreSQL.
- `deleted_at IS NULL` es manejado automáticamente por Sequelize `paranoid: true` (no requiere cláusula explícita en `where`).
- Para `activo_unico` en operativos: ignorar en la query; confiar en `paranoid: true` + `hora_salida IS NULL` para cuadrantes activos.
