# API - Direcciones y Calles

Documentación para consumo externo de los endpoints de Direcciones y Calles, orientado a microservicios que necesiten crear novedades con dirección asociada.

## URL Base

```
https://{HOST}/api/v1
```

## Autenticación

```
Authorization: Bearer {token}
```

---

## 1. Calles (Vías)

Catálogo de calles/vías del distrito. Cada dirección pertenece a una calle.

### 1.1 Listar Calles

```http
GET /calles
```

**Permiso:** `calles.calles.read`

**Query Params:**

| Param          | Tipo    | Descripción                                  |
|----------------|---------|----------------------------------------------|
| `page`         | integer | Página (default: 1)                          |
| `limit`        | integer | Resultados por página (default: 20)          |
| `search`       | string  | Busca por `nombre_via`, `nombre_completo`, `calle_code` |
| `tipo_via_id`  | integer | Filtrar por tipo de vía                      |
| `urbanizacion` | string  | Filtrar por urbanización                     |
| `es_principal` | integer | `1` = principales, `0` = secundarias         |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 66,
      "calle_code": "C066",
      "tipo_via_id": 3,
      "nombre_via": "Santa Teresa",
      "nombre_completo": "Ca. Santa Teresa",
      "ubigeo_code": "150108",
      "urbanizacion": null,
      "zona": null,
      "sentido_via": "DOBLE_VIA",
      "es_principal": 0,
      "categoria_via": "LOCAL",
      "estado": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 1.2 Listar Calles Activas (sin paginación)

```http
GET /calles/activas
```

Retorna todas las calles activas. Ideal para llenar dropdowns.

### 1.3 Autocomplete de Calles

```http
GET /calles/autocomplete?q=santa&limit=10
```

**Query Params:**

| Param   | Tipo    | Requerido | Descripción                     |
|---------|---------|-----------|----------------------------------|
| `q`     | string  | Sí        | Texto a buscar (min 2 caracteres) |
| `limit` | integer | No        | Máximo resultados (default: 20)   |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 66,
      "calle_code": "C066",
      "nombre_via": "Santa Teresa",
      "nombre_completo": "Ca. Santa Teresa",
      "tipo_via_id": 3,
      "urbanizacion": null
    }
  ]
}
```

### 1.4 Obtener Calle por ID

```http
GET /calles/:id
```

Retorna la calle con estadísticas (cantidad de direcciones, etc.).

### 1.5 Crear Calle

```http
POST /calles
```

**Permiso:** `calles.calles.create`

**Body:**

```json
{
  "tipo_via_id": 3,
  "nombre_via": "Los Olivos",
  "ubigeo_code": "150108",
  "urbanizacion": "Urb. Villa Marina",
  "sentido_via": "DOBLE_VIA",
  "es_principal": 0,
  "categoria_via": "LOCAL"
}
```

| Campo                | Tipo    | Requerido | Descripción                                |
|----------------------|---------|-----------|---------------------------------------------|
| `tipo_via_id`        | integer | Sí        | FK tipos de vía (Ca., Av., Jr., Psje., etc.) |
| `nombre_via`         | string  | Sí        | Nombre de la vía (2-200 chars)               |
| `ubigeo_code`        | string  | No        | Código UBIGEO 6 dígitos                      |
| `urbanizacion`       | string  | No        | Nombre de urbanización (max 150)             |
| `zona`               | string  | No        | Zona (max 100)                               |
| `longitud_metros`    | decimal | No        | Longitud de la vía en metros                 |
| `ancho_metros`       | decimal | No        | Ancho de la vía en metros                    |
| `tipo_pavimento`     | enum    | No        | `ASFALTO`, `CONCRETO`, `AFIRMADO`, `TROCHA`, `ADOQUIN`, `SIN_PAVIMENTO` |
| `sentido_via`        | enum    | No        | `UNA_VIA`, `DOBLE_VIA`, `VARIABLE` (default: DOBLE_VIA) |
| `carriles`           | integer | No        | Cantidad de carriles (0-20)                  |
| `interseccion_inicio`| string  | No        | Intersección de inicio (max 200)             |
| `interseccion_fin`   | string  | No        | Intersección de fin (max 200)                |
| `es_principal`       | integer | No        | `1` = principal, `0` = secundaria (default: 0) |
| `categoria_via`      | enum    | No        | `ARTERIAL`, `COLECTORA`, `LOCAL`, `RESIDENCIAL` (default: LOCAL) |
| `linea_geometria_json` | json  | No        | GeoJSON LineString de la vía                 |

> **Restricción de unicidad:** Combinación `tipo_via_id` + `nombre_via` + `urbanizacion` debe ser única.

### 1.6 Actualizar Calle

```http
PUT /calles/:id
```

**Permiso:** `calles.calles.update`

Mismos campos que crear (todos opcionales).

### 1.7 Eliminar Calle (Soft Delete)

```http
DELETE /calles/:id
```

**Permiso:** `calles.calles.delete`

---

## 2. Direcciones

Direcciones físicas asociadas a una calle. Cada novedad puede vincularse a una dirección.

### 2.1 Listar Direcciones

```http
GET /direcciones
```

**Permiso:** `calles.direcciones.read`

**Query Params:**

| Param          | Tipo    | Descripción                                    |
|----------------|---------|------------------------------------------------|
| `page`         | integer | Página (default: 1)                            |
| `limit`        | integer | Resultados por página (default: 20)            |
| `search`       | string  | Busca en `direccion_completa`, `direccion_code`, `numero_municipal`, `manzana`, `lote` |
| `calle_id`     | integer | Filtrar por calle                              |
| `cuadrante_id` | integer | Filtrar por cuadrante                          |
| `sector_id`    | integer | Filtrar por sector                             |
| `geocodificada`| integer | `1` = con coordenadas, `0` = sin coordenadas  |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 31,
      "direccion_code": "D-000031",
      "calle_id": 66,
      "numero_municipal": "1052",
      "manzana": null,
      "lote": null,
      "urbanizacion": null,
      "tipo_complemento": null,
      "numero_complemento": null,
      "referencia": "Frente al parque",
      "direccion_completa": "Ca. Santa Teresa N° 1052",
      "cuadrante_id": 27,
      "sector_id": 26,
      "latitud": -12.168787,
      "longitud": -77.028577,
      "geocodificada": 1,
      "location_type": "GEOMETRIC_CENTER",
      "fuente_geocodificacion": "Nominatim OpenStreetMap API",
      "estado": 1
    }
  ],
  "pagination": { ... }
}
```

### 2.2 Listar Direcciones Activas (sin paginación)

```http
GET /direcciones/activas
```

Retorna hasta 100 direcciones activas. Ideal para dropdowns.

### 2.3 Buscar Dirección (Avanzado)

```http
GET /direcciones/search?calle=santa teresa&numero=1052
```

| Param         | Tipo   | Descripción                      |
|---------------|--------|----------------------------------|
| `calle`       | string | Busca en nombre de calle         |
| `numero`      | string | Busca por numero_municipal       |
| `urbanizacion`| string | Busca por urbanización           |

### 2.4 Obtener Dirección por ID

```http
GET /direcciones/:id
```

Retorna la dirección con todas sus relaciones (calle, cuadrante, sector).

### 2.5 Crear Dirección

```http
POST /direcciones
```

**Permiso:** `calles.direcciones.create`

**Body:**

```json
{
  "calle_id": 66,
  "numero_municipal": "1052",
  "referencia": "Frente al parque",
  "ubigeo_code": "150108",
  "latitud": -12.168787,
  "longitud": -77.028577,
  "geocodificada": 1,
  "fuente_geocodificacion": "Nominatim OpenStreetMap API",
  "location_type": "GEOMETRIC_CENTER"
}
```

| Campo                   | Tipo    | Requerido | Descripción                                         |
|-------------------------|---------|-----------|------------------------------------------------------|
| `calle_id`              | integer | Sí        | FK a calle (debe existir y estar activa)              |
| `numero_municipal`      | string  | Condicional | Número de puerta (max 20). Requerido si no hay manzana+lote |
| `manzana`               | string  | Condicional | Manzana (max 10). Requerido junto con `lote` si no hay numero_municipal |
| `lote`                  | string  | Condicional | Lote (max 10). Va junto con `manzana`                |
| `urbanizacion`          | string  | No        | Nombre de urbanización (max 150)                     |
| `tipo_complemento`      | enum    | No        | `DEPTO`, `OFICINA`, `PISO`, `INTERIOR`, `LOTE`, `MZ`, `BLOCK`, `TORRE`, `CASA` |
| `numero_complemento`    | string  | No        | Número del complemento (max 20)                      |
| `referencia`            | string  | No        | Referencia textual (max 500)                         |
| `ubigeo_code`           | string  | No        | Código UBIGEO 6 dígitos                              |
| `latitud`               | decimal | No        | Latitud GPS (-90 a 90)                               |
| `longitud`              | decimal | No        | Longitud GPS (-180 a 180)                            |
| `geocodificada`         | integer | No        | `1` = tiene coordenadas, `0` = sin coordenadas       |
| `fuente_geocodificacion`| string  | No        | Fuente de las coordenadas (max 50). **Enviar siempre si hay coords** |
| `location_type`         | enum    | No        | Precisión: `ROOFTOP`, `RANGE_INTERPOLATED`, `GEOMETRIC_CENTER`, `APPROXIMATE` |
| `observaciones`         | string  | No        | Notas adicionales (max 1000)                         |

> **Validación:** Debe tener `numero_municipal` O (`manzana` + `lote`). Ambos pueden coexistir.

> **Importante:** El campo `direccion_completa` se genera automáticamente en el backend a partir de la calle y los campos de la dirección.

**Response 201:**

```json
{
  "success": true,
  "message": "Dirección creada exitosamente",
  "data": {
    "id": 31,
    "direccion_code": "D-000031",
    "direccion_completa": "Ca. Santa Teresa N° 1052",
    "calle_id": 66,
    "numero_municipal": "1052",
    "latitud": -12.168787,
    "longitud": -77.028577,
    "geocodificada": 1,
    "location_type": "GEOMETRIC_CENTER",
    "fuente_geocodificacion": "Nominatim OpenStreetMap API",
    "estado": 1
  }
}
```

### 2.6 Actualizar Dirección

```http
PUT /direcciones/:id
```

**Permiso:** `calles.direcciones.update`

Mismos campos que crear (todos opcionales).

### 2.7 Actualizar Coordenadas GPS (Geocodificar)

```http
PATCH /direcciones/:id/geocodificar
```

**Permiso:** `calles.direcciones.geocodificar`

**Body:**

```json
{
  "latitud": -12.168787,
  "longitud": -77.028577,
  "fuente": "Manual"
}
```

| Campo     | Tipo    | Requerido | Descripción               |
|-----------|---------|-----------|----------------------------|
| `latitud` | decimal | Sí        | Latitud GPS (-90 a 90)     |
| `longitud`| decimal | Sí        | Longitud GPS (-180 a 180)  |
| `fuente`  | string  | No        | Fuente (default: "Manual") |

### 2.8 Geocodificar desde Texto

```http
GET /direcciones/geocodificar-texto?direccion=Ca. Santa Teresa 1052
```

**Permiso:** `calles.direcciones.geocodificar`

| Param      | Tipo   | Requerido | Descripción                     |
|------------|--------|-----------|----------------------------------|
| `direccion`| string | Sí        | Dirección a geocodificar (3-500 chars) |

Busca coordenadas primero en la base de datos (misma cuadra), luego en Nominatim API.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "latitud": -12.168787,
    "longitud": -77.028577,
    "fuente_geocodificacion": "Nominatim OpenStreetMap API",
    "location_type": "GEOMETRIC_CENTER",
    "direccion_formateada": "Ca. Santa Teresa 1052, Chorrillos, Lima"
  }
}
```

### 2.9 Eliminar Dirección (Soft Delete)

```http
DELETE /direcciones/:id
```

**Permiso:** `calles.direcciones.delete`

### 2.10 Reactivar Dirección

```http
PATCH /direcciones/:id/reactivar
```

### 2.11 Verificar si se puede Eliminar

```http
GET /direcciones/:id/can-delete
```

### 2.12 Direcciones más Usadas

```http
GET /direcciones/stats/mas-usadas?limit=10
```

---

## 3. Flujo para Crear Novedad con Dirección

Un microservicio que necesite crear novedades debe seguir este flujo:

### Paso 1: Buscar o crear la calle

```http
# Buscar calle existente
GET /calles/autocomplete?q=santa teresa

# Si no existe, crear
POST /calles
{ "tipo_via_id": 3, "nombre_via": "Santa Teresa" }
```

### Paso 2: Buscar o crear la dirección

```http
# Buscar dirección existente
GET /direcciones/search?calle=santa teresa&numero=1052

# Si no existe, crear con geocodificación
GET /direcciones/geocodificar-texto?direccion=Ca. Santa Teresa 1052

POST /direcciones
{
  "calle_id": 66,
  "numero_municipal": "1052",
  "latitud": -12.168787,
  "longitud": -77.028577,
  "geocodificada": 1,
  "fuente_geocodificacion": "Nominatim OpenStreetMap API",
  "location_type": "GEOMETRIC_CENTER"
}
```

### Paso 3: Crear la novedad con la dirección

```http
POST /novedades
{
  "tipo_novedad_id": 7,
  "subtipo_novedad_id": 28,
  "fecha_hora_ocurrencia": "2026-02-08 22:28:00",
  "direccion_id": 31,
  "localizacion": "Ca. Santa Teresa N° 1052",
  "latitud": -12.168787,
  "longitud": -77.028577,
  "sector_id": 26,
  "cuadrante_id": 27,
  "origen_llamada": "TELEFONO_107",
  "descripcion": "Se activó alarma en domicilio"
}
```

---

## 4. Valores de referencia

### Tipos de Vía (tipo_via_id)

| ID | Abreviatura | Nombre completo |
|----|-------------|-----------------|
| 1  | Av.         | Avenida         |
| 2  | Jr.         | Jirón           |
| 3  | Ca.         | Calle           |
| 4  | Psje.       | Pasaje          |
| 5  | Alam.       | Alameda         |
| 6  | Mal.        | Malecón         |

> Consultar `GET /tipos-via` para la lista actualizada.

### Location Type (precisión de geocodificación)

| Valor                | Precisión | Descripción                          |
|----------------------|-----------|---------------------------------------|
| `ROOFTOP`            | Alta      | Coordenada exacta del inmueble       |
| `RANGE_INTERPOLATED` | Media-Alta| Interpolación entre dos puntos       |
| `GEOMETRIC_CENTER`   | Media     | Centro geométrico de la cuadra       |
| `APPROXIMATE`        | Baja      | Aproximación por zona                |

### Fuentes de Geocodificación

| Valor                            | Descripción                        |
|----------------------------------|------------------------------------|
| `Manual`                         | Ingresada manualmente por usuario  |
| `Nominatim OpenStreetMap API`    | Geocodificación automática         |
| `Base de datos (misma cuadra)`   | Aproximación desde dirección cercana |

### Origen de Llamada (para novedades)

| Valor                           | Descripción                     |
|---------------------------------|---------------------------------|
| `TELEFONO_107`                  | Central telefónica 107          |
| `RADIO_TETRA`                   | Radio TETRA                     |
| `REDES_SOCIALES`                | Redes sociales                  |
| `BOTON_EMERGENCIA_ALERTA`       | Botón de emergencia app         |
| `BOTON_DENUNCIA_VECINO_ALERTA`  | Botón denuncia vecino app       |
| `INTERVENCION_DIRECTA`          | Intervención directa en campo   |
| `VIDEO_CCO`                     | Video del centro de control     |
| `ANALITICA`                     | Analítica de video              |
| `APP_PODER_JUDICIAL`            | App del Poder Judicial          |

---

## 5. Errores comunes

| Status | Mensaje | Causa |
|--------|---------|-------|
| 400 | "Debe proporcionar numero_municipal o manzana+lote" | POST dirección sin identificador |
| 400 | "La calle no existe o no está activa" | POST dirección con calle_id inválido |
| 400 | "Ya existe una dirección con estos datos" | Duplicado de calle + numero/mz+lote |
| 404 | "Dirección no encontrada" | GET/PUT/DELETE con ID inválido |
| 400 | "No se puede eliminar: tiene novedades asociadas" | DELETE dirección en uso |
