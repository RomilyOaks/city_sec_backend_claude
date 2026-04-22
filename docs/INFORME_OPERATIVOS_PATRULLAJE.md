# Informe de Operativos de Patrullaje - Endpoints Disponibles

## Overview
Análisis completo de todos los endpoints relacionados con operativos de patrullaje, incluyendo reportes, resúmenes y estadísticas por sectores, vehículos, personal a pie, cuadrantes y novedades.

---

## 1. Módulo de Turnos Operativos

### **OperativosTurno** - Gestión de Turnos
**Archivo:** `src/routes/operativos-turno.routes.js`  
**Controller:** `src/controllers/operativosTurnoController.js`

#### Endpoints Principales:
```http
GET    /api/v1/operativos-turno              - Listar turnos
GET    /api/v1/operativos-turno/:id          - Obtener turno específico
POST   /api/v1/operativos-turno              - Crear turno
PUT    /api/v1/operativos-turno/:id          - Actualizar turno
DELETE /api/v1/operativos-turno/:id          - Eliminar turno
```

#### **Datos por Turno:**
- **operador_id**: ID del operador responsable
- **supervisor_id**: ID del supervisor (opcional)
- **fecha_turno**: Fecha del turno
- **hora_inicio**: Hora de inicio
- **hora_fin**: Hora de fin
- **estado**: Estado del turno
- **observaciones**: Observaciones generales

---

## 2. Operativos de Vehículos

### **OperativosVehiculos** - Vehículos en Patrullaje
**Archivo:** `src/routes/operativos-vehiculos.routes.js`  
**Controller:** `src/controllers/operativosVehiculosController.js`

#### Endpoints por Turno:
```http
GET    /api/v1/operativos-turno/:turnoId/vehiculos           - Vehículos del turno
GET    /api/v1/operativos-turno/:turnoId/vehiculos/:id       - Vehículo específico
POST   /api/v1/operativos-turno/:turnoId/vehiculos           - Asignar vehículo
PUT    /api/v1/operativos-turno/:turnoId/vehiculos/:id       - Actualizar asignación
DELETE /api/v1/operativos-turno/:turnoId/vehiculos/:id       - Eliminar asignación
```

#### Endpoints Generales (Reportes):
```http
GET    /api/v1/operativos-vehiculos                - Listar todos con filtros
GET    /api/v1/operativos-vehiculos/:id            - Obtener vehículo por ID
```

#### **Filtros Disponibles para Reportes:**
- `page`, `limit`: Paginación
- `search`: Búsqueda por placa, marca, conductor, copiloto
- `turno_id`: Filtrar por turno específico
- `vehiculo_id`: Filtrar por vehículo
- `conductor_id`: Filtrar por conductor
- `copiloto_id`: Filtrar por copiloto
- `estado_operativo_id`: Filtrar por estado operativo
- `fecha_inicio`, `fecha_fin`: Rango de fechas
- `sort`, `order`: Ordenamiento

#### **Datos de Vehículos Operativos:**
- **vehiculo_id**: ID del vehículo
- **conductor_id**: ID del conductor
- **copiloto_id**: ID del copiloto
- **radio_id**: ID del radio tetra
- **tipo_copiloto_id**: Tipo de copiloto
- **estado_operativo_id**: Estado operativo
- **hora_inicio**: Hora de inicio de patrullaje
- **hora_fin**: Hora de fin de patrullaje
- **kilometraje_inicio**: KM al inicio
- **kilometraje_fin**: KM al final
- **combustible_inicio**: Combustible al inicio
- **combustible_fin**: Combustible al final
- **observaciones**: Observaciones del operativo

---

## 3. Operativos de Personal a Pie

### **OperativosPersonal** - Personal en Patrullaje a Pie
**Archivo:** `src/routes/operativos-personal.routes.js`  
**Controller:** `src/controllers/operativosPersonalController.js`

#### Endpoints por Turno:
```http
GET    /api/v1/operativos-turno/:turnoId/personal            - Personal del turno
GET    /api/v1/operativos-turno/:turnoId/personal/:id       - Personal específico
POST   /api/v1/operativos-turno/:turnoId/personal            - Asignar personal
PUT    /api/v1/operativos-turno/:turnoId/personal/:id       - Actualizar asignación
DELETE /api/v1/operativos-turno/:turnoId/personal/:id       - Eliminar asignación
```

#### Endpoints Generales (Reportes):
```http
GET    /api/v1/operativos-personal                 - Listar todo el personal operativo
```

#### **Gestión de Cuadrantes por Personal:**
```http
GET    /api/v1/operativos-turno/personal/:id/cuadrantes           - Cuadrantes del personal
POST   /api/v1/operativos-turno/personal/:id/cuadrantes           - Asignar cuadrante
PUT    /api/v1/operativos-turno/personal/:id/cuadrantes/:cuadranteId - Actualizar cuadrante
DELETE /api/v1/operativos-turno/personal/:id/cuadrantes/:cuadranteId - Eliminar cuadrante
```

#### **Datos de Personal Operativo:**
- **personal_id**: ID del personal
- **radio_id**: ID del radio tetra
- **estado_operativo_id**: Estado operativo
- **hora_inicio**: Hora de inicio
- **hora_fin**: Hora de fin
- **observaciones**: Observaciones

---

## 4. Gestión de Cuadrantes

### **Cuadrantes por Vehículos**
**Archivo:** `src/routes/operativos-vehiculos-cuadrantes.routes.js`

#### Endpoints:
```http
GET    /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/cuadrantes     - Cuadrantes del vehículo
POST   /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/cuadrantes     - Asignar cuadrante
PUT    /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/cuadrantes/:id - Actualizar cuadrante
DELETE /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/cuadrantes/:id - Eliminar cuadrante
```

### **Cuadrantes por Personal**
**Archivo:** `src/routes/operativos-personal.routes.js`

#### Endpoints:
```http
GET    /api/v1/operativos-turno/personal/:id/cuadrantes           - Cuadrantes del personal
POST   /api/v1/operativos-turno/personal/:id/cuadrantes           - Asignar cuadrante
PUT    /api/v1/operativos-turno/personal/:id/cuadrantes/:cuadranteId - Actualizar cuadrante
DELETE /api/v1/operativos-turno/personal/:id/cuadrantes/:cuadranteId - Eliminar cuadrante
```

#### **Datos de Cuadrantes:**
- **cuadrante_id**: ID del cuadrante
- **sector_id**: ID del sector (relacionado)
- **nombre**: Nombre del cuadrante
- **descripcion**: Descripción del área
- **coordenadas**: Coordenadas geográficas
- **estado**: Estado del cuadrante

---

## 5. Gestión de Novedades en Operativos

### **Novedades de Vehículos**
**Archivo:** `src/routes/operativos-vehiculos-novedades.routes.js`

#### Endpoints:
```http
GET    /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/novedades     - Novedades del vehículo
POST   /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/novedades     - Registrar novedad
PUT    /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/novedades/:id - Actualizar novedad
DELETE /api/v1/operativos-turno/:turnoId/vehiculos/:vehiculoId/novedades/:id - Eliminar novedad
```

### **Novedades de Personal**
**Archivo:** `src/routes/operativos-personal-novedades.routes.js`

#### Endpoints:
```http
GET    /api/v1/operativos-turno/:turnoId/personal/:personalId/novedades     - Novedades del personal
POST   /api/v1/operativos-turno/:turnoId/personal/:personalId/novedades     - Registrar novedad
PUT    /api/v1/operativos-turno/:turnoId/personal/:personalId/novedades/:id - Actualizar novedad
DELETE /api/v1/operativos-turno/:turnoId/personal/:personalId/novedades/:id - Eliminar novedad
```

#### **Datos de Novedades en Operativos:**
- **novedad_id**: ID de la novedad principal
- **prioridad_actual**: Prioridad asignada
- **reportado**: Fecha/hora de reporte
- **atendido**: Fecha/hora de atención
- **acciones_tomadas**: Acciones realizadas
- **observaciones**: Observaciones adicionales

---

## 6. Operativos Combinados

### **Reportes Combinados**
**Archivo:** `src/routes/operativos-combinados.routes.js`  
**Controller:** `src/controllers/operativosCombinadosController.js`

#### Endpoint Principal:
```http
GET    /api/v1/operativos/novedades/:novedadId/combinadas     - Operativos combinados por novedad
```

#### **Respuesta Incluye:**
- **operativo_vehiculo**: Datos del vehículo asignado
- **operativo_personal**: Datos del personal asignado
- **resumen**: 
  - `total_operativos`: Cantidad de operativos
  - `campos_principales_completos`: Campos principales llenos
  - `campos_secundarios_completos`: Campos secundarios llenos
  - `ambos_operativos_presentes`: Si ambos tipos están presentes

---

## 7. Endpoints para Reportes y Estadísticas

### **Reportes Generales Disponibles:**

#### **Vehículos Operativos:**
```http
GET /api/v1/operativos-vehiculos
```
- **Filtros**: turno, vehículo, conductor, copiloto, estado operativo, fechas
- **Ordenamiento**: hora_inicio, conductor, vehículo, etc.
- **Paginación**: page, limit

#### **Personal Operativo:**
```http
GET /api/v1/operativos-personal
```
- **Filtros**: turno, personal, estado operativo, fechas
- **Ordenamiento**: hora_inicio, personal, etc.
- **Paginación**: page, limit

#### **Novedades Dashboard:**
```http
GET /api/v1/novedades/dashboard/stats          - Estadísticas generales
GET /api/v1/novedades/dashboard/en-atencion    - Novedades en atención
```

#### **Vehículos Dashboard:**
```http
GET /api/v1/vehiculos/stats                    - Estadísticas de vehículos
GET /api/v1/vehiculos/disponibles             - Vehículos disponibles
```

---

## 8. Estructura para Reportes Detallados

### **Por Sectores:**
- **Sector ID**: Disponible en cuadrantes asignados
- **Nombre del Sector**: A través de relación con cuadrantes
- **Cuadrantes del Sector**: Lista de cuadrantes por sector
- **Recursos Asignados**: Vehículos y personal por cuadrante

### **Por Vehículos:**
- **Datos del Vehículo**: Marca, modelo, placa, tipo
- **Conductor y Copiloto**: Datos completos del personal
- **Estado Operativo**: Actual y historial
- **Cuadrantes Asignados**: Áreas de patrullaje
- **Novedades Atendidas**: Lista y detalles
- **Kilometraje y Combustible**: Métricas de consumo

### **Por Personal a Pie:**
- **Datos del Personal**: Nombre, cargo, documento
- **Estado Operativo**: Actual y historial
- **Cuadrantes Asignados**: Áreas de patrullaje
- **Novedades Atendidas**: Lista y detalles
- **Radio Tetra**: Información de comunicaciones

### **Por Cuadrantes:**
- **Datos del Cuadrante**: Nombre, descripción, coordenadas
- **Sector Pertenece**: Datos del sector
- **Vehículos Asignados**: Lista y detalles
- **Personal Asignado**: Lista y detalles
- **Novedades en el Área**: Incidentes atendidos

### **Novedades y Estados:**
- **Información General**: Código, tipo, subtipo, prioridad
- **Estados del Proceso**: Historial de cambios
- **Recursos Asignados**: Vehículos y personal
- **Tiempos de Respuesta**: Reporte vs atención
- **Ubicación**: Dirección y coordenadas
- **Acciones Tomadas**: Detalles de la intervención

---

## 9. Ejemplos de Queries para Reportes

### **Reporte de Operativos por Fecha:**
```http
GET /api/v1/operativos-vehiculos?fecha_inicio=2026-04-20&fecha_fin=2026-04-20&sort=hora_inicio&order=ASC
GET /api/v1/operativos-personal?fecha_inicio=2026-04-20&fecha_fin=2026-04-20&sort=hora_inicio&order=ASC
```

### **Reporte por Sector:**
```http
GET /api/v1/operativos-vehiculos?search=SECTOR_NORTE&sort=cuadrante.nombre&order=ASC
GET /api/v1/operativos-personal?search=SECTOR_SUR&sort=cuadrante.nombre&order=ASC
```

### **Reporte de Novedades por Operativo:**
```http
GET /api/v1/operativos/novedades/123/combinadas
```

### **Estadísticas del Dashboard:**
```http
GET /api/v1/novedades/dashboard/stats
GET /api/v1/novedades/dashboard/en-atencion
GET /api/v1/vehiculos/stats
```

---

## 10. Resumen de Capacidades de Reporte

### **Reportes Disponibles:**
1. **Reporte General de Operativos**: Todos los vehículos y personal con filtros
2. **Reporte por Turno**: Operativos específicos de un turno
3. **Reporte por Sector**: Recursos por áreas geográficas
4. **Reporte por Vehículo**: Historial y asignaciones de cada vehículo
5. **Reporte por Personal**: Historial y asignaciones de cada persona
6. **Reporte por Cuadrante**: Recursos y novedades por área
7. **Reporte de Novedades**: Incidentes y su gestión
8. **Reporte Combinado**: Vehículos + personal por novedad
9. **Estadísticas Dashboard**: Métricas en tiempo real
10. **Reporte de Estados**: Estados operativos y cambios

### **Filtros Avanzados:**
- **Temporales**: Rangos de fechas y horas
- **Geográficos**: Sectores y cuadrantes
- **De Recursos**: Vehículos, personal, conductores
- **Operativos**: Estados operativos, tipos de operativo
- **De Novedades**: Prioridades, tipos, estados

### **Métricas Disponibles:**
- **Tiempos de Respuesta**: Reporte vs atención
- **Recursos Activos**: Cantidad por tipo y estado
- **Cobertura Geográfica**: Cuadrantes y sectores cubiertos
- **Eficiencia Operativa**: Kilometraje, combustible
- **Novedades Atendidas**: Por prioridad y tipo
- **Disponibilidad de Recursos**: Vehículos y personal disponibles

---

## Conclusiones

El sistema de operativos de patrullaje ofrece una estructura completa y flexible para generar múltiples tipos de reportes, desde resúmenes generales hasta análisis detallados por sectores, recursos específicos y novedades atendidas. Los endpoints están diseñados para permitir consultas eficientes con filtros avanzados y relaciones completas que proporcionan toda la información necesaria para la toma de decisiones operativas.
