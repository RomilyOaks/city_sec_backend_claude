# 🚗 Filtros Disponibles - Operativos Vehiculares

## 🎯 **Resumen**

El endpoint `/api/v1/reportes-operativos/vehiculares` ahora soporta los mismos filtros avanzados que Novedades No Atendidas, más un filtro específico por vehículo.

## 📋 **Endpoint Completo**

```
GET /api/v1/reportes-operativos/vehiculares
```

### **🔧 Parámetros Disponibles**

#### **Parámetros de Paginación:**
- `page`: Número de página (default: 1)
- `limit`: Límite de resultados por página (default: 10, max: 100)
- `sort`: Campo de ordenamiento (default: fecha)
- `order`: Dirección de ordenamiento (default: ASC)

#### **🗓️ Parámetros de Fecha:**
- `fecha_inicio`: Fecha de inicio (formato: YYYY-MM-DD)
- `fecha_fin`: Fecha de fin (formato: YYYY-MM-DD)

#### **🎯 Filtros Específicos:**
- `prioridad`: Prioridad de la novedad (ALTA, MEDIA, BAJA)
- `sector_id`: ID del sector (numérico)
- `cuadrante_id`: ID del cuadrante (numérico)
- `turno`: Turno (MAÑANA, TARDE, NOCHE)
- `estado_novedad_id`: ID del estado de la novedad (numérico)
- `origen_llamada`: Origen de la llamada (TELEFONO_107, RADIO_TETRA, etc.)
- `generico`: Búsqueda genérica en descripción, ubicación, reportante o placa
- **`vehiculo_id`**: ID del vehículo (numérico) - **NUEVO FILTRO ESPECÍFICO**

## 📊 **Ejemplos de Uso**

### **🚗 Filtro por Vehículo Específico:**
```javascript
// URL: /vehiculares?vehiculo_id=30&fecha_inicio=2026-04-01&fecha_fin=2026-05-03&page=1&limit=50

const params = {
  vehiculo_id: 30,
  fecha_inicio: '2026-04-01',
  fecha_fin: '2026-05-03',
  page: 1,
  limit: 50,
  sort: 'fecha',
  order: 'ASC'
};
```

### **🔴 Filtro por Prioridad y Vehículo:**
```javascript
// URL: /vehiculares?prioridad=ALTA&vehiculo_id=30&fecha_inicio=2026-04-01&fecha_fin=2026-05-03

const params = {
  prioridad: 'ALTA',
  vehiculo_id: 30,
  fecha_inicio: '2026-04-01',
  fecha_fin: '2026-05-03',
  page: 1,
  limit: 50
};
```

### **🟡 Filtro por Sector y Turno:**
```javascript
// URL: /vehiculares?sector_id=28&turno=TARDE&fecha_inicio=2026-04-01&fecha_fin=2026-05-03

const params = {
  sector_id: 28,
  turno: 'TARDE',
  fecha_inicio: '2026-04-01',
  fecha_fin: '2026-05-03',
  page: 1,
  limit: 50
};
```

### **🟢 Búsqueda Genérica (incluye placa):**
```javascript
// URL: /vehiculares?generico=ABC-123&fecha_inicio=2026-04-01&fecha_fin=2026-05-03

const params = {
  generico: 'ABC-123',
  fecha_inicio: '2026-04-01',
  fecha_fin: '2026-05-03',
  page: 1,
  limit: 50
};
```

### **🔵 Filtros Completos:**
```javascript
// URL: /vehiculares?prioridad=ALTA&sector_id=26&turno=NOCHE&origen_llamada=TELEFONO_107&vehiculo_id=30

const params = {
  prioridad: 'ALTA',
  sector_id: 26,
  turno: 'NOCHE',
  origen_llamada: 'TELEFONO_107',
  vehiculo_id: 30,
  fecha_inicio: '2026-04-01',
  fecha_fin: '2026-05-03',
  page: 1,
  limit: 50
};
```

## 🎨 **Implementación Frontend**

### **📋 Componente de Filtros para Operativos Vehiculares**
```jsx
import React, { useState, useEffect } from 'react';

const FiltrosOperativosVehiculares = ({ onFiltersChange }) => {
  const [filtros, setFiltros] = useState({
    prioridad: '',
    sector_id: '',
    cuadrante_id: '',
    turno: '',
    estado_novedad_id: '',
    origen_llamada: '',
    generico: '',
    vehiculo_id: '', // Nuevo filtro específico
    fecha_inicio: '',
    fecha_fin: ''
  });

  // Opciones para los selectores
  const prioridades = [
    { value: '', label: 'Todas las Prioridades' },
    { value: 'ALTA', label: '🔴 ALTA' },
    { value: 'MEDIA', label: '🟡 MEDIA' },
    { value: 'BAJA', label: '🟢 BAJA' }
  ];

  const turnos = [
    { value: '', label: 'Todos los Turnos' },
    { value: 'MAÑANA', label: '🌅 MAÑANA' },
    { value: 'TARDE', label: '☀️ TARDE' },
    { value: 'NOCHE', label: '🌙 NOCHE' }
  ];

  const origenesLlamada = [
    { value: '', label: 'Todos los Orígenes' },
    { value: 'TELEFONO_107', label: '📞 Teléfono 107' },
    { value: 'RADIO_TETRA', label: '📻 Radio Tetra' },
    { value: 'PERSONAL', label: '👤 Personal' }
  ];

  const handleInputChange = (field, value) => {
    const nuevosFiltros = { ...filtros, [field]: value };
    setFiltros(nuevosFiltros);
    onFiltersChange(nuevosFiltros);
  };

  const handleApplyFilters = () => {
    onFiltersChange(filtros);
  };

  const handleResetFilters = () => {
    const filtrosVacios = {
      prioridad: '',
      sector_id: '',
      cuadrante_id: '',
      turno: '',
      estado_novedad_id: '',
      origen_llamada: '',
      generico: '',
      vehiculo_id: '',
      fecha_inicio: '',
      fecha_fin: ''
    };
    setFiltros(filtrosVacios);
    onFiltersChange(filtrosVacios);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-4">🚗 Filtros de Operativos Vehiculares</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Filtro por Prioridad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prioridad
          </label>
          <select
            value={filtros.prioridad}
            onChange={(e) => handleInputChange('prioridad', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {prioridades.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Turno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Turno
          </label>
          <select
            value={filtros.turno}
            onChange={(e) => handleInputChange('turno', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {turnos.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Origen de Llamada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Origen de Llamada
          </label>
          <select
            value={filtros.origen_llamada}
            onChange={(e) => handleInputChange('origen_llamada', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {origenesLlamada.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 🚗 Filtro por Vehículo (NUEVO) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🚗 Vehículo ID
          </label>
          <input
            type="number"
            value={filtros.vehiculo_id}
            onChange={(e) => handleInputChange('vehiculo_id', e.target.value)}
            placeholder="Ej: 30"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">ID numérico del vehículo</p>
        </div>

        {/* Filtro por Sector (ID numérico) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sector ID
          </label>
          <input
            type="number"
            value={filtros.sector_id}
            onChange={(e) => handleInputChange('sector_id', e.target.value)}
            placeholder="Ej: 28"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtro por Cuadrante (ID numérico) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuadrante ID
          </label>
          <input
            type="number"
            value={filtros.cuadrante_id}
            onChange={(e) => handleInputChange('cuadrante_id', e.target.value)}
            placeholder="Ej: 24"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Búsqueda Genérica (incluye placa) */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔍 Búsqueda Genérica
          </label>
          <input
            type="text"
            value={filtros.generico}
            onChange={(e) => handleInputChange('generico', e.target.value)}
            placeholder="Buscar en descripción, ubicación, reportante o placa del vehículo"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Busca en: descripción, ubicación, reportante y PLACA del vehículo
          </p>
        </div>

        {/* Filtro por Fechas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filtros.fecha_inicio}
            onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Fin
          </label>
          <input
            type="date"
            value={filtros.fecha_fin}
            onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          🔄 Limpiar Filtros
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          🔍 Aplicar Filtros
        </button>
      </div>
    </div>
  );
};

export default FiltrosOperativosVehiculares;
```

### **🔄 Hook Personalizado para Operativos Vehiculares**
```javascript
import { useState, useCallback } from 'react';
import { useOperativosVehiculares } from './hooks/useOperativosVehiculares';

export const useFiltrosOperativosVehiculares = () => {
  const [filtros, setFiltros] = useState({
    prioridad: '',
    sector_id: '',
    cuadrante_id: '',
    turno: '',
    estado_novedad_id: '',
    origen_llamada: '',
    generico: '',
    vehiculo_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  const { data, loading, error, refetch } = useOperativosVehiculares();

  const buildParams = useCallback((filtrosActuales) => {
    const params = new URLSearchParams();
    
    // Agregar solo filtros con valores
    Object.entries(filtrosActuales).forEach(([key, value]) => {
      if (value && value !== '') {
        params.append(key, value);
      }
    });

    // Agregar parámetros por defecto
    if (!params.has('page')) params.append('page', '1');
    if (!params.has('limit')) params.append('limit', '10');
    if (!params.has('sort')) params.append('sort', 'fecha');
    if (!params.has('order')) params.append('order', 'ASC');

    return params.toString();
  }, []);

  const handleFiltersChange = useCallback((nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    
    const params = buildParams(nuevosFiltros);
    refetch(params);
  }, [buildParams, refetch]);

  const resetFilters = useCallback(() => {
    const filtrosVacios = {
      prioridad: '',
      sector_id: '',
      cuadrante_id: '',
      turno: '',
      estado_novedad_id: '',
      origen_llamada: '',
      generico: '',
      vehiculo_id: '',
      fecha_inicio: '',
      fecha_fin: ''
    };
    
    setFiltros(filtrosVacios);
    const params = buildParams(filtrosVacios);
    refetch(params);
  }, [buildParams, refetch]);

  return {
    filtros,
    data,
    loading,
    error,
    handleFiltersChange,
    resetFilters,
    buildParams
  };
};
```

### **📊 Componente Principal de Operativos Vehiculares**
```jsx
import React from 'react';
import FiltrosOperativosVehiculares from './FiltrosOperativosVehiculares';
import { useFiltrosOperativosVehiculares } from './hooks/useFiltrosOperativosVehiculares';
import OperativosVehicularesTable from './OperativosVehicularesTable';

const OperativosVehicularesPage = () => {
  const {
    filtros,
    data,
    loading,
    error,
    handleFiltersChange,
    resetFilters
  } = useFiltrosOperativosVehiculares();

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        🚗 Operativos Vehiculares
      </h1>

      {/* Componente de Filtros */}
      <FiltrosOperativosVehiculares 
        onFiltersChange={handleFiltersChange}
        initialFilters={filtros}
      />

      {/* Tabla de Resultados */}
      <OperativosVehicularesTable 
        data={data?.data || []}
        pagination={data?.pagination}
        loading={loading}
      />

      {/* Información de Filtros Aplicados */}
      {data?.pagination && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            📊 Resultados Encontrados
          </h3>
          <div className="text-sm text-blue-700">
            <p>Total de operativos: {data.pagination.total}</p>
            <p>Operativos mostrados: {data.data.length}</p>
            <p>Página {data.pagination.page} de {data.pagination.totalPages}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperativosVehicularesPage;
```

## 🔧 **Service de API Actualizado**

### **📡 buildParams Function para Operativos Vehiculares**
```javascript
export const buildOperativosVehicularesParams = (filters = {}) => {
  const params = new URLSearchParams();
  
  // Parámetros de paginación (siempre incluidos)
  params.append('page', filters.page || 1);
  params.append('limit', filters.limit || 10);
  params.append('sort', filters.sort || 'fecha');
  params.append('order', filters.order || 'ASC');

  // Filtros de fecha
  if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

  // Filtros específicos (solo si tienen valor)
  if (filters.prioridad) params.append('prioridad', filters.prioridad);
  if (filters.sector_id) params.append('sector_id', filters.sector_id);
  if (filters.cuadrante_id) params.append('cuadrante_id', filters.cuadrante_id);
  if (filters.turno) params.append('turno', filters.turno);
  if (filters.estado_novedad_id) params.append('estado_novedad_id', filters.estado_novedad_id);
  if (filters.origen_llamada) params.append('origen_llamada', filters.origen_llamada);
  if (filters.generico) params.append('generico', filters.generico);
  if (filters.vehiculo_id) params.append('vehiculo_id', filters.vehiculo_id); // Nuevo

  return params.toString();
};
```

## 🎯 **Diferencias con Novedades No Atendidas**

### **🚗 Filtro Específico de Vehículo:**
- **`vehiculo_id`**: Filtra operativos de un vehículo específico
- **Búsqueda Genérica**: Incluye búsqueda por placa del vehículo
- **Ordenamiento**: Por defecto es `fecha ASC` (cronológico)

### **📊 Campos Adicionales en Operativos Vehiculares:**
- Información del vehículo (placa, marca, tipo)
- Datos del conductor y copiloto
- Información del operativo (turno, sector, cuadrante)
- Estado operativo del recurso

## 🔧 **Validaciones y Consideraciones**

### **✅ Validaciones Frontend:**
```javascript
// Validar que los IDs sean números
const validateOperativosVehicularesFilters = (filtros) => {
  const errors = {};
  
  if (filtros.sector_id && isNaN(Number(filtros.sector_id))) {
    errors.sector_id = 'El ID de sector debe ser un número';
  }
  
  if (filtros.cuadrante_id && isNaN(Number(filtros.cuadrante_id))) {
    errors.cuadrante_id = 'El ID de cuadrante debe ser un número';
  }
  
  if (filtros.vehiculo_id && isNaN(Number(filtros.vehiculo_id))) {
    errors.vehiculo_id = 'El ID de vehículo debe ser un número';
  }
  
  if (filtros.fecha_inicio && filtros.fecha_fin) {
    const inicio = new Date(filtros.fecha_inicio);
    const fin = new Date(filtros.fecha_fin);
    
    if (inicio > fin) {
      errors.fecha = 'La fecha de inicio no puede ser mayor que la fecha de fin';
    }
  }
  
  return errors;
};
```

### **🔒 Seguridad:**
- **SQL Injection:** Todos los filtros usan placeholders seguros
- **Validación:** IDs numéricos validados en backend
- **Sanitización:** Strings escapados correctamente

### **⚡ Performance:**
- **Índices:** Asegurar índices en campos filtrados
- **Paginación:** Siempre aplicada (default: 10 registros)
- **JOINs optimizados:** Solo joins necesarios para filtros

## 📋 **Checklist de Implementación**

- [ ] **Componente de filtros** con filtro de vehículo específico
- [ ] **Validaciones** para IDs numéricos y fechas
- [ ] **buildParams** actualizado para operativos vehiculares
- [ ] **Hook personalizado** para manejo de filtros
- [ ] **Estados de carga** y manejo de errores
- [ ] **Reset de filtros** funcional
- [ ] **URL params** para compartir filtros
- [ ] **Testing** unitario de filtros específicos

## 🚀 **Ejemplo Completo de URL**

```
/api/v1/reportes-operativos/vehiculares?
prioridad=ALTA&
sector_id=28&
turno=TARDE&
origen_llamada=RADIO_TETRA&
vehiculo_id=30&
generico=ABC-123&
fecha_inicio=2026-04-01&
fecha_fin=2026-05-03&
page=1&
limit=50&
sort=fecha&
order=ASC
```

## 🎯 **Casos de Uso Específicos**

### **🚗 Filtrar por Vehículo Específico:**
```javascript
// Ver todos los operativos del vehículo con ID 30
const params = { vehiculo_id: 30, fecha_inicio: '2026-04-01', fecha_fin: '2026-05-03' };
```

### **🔍 Buscar por Placa:**
```javascript
// Buscar operativos donde la placa contiene "ABC"
const params = { generico: 'ABC', fecha_inicio: '2026-04-01', fecha_fin: '2026-05-03' };
```

### **📊 Operativos de Alta Prioridad:**
```javascript
// Operativos vehiculares con novedades de alta prioridad
const params = { prioridad: 'ALTA', fecha_inicio: '2026-04-01', fecha_fin: '2026-05-03' };
```

---

**Última actualización:** Mayo 2026  
**Versión:** 1.0.0  
**Responsable:** Backend Team
