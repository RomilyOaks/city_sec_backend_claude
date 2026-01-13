# Documentación: Implementación de Cuadrantes por Vehículo

## 📋 Overview

Este documento describe la implementación frontend para la nueva funcionalidad de **visualización de cuadrantes asignados a cada vehículo** dentro del módulo de Gestión de Operativos de Patrullaje.

## 🎯 Objetivo

Permitir al usuario navegar desde la lista de vehículos del turno operativo hasta los cuadrantes específicos que cada vehículo está patrullando, completando el flujo de navegación:

```
Operativos por Turnos → Vehículos del Turno → Cuadrantes por Vehículo
```

## 🔗 Flujo de Navegación

### 1. Pantalla Actual: Vehículos del Turno Operativo
- **Ruta actual**: `/operativos/turnos/:turnoId/vehiculos`
- **Tabla actual**: Muestra vehículos con placa, conductor, copiloto, km, etc.
- **Acción requerida**: Agregar icono/botón "Cuadrantes" en columna "Acciones"

### 2. Nueva Pantalla: Cuadrantes por Vehículo
- **Nueva ruta**: `/operativos/turnos/:turnoId/vehiculos/:vehiculoId/cuadrantes`
- **Contenido**: Lista de cuadrantes asignados al vehículo seleccionado

## 🛠 API Endpoints

### Obtener Cuadrantes de un Vehículo

```http
GET /api/v1/operativos/{turnoId}/vehiculos/{vehiculoId}/cuadrantes
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parámetros de URL:**
- `turnoId`: ID del turno operativo (obligatorio)
- `vehiculoId`: ID del vehículo operativo (obligatorio)

**Response Exitoso (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "operativo_vehiculo_id": 123,
      "cuadrante_id": 45,
      "hora_ingreso": "2026-01-12T08:00:00.000Z",
      "hora_salida": "2026-01-12T10:30:00.000Z",
      "observaciones": "Patrullaje normal sin incidentes",
      "incidentes_reportados": null,
      "tiempo_minutos": 150,
      "estado_registro": 1,
      "created_at": "2026-01-12T08:00:00.000Z",
      "updated_at": "2026-01-12T10:30:00.000Z",
      "cuadrante": {
        "id": 45,
        "cuadrante_code": "C015",
        "nombre": "Centro Comercial Norte",
        "sector_id": 3,
        "zona_code": "ZONA-A",
        "latitud": -12.04640000,
        "longitud": -77.04280000,
        "color_mapa": "#10B981",
        "estado": true
      }
    }
  ]
}
```

**Response de Error (404):**
```json
{
  "status": "error",
  "message": "Vehículo operativo no encontrado"
}
```

## 🎨 Diseño de la Interfaz

### 1. Modificaciones en Pantalla de Vehículos

**Archivo a modificar:** Componente que muestra la tabla de vehículos

**Cambios requeridos:**
- Agregar nueva columna "Cuadrantes" o modificar columna "Acciones"
- Agregar icono de mapa/localización 
- Configurar navegación al hacer clic

**Ejemplo de implementación:**
```jsx
// En la columna de acciones
<IconButton 
  onClick={() => navigate(`/operativos/turnos/${turnoId}/vehiculos/${vehiculo.id}/cuadrantes`)}
  title="Ver Cuadrantes"
>
  <MapIcon />
</IconButton>
```

**Importante:** La URL debe incluir el `turnoId` para que coincida con la ruta del backend.

### 2. Nueva Pantalla de Cuadrantes

**Componente sugerido:** `CuadrantesPorVehiculo.js`

**Estructura del componente:**
```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from '../components/ui/DataTable';
import { Card } from '../components/ui/Card';

const CuadrantesPorVehiculo = () => {
  const { turnoId, vehiculoId } = useParams();
  const [cuadrantes, setCuadrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Lógica de carga de datos
  // Lógica de navegación
  // Renderizado de tabla
};
```

## 📊 Estructura de Datos para Tabla

### Columnas Sugeridas

| Columna | Dato | Formato |
|---------|------|---------|
| **Código** | `cuadrante.cuadrante_code` | Texto (C001, C002) |
| **Nombre** | `cuadrante.nombre` | Texto |
| **Ingreso** | `hora_ingreso` | Fecha/Hora (DD/MM HH:mm) |
| **Salida** | `hora_salida` | Fecha/Hora (DD/MM HH:mm) |
| **Tiempo** | `tiempo_minutos` | Número + "min" |
| **Incidentes** | `incidentes_reportados` | Texto/Icono |
| **Acciones** | - | Iconos de ver/editar |

### Formato de Fechas

```javascript
// Función utilitaria para formateo
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

## 🔐 Permisos Requeridos

El usuario necesita el permiso:
- `operativos.vehiculos.cuadrantes.read`

**Validación en frontend:**
```javascript
const hasPermission = usePermissions(['operativos.vehiculos.cuadrantes.read']);
if (!hasPermission) {
  return <AccessDenied />;
}
```

## 🎯 Estados de la Interfaz

### 1. Estado de Carga
```jsx
if (loading) {
  return <LoadingSpinner message="Cargando cuadrantes..." />;
}
```

### 2. Estado Vacío
```jsx
if (cuadrantes.length === 0) {
  return (
    <EmptyState 
      message="Este vehículo no tiene cuadrantes asignados"
      description="Los cuadrantes se asignan cuando el vehículo inicia el patrullaje"
    />
  );
}
```

### 3. Estado de Error
```jsx
if (error) {
  return (
    <ErrorState 
      message="Error al cargar los cuadrantes"
      onRetry={() => loadCuadrantes()}
    />
  );
}
```

## 🚀 Implementación Paso a Paso

### Paso 1: Modificar Componente de Vehículos
1. Agregar botón/icono de cuadrantes en la tabla
2. Configurar ruta con parámetros dinámicos
3. Agregar validación de permisos

### Paso 2: Crear Componente de Cuadrantes
1. Crear nuevo componente `CuadrantesPorVehiculo.js`
2. Implementar llamada al API endpoint
3. Configurar tabla con columnas sugeridas
4. Agregar estados de carga/vacío/error

### Paso 3: Configurar Rutas
1. Agregar nueva ruta en el router
2. Configurar breadcrumbs de navegación
3. Aguard de autenticación y permisos

### Paso 4: Estilos y UX
1. Mantener consistencia con diseño actual
2. Agregar indicadores visuales de estado
3. Configurar responsive design

## 📱 Consideraciones Mobile

- Tabla debe ser responsive o usar cards en móviles
- Botones de acción táctiles y accesibles
- Navegación intuitiva con breadcrumbs

## 🔍 Datos de Prueba

Para pruebas, usar:
- **Turno ID**: ID de un turno operativo existente
- **Vehículo ID**: ID de un vehículo asignado al turno
- **Endpoint**: `GET /api/v1/operativos/vehiculos/{vehiculoId}/cuadrantes`

## 🎨 Componentes UI Sugeridos

```jsx
// Breadcrumb personalizado
<Breadcrumb>
  <BreadcrumbItem href="/operativos">Operativos</BreadcrumbItem>
  <BreadcrumbItem href={`/operativos/turnos/${turnoId}`}>Turno</BreadcrumbItem>
  <BreadcrumbItem href={`/operativos/turnos/${turnoId}/vehiculos`}>Vehículos</BreadcrumbItem>
  <BreadcrumbItem active>Cuadrantes</BreadcrumbItem>
</Breadcrumb>

// Tarjeta de información del vehículo
<Card>
  <CardHeader>
    <h3>Vehículo: {vehiculo.placa}</h3>
    <p>Conductor: {vehiculo.conductor?.nombre}</p>
  </CardHeader>
</Card>
```

## ⚡ Optimizaciones

- **Carga lazy**: Solo cargar datos cuando el componente se monte
- **Cache**: Considerar cache temporal para datos no críticos
- **Paginación**: Si hay muchos cuadrantes, implementar paginación
- **Filtros**: Agregar filtros por fecha, estado, incidentes

## 🐛 Manejo de Errores

```javascript
const handleApiError = (error) => {
  if (error.response?.status === 404) {
    setError('Vehículo no encontrado');
  } else if (error.response?.status === 403) {
    setError('No tienes permisos para ver esta información');
  } else {
    setError('Error al cargar los datos');
  }
};
```

---

## 📞 Soporte

Para cualquier duda durante la implementación:
- Revisar el modelo `OperativosVehiculosCuadrantes.js`
- Validar endpoints en Postman/Insomnia
- Contactar al equipo backend para soporte técnico

**Versión del documento:** 1.0.0  
**Fecha:** 12/01/2026  
**Autor:** Backend Team - CitySecure
