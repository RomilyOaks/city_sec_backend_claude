# Módulo Patrullaje — Turno Activo del Sereno (TD-P-005)

Implementado en `v2.5.0`. Consumido por el APK `city_sec_patrol` para determinar si el sereno autenticado tiene un turno activo y qué operativo le corresponde.

### Endpoint

```
GET /api/v1/patrullaje/turno-activo
Authorization: Bearer <JWT_SERENO>
```

- Siempre responde **HTTP 200**. Si no hay turno activo → `data: null`.
- Permiso requerido: `patrullaje.sereno.read` (asignado al rol `sereno` vía `seedPatrullaje.js`).
- `super_admin` y `admin` pasan automáticamente (bypass en `requireAnyPermission`).

### Lógica de resolución

```
1. Obtener personal_seguridad_id del usuario autenticado
2. Buscar horario activo en HorariosTurnos comparando hora Lima actual
3. Calcular fecha del operativo (corrección si turno cruza medianoche)
4. Verificar que existe OperativosTurno para ese turno + fecha
5. Buscar en OperativosVehiculos (conductor_id o copiloto_id = psId)
   → si encontrado: tipo_patrullaje = VEHICULAR
6. Si no: buscar en OperativosPersonal (personal_id o sereno_id = psId)
   → si encontrado: tipo_patrullaje = A_PIE
7. Si no: turno activo sin asignación operativa
```

### Respuesta — caso VEHICULAR

```json
{
  "success": true,
  "message": "Turno activo obtenido exitosamente",
  "data": {
    "turno": {
      "nombre": "NOCHE",
      "hora_inicio": "23:00:00",
      "hora_fin": "07:00:00",
      "fecha": "2026-06-05"
    },
    "sereno": {
      "id": 18,
      "nombres": "Federico",
      "apellido_paterno": "CHAVEZ",
      "apellido_materno": "QUIROGA",
      "doc_tipo": "DNI",
      "doc_numero": "91734562"
    },
    "rol_operativo": "CONDUCTOR",
    "vehiculo": {
      "id": 37,
      "codigo_vehiculo": "M-3",
      "placa": "UWG-5623",
      "marca": "Nissan"
    },
    "tipo_patrullaje": "VEHICULAR",
    "cuadrante": { "id": 24, "nombre": "Cuadrante CSS3A-01" },
    "novedades_asignadas": []
  }
}
```

`rol_operativo` puede ser `CONDUCTOR` o `COPILOTO` según `operativos_vehiculos.conductor_id` vs `copiloto_id`.

### Respuesta — caso A PIE

```json
{
  "success": true,
  "message": "Turno activo obtenido exitosamente",
  "data": {
    "turno": {
      "nombre": "NOCHE",
      "hora_inicio": "23:00:00",
      "hora_fin": "07:00:00",
      "fecha": "2026-06-05"
    },
    "sereno": {
      "id": 20,
      "nombres": "Jose",
      "apellido_paterno": "TAMAYO",
      "apellido_materno": "TRUJILLO",
      "doc_tipo": "DNI",
      "doc_numero": "88774455"
    },
    "rol_operativo": "SERENO_PRINCIPAL",
    "vehiculo": null,
    "tipo_patrullaje": "A_PIE",
    "cuadrante": { "id": 27, "nombre": "Cuadrante CSS1A-01" },
    "novedades_asignadas": []
  }
}
```

`rol_operativo` puede ser `SERENO_PRINCIPAL` (personal_id) o `SERENO_AUXILIAR` (sereno_id).

### Novedades asignadas

Cuando el sereno está activo en un cuadrante y tiene novedades vinculadas, `novedades_asignadas` se puebla:

```json
"novedades_asignadas": [
  {
    "id": 101,
    "codigo": "NOV-2026-0101",
    "descripcion": "Persona sospechosa en la vía pública",
    "prioridad": "ALTA",
    "fecha_hora": "2026-06-05T23:45:00.000Z",
    "tipo": "Orden Público",
    "subtipo": "Persona Sospechosa",
    "estado": "EN ATENCIÓN"
  }
]
```

### Alias Sequelize críticos

El controlador incluye modelos anidados que deben usar los alias exactos de `models/index.js`:

| Asociación | Alias correcto |
|---|---|
| `Novedad → TipoNovedad` | `novedadTipoNovedad` |
| `Novedad → SubtipoNovedad` | `novedadSubtipoNovedad` |
| `Novedad → EstadoNovedad` | `novedadEstado` |
| `OperativosVehiculosCuadrantes → Cuadrante` | `cuadrante` |
| `OperativosPersonalCuadrantes → Cuadrante` | `datosCuadrante` |
| `Usuario → PersonalSeguridad` | `usuarioPersonalSeguridad` |
| `OperativosVehiculos → OperativosTurno` | `turno` |
| `OperativosPersonal → OperativosTurno` | `turno` |

Si se agrega un `include` nuevo en `patrullajeController.js`, verificar el alias en `src/models/index.js` antes de codificar — un alias incorrecto produce `SequelizeEagerLoadingError` solo en producción.

### Turnos que cruzan medianoche

Si `HorariosTurnos.cruza_medianoche = true` y la hora actual Lima es menor que `hora_fin`, el operativo se registró con la **fecha de ayer**. El controlador ajusta `fechaOperativo` restando 1 día con UTC puro:

```js
const [y, m, d] = hoyPeru.split("-").map(Number);
fechaOperativo = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
```

No usar `toISOString()` directamente sobre `new Date()` para obtener la fecha Lima — da la fecha UTC, no Lima (UTC-5).
