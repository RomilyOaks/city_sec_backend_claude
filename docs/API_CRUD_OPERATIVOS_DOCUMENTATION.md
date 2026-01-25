# Documentación API - Endpoints CRUD de Operativos

## Introducción

Este documento técnico detalla los endpoints CRUD (Crear, Leer, Actualizar, Eliminar) para las tablas relacionadas con operativos en el sistema. Está dirigido a desarrolladores frontend para facilitar la integración y el consumo de estos servicios.

## Autenticación y Autorización

Todos los endpoints descritos en este documento requieren autenticación mediante un **JSON Web Token (JWT)**. El token debe ser incluido en el encabezado `Authorization` de cada solicitud, con el formato `Bearer <token>`.

Además de la autenticación, el sistema utiliza un control de acceso basado en roles (RBAC) y permisos granulares. Cada operación CRUD requiere permisos específicos, los cuales se detallan para cada endpoint.

### Roles y Permisos

Los permisos se estructuran como `modulo.recurso.accion`. Por ejemplo, `operativos.turnos.read` permite leer turnos operativos.

## Endpoints por Módulo

---

### 1. Operativos Turno

**URL Base:** `/api/v1/operativos/turnos`

#### 1.1. Obtener todos los turnos

- **Endpoint:** `GET /`
- **Descripción:** Recupera una lista de todos los turnos operativos.
- **Permisos:** `operativos.turnos.read`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "personal_id": 101,
        "fecha_hora_inicio": "2026-01-09T08:00:00Z",
        "fecha_hora_fin": null,
        "estado": "Activo",
        "novedades": "Inicio de turno sin incidentes",
        "createdAt": "2026-01-09T07:00:00Z",
        "updatedAt": "2026-01-09T07:00:00Z"
      }
    ]
  }
  ```

#### 1.2. Obtener turno por ID

- **Endpoint:** `GET /:id`
- **Descripción:** Recupera un turno operativo específico por su ID.
- **Parámetros de Ruta:**
  - `id` (entero): ID del turno.
- **Permisos:** `operativos.turnos.read`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "personal_id": 101,
      "fecha_hora_inicio": "2026-01-09T08:00:00Z",
      "fecha_hora_fin": null,
      "estado": "Activo",
      "novedades": "Inicio de turno sin incidentes",
      "createdAt": "2026-01-09T07:00:00Z",
      "updatedAt": "2026-01-09T07:00:00Z"
    }
  }
  ```

#### 1.3. Crear un nuevo turno

- **Endpoint:** `POST /`
- **Descripción:** Crea un nuevo turno operativo.
- **Permisos:** `operativos.turnos.create`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "personal_id": 101,
    "fecha_hora_inicio": "2026-01-09T08:00:00Z",
    "estado": "Activo",
    "novedades": "Inicio de turno sin incidentes"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "message": "Turno creado exitosamente",
    "data": {
      "id": 2,
      "personal_id": 101,
      "fecha_hora_inicio": "2026-01-09T08:00:00Z",
      "fecha_hora_fin": null,
      "estado": "Activo",
      "novedades": "Inicio de turno sin incidentes",
      "createdAt": "2026-01-09T09:00:00Z",
      "updatedAt": "2026-01-09T09:00:00Z"
    }
  }
  ```

#### 1.4. Actualizar un turno

- **Endpoint:** `PUT /:id`
- **Descripción:** Actualiza la información de un turno operativo existente.
- **Parámetros de Ruta:**
  - `id` (entero): ID del turno a actualizar.
- **Permisos:** `operativos.turnos.update`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "fecha_hora_fin": "2026-01-09T17:00:00Z",
    "estado": "Finalizado",
    "novedades": "Turno finalizado sin novedades."
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Turno actualizado exitosamente",
    "data": [1]
  }
  ```

#### 1.5. Eliminar un turno (Soft Delete)

- **Endpoint:** `DELETE /:id`
- **Descripción:** Realiza un borrado lógico de un turno operativo.
- **Parámetros de Ruta:**
  - `id` (entero): ID del turno a eliminar.
- **Permisos:** `operativos.turnos.delete`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Turno eliminado exitosamente"
  }
  ```

---

### 2. Operativos Vehículos

**URL Base:** `/api/v1/operativos/turnos/:turnoId/vehiculos`

#### 2.1. Obtener todos los vehículos asignados a un turno

- **Endpoint:** `GET /`
- **Descripción:** Recupera una lista de todos los vehículos asignados a un turno operativo específico.
- **Parámetros de Ruta:**
  - `turnoId` (entero): ID del turno operativo.
- **Permisos:** `operativos.vehiculos.read`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "turno_id": 1,
        "vehiculo_id": 5,
        "conductor_id": 101,
        "kilometraje_inicio": 15000,
        "hora_inicio": "2026-01-09T08:00:00Z",
        "kilometraje_fin": null,
        "hora_fin": null,
        "createdAt": "2026-01-09T07:00:00Z",
        "updatedAt": "2026-01-09T07:00:00Z"
      }
    ]
  }
  ```

#### 2.2. Asignar un vehículo a un turno

- **Endpoint:** `POST /`
- **Descripción:** Asigna un nuevo vehículo a un turno operativo.
- **Parámetros de Ruta:**
  - `turnoId` (entero): ID del turno operativo.
- **Permisos:** `operativos.vehiculos.create`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "vehiculo_id": 5,
    "conductor_id": 101,
    "kilometraje_inicio": 15000,
    "hora_inicio": "2026-01-09T08:00:00Z"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "message": "Vehículo asignado al turno exitosamente",
    "data": {
      "id": 2,
      "turno_id": 1,
      "vehiculo_id": 5,
      "conductor_id": 101,
      "kilometraje_inicio": 15000,
      "hora_inicio": "2026-01-09T08:00:00Z",
      "createdAt": "2026-01-09T09:00:00Z",
      "updatedAt": "2026-01-09T09:00:00Z"
    }
  }
  ```

#### 2.3. Actualizar asignación de vehículo en turno

- **Endpoint:** `PUT /:id`
- **Descripción:** Actualiza la información de la asignación de un vehículo en un turno operativo.
- **Parámetros de Ruta:**
  - `turnoId` (entero): ID del turno operativo.
  - `id` (entero): ID de la asignación del vehículo en el turno.
- **Permisos:** `operativos.vehiculos.update`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "kilometraje_fin": 15150,
    "hora_fin": "2026-01-09T17:00:00Z"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Asignación de vehículo en turno actualizada exitosamente",
    "data": [1]
  }
  ```

#### 2.4. Eliminar asignación de vehículo en turno (Soft Delete)

- **Endpoint:** `DELETE /:id`
- **Descripción:** Realiza un borrado lógico de la asignación de un vehículo en un turno.
- **Parámetros de Ruta:**
  - `turnoId` (entero): ID del turno operativo.
  - `id` (entero): ID de la asignación del vehículo en el turno a eliminar.
- **Permisos:** `operativos.vehiculos.delete`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Asignación de vehículo en turno eliminada exitosamente"
  }
  ```

---

### 3. Operativos Vehículos Cuadrantes

**URL Base:** `/api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes`

#### 3.1. Obtener todos los cuadrantes de un vehículo operativo

- **Endpoint:** `GET /`
- **Descripción:** Recupera una lista de todos los cuadrantes asignados a un vehículo operativo específico.
- **Parámetros de Ruta:**
  - `operativoVehiculoId` (entero): ID de la asignación del vehículo operativo (de `operativos_vehiculos`).
- **Permisos:** `operativos.vehiculos.cuadrantes.read`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "operativo_vehiculo_id": 1,
        "cuadrante_id": 10,
        "hora_ingreso": "2026-01-09T09:00:00Z",
        "hora_salida": null,
        "observaciones": "Patrullaje rutinario",
        "incidentes_reportados": null,
        "estado_registro": 1,
        "createdAt": "2026-01-09T08:30:00Z",
        "updatedAt": "2026-01-09T08:30:00Z"
      }
    ]
  }
  ```

#### 3.2. Asignar un cuadrante a un vehículo operativo

- **Endpoint:** `POST /`
- **Descripción:** Asigna un nuevo cuadrante a un vehículo operativo.
- **Parámetros de Ruta:**
  - `operativoVehiculoId` (entero): ID de la asignación del vehículo operativo.
- **Permisos:** `operativos.vehiculos.cuadrantes.create`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "cuadrante_id": 10,
    "hora_ingreso": "2026-01-09T09:00:00Z",
    "observaciones": "Patrullaje rutinario"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "message": "Cuadrante asignado al vehículo operativo exitosamente",
    "data": {
      "id": 2,
      "operativo_vehiculo_id": 1,
      "cuadrante_id": 10,
      "hora_ingreso": "2026-01-09T09:00:00Z",
      "observaciones": "Patrullaje rutinario",
      "createdAt": "2026-01-09T09:30:00Z",
      "updatedAt": "2026-01-09T09:30:00Z"
    }
  }
  ```

#### 3.3. Actualizar asignación de cuadrante en vehículo operativo

- **Endpoint:** `PUT /:id`
- **Descripción:** Actualiza la información de la asignación de un cuadrante en un vehículo operativo.
- **Parámetros de Ruta:**
  - `operativoVehiculoId` (entero): ID de la asignación del vehículo operativo.
  - `id` (entero): ID de la asignación del cuadrante.
- **Permisos:** `operativos.vehiculos.cuadrantes.update`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "hora_salida": "2026-01-09T12:00:00Z",
    "incidentes_reportados": "Ninguno",
    "estado_registro": 0
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Asignación de cuadrante en vehículo operativo actualizada exitosamente",
    "data": [1]
  }
  ```

#### 3.4. Eliminar asignación de cuadrante en vehículo operativo (Soft Delete)

- **Endpoint:** `DELETE /:id`
- **Descripción:** Realiza un borrado lógico de la asignación de un cuadrante en un vehículo operativo.
- **Parámetros de Ruta:**
  - `operativoVehiculoId` (entero): ID de la asignación del vehículo operativo.
  - `id` (entero): ID de la asignación del cuadrante a eliminar.
- **Permisos:** `operativos.vehiculos.cuadrantes.delete`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Asignación de cuadrante en vehículo operativo eliminada exitosamente"
  }
  ```

---

### 4. Operativos Vehículos Novedades

**URL Base:** `/api/v1/operativos/vehiculos/cuadrantes/:operativoVehiculoCuadranteId/novedades`

#### 4.1. Obtener todas las novedades de un cuadrante de vehículo operativo

- **Endpoint:** `GET /`
- **Descripción:** Recupera una lista de todas las novedades asignadas a un cuadrante de vehículo operativo específico.
- **Parámetros de Ruta:**
  - `operativoVehiculoCuadranteId` (entero): ID de la asignación del cuadrante de vehículo operativo (de `operativos_vehiculos_cuadrantes`).
- **Permisos:** `operativos.vehiculos.novedades.read`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "operativo_vehiculo_cuadrante_id": 1,
        "novedad_id": 1,
        "reportado": "2026-01-09T10:00:00Z",
        "estado": 1,
        "observaciones": "Se reporta incidente menor en el cuadrante.",
        "createdAt": "2026-01-09T09:45:00Z",
        "updatedAt": "2026-01-09T09:45:00Z"
      }
    ]
  }
  ```

#### 4.2. Asignar una novedad a un cuadrante de vehículo operativo

- **Endpoint:** `POST /`
- **Descripción:** Asigna una nueva novedad a un cuadrante de vehículo operativo.
- **Parámetros de Ruta:**
  - `operativoVehiculoCuadranteId` (entero): ID de la asignación del cuadrante de vehículo operativo.
- **Permisos:** `operativos.vehiculos.novedades.create`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "novedad_id": 1,
    "reportado": "2026-01-09T10:00:00Z",
    "estado": 1,
    "observaciones": "Se reporta incidente menor en el cuadrante."
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "message": "Novedad asignada al cuadrante de vehículo operativo exitosamente",
    "data": {
      "id": 2,
      "operativo_vehiculo_cuadrante_id": 1,
      "novedad_id": 1,
      "reportado": "2026-01-09T10:00:00Z",
      "estado": 1,
      "observaciones": "Se reporta incidente menor en el cuadrante.",
      "createdAt": "2026-01-09T10:15:00Z",
      "updatedAt": "2026-01-09T10:15:00Z"
    }
  }
  ```

#### 4.3. Actualizar asignación de novedad en cuadrante de vehículo operativo

- **Endpoint:** `PUT /:id`
- **Descripción:** Actualiza la información de la asignación de una novedad en un cuadrante de vehículo operativo.
- **Parámetros de Ruta:**
  - `operativoVehiculoCuadranteId` (entero): ID de la asignación del cuadrante de vehículo operativo.
  - `id` (entero): ID de la asignación de la novedad.
- **Permisos:** `operativos.vehiculos.novedades.update`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "estado": 0,
    "observaciones": "Incidente resuelto."
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Novedad en cuadrante de vehículo operativo actualizada exitosamente",
    "data": [1]
  }
  ```

#### 4.4. Eliminar asignación de novedad en cuadrante de vehículo operativo (Soft Delete)

- **Endpoint:** `DELETE /:id`
- **Descripción:** Realiza un borrado lógico de la asignación de una novedad en un cuadrante de vehículo operativo.
- **Parámetros de Ruta:**
  - `operativoVehiculoCuadranteId` (entero): ID de la asignación del cuadrante de vehículo operativo.
  - `id` (entero): ID de la asignación de la novedad a eliminar.
- **Permisos:** `operativos.vehiculos.novedades.delete`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Novedad en cuadrante de vehículo operativo eliminada exitosamente"
  }
  ```
