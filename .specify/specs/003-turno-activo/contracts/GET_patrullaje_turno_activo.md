# Contract: GET /api/v1/patrullaje/turno-activo

## Descripción
Devuelve el turno activo del sereno autenticado junto con su asignación vehicular
o de patrullaje a pie. Diseñado exclusivamente para el APK `city_sec_patrol`.

---

## Request

```
GET /api/v1/patrullaje/turno-activo
Authorization: Bearer <ACCESS_TOKEN>
```

**Sin parámetros de query ni body.**

---

## Responses

### 200 — Con turno activo y asignación vehicular

```json
{
  "success": true,
  "message": "Turno activo obtenido exitosamente",
  "data": {
    "turno": {
      "nombre": "MAÑANA",
      "hora_inicio": "08:00:00",
      "hora_fin": "16:00:00",
      "fecha": "2026-06-05"
    },
    "rol_operativo": "CONDUCTOR",
    "vehiculo": {
      "id": 12,
      "codigo_vehiculo": "VH-001",
      "placa": "ABC-123",
      "marca": "Toyota"
    },
    "tipo_patrullaje": "VEHICULAR",
    "cuadrante": {
      "id": 5,
      "nombre": "C-05"
    }
  }
}
```

### 200 — Con turno activo y patrullaje a pie

```json
{
  "success": true,
  "message": "Turno activo obtenido exitosamente",
  "data": {
    "turno": {
      "nombre": "TARDE",
      "hora_inicio": "16:00:00",
      "hora_fin": "00:00:00",
      "fecha": "2026-06-05"
    },
    "rol_operativo": "SERENO_PRINCIPAL",
    "vehiculo": null,
    "tipo_patrullaje": "A_PIE",
    "cuadrante": {
      "id": 3,
      "nombre": "C-03"
    }
  }
}
```

### 200 — Con turno activo pero sin operativo asignado

```json
{
  "success": true,
  "message": "Turno activo sin asignación operativa",
  "data": {
    "turno": {
      "nombre": "MAÑANA",
      "hora_inicio": "08:00:00",
      "hora_fin": "16:00:00",
      "fecha": "2026-06-05"
    },
    "rol_operativo": null,
    "vehiculo": null,
    "tipo_patrullaje": null,
    "cuadrante": null
  }
}
```

### 200 — Sin turno activo

```json
{
  "success": true,
  "message": "Sin turno activo en este momento",
  "data": null
}
```

### 401 — Sin token

```json
{
  "success": false,
  "message": "Token de acceso no proporcionado"
}
```

### 403 — Rol sin permiso

```json
{
  "success": false,
  "message": "No tiene permiso para acceder a este recurso"
}
```

### 500 — Error interno

```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "..."
}
```

---

## Seguridad

| Check | Detalle |
|---|---|
| Autenticación | `authenticate` middleware — valida JWT Bearer |
| Autorización | `requirePermission('patrullaje.sereno.read')` |
| Scope | El endpoint solo lee datos del usuario autenticado (no acepta `userId` externo) |
| Sin side effects | Solo lectura — no modifica ninguna tabla |

---

## Notas de implementación

- El endpoint siempre devuelve HTTP 200. `data: null` es un estado válido, no un error.
- El APK interpreta `data === null` como "GPS bloqueado".
- `turno.fecha` refleja la fecha local Lima (puede diferir de UTC si se llama después de las 19:00 UTC).
- `tipo_patrullaje` es `"VEHICULAR"` cuando viene de `operativos_vehiculos`, `"A_PIE"` cuando viene de `operativos_personal`.
