# 📋 Endpoints para Dropdowns - Frontend

## 🎯 **Resumen**

Documentación de endpoints disponibles para poblar los dropdowns/selectores en el frontend de filtros de operativos y novedades.

---

## 🕐 **1. Horarios de Turnos**

### **🔗 Endpoint Principal**
```
GET /api/v1/horarios-turnos
```

### **📋 Descripción**
Obtiene todos los horarios de turnos configurados en el sistema para el dropdown de turnos.

### **🔧 Parámetros Opcionales**
- `page`: Número de página (default: 1)
- `limit`: Límite de resultados (default: 20, max: 100)
- `estado`: Filtrar por estado (0, 1, true, false)
- `includeDeleted`: Incluir eliminados (true, false)

### **📊 Respuesta Esperada**
```json
{
  "success": true,
  "data": [
    {
      "turno": "MAÑANA",
      "hora_inicio": "06:00:00",
      "hora_fin": "14:00:00",
      "nro_orden": 1,
      "cruza_medianoche": false,
      "estado": 1
    },
    {
      "turno": "TARDE", 
      "hora_inicio": "14:00:00",
      "hora_fin": "22:00:00",
      "nro_orden": 2,
      "cruza_medianoche": false,
      "estado": 1
    },
    {
      "turno": "NOCHE",
      "hora_inicio": "22:00:00", 
      "hora_fin": "06:00:00",
      "nro_orden": 3,
      "cruza_medianoche": true,
      "estado": 1
    }
  ],
  "pagination": {...}
}
```

### **🎯 Uso en Dropdown**
```jsx
const [turnos, setTurnos] = useState([]);

useEffect(() => {
  const fetchTurnos = async () => {
    try {
      const response = await api.get('/horarios-turnos?estado=1');
      setTurnos(response.data.data);
    } catch (error) {
      console.error('Error fetching turnos:', error);
    }
  };
  fetchTurnos();
}, []);

// En el dropdown:
<select>
  <option value="">Todos los Turnos</option>
  {turnos.map(turno => (
    <option key={turno.turno} value={turno.turno}>
      🌅 {turno.turno} ({turno.hora_inicio} - {turno.hora_fin})
    </option>
  ))}
</select>
```

---

## 🗺️ **2. Cuadrantes y Sectores**

### **🔗 Endpoints Disponibles**

#### **📍 Sectores**
```
GET /api/v1/sectores
```

#### **📍 Cuadrantes (todos)**
```
GET /api/v1/cuadrantes
```

#### **📍 Cuadrantes por Sector**
```
GET /api/v1/cuadrantes/sector/:sectorId
```

### **📋 Descripción**
Obtiene la lista de sectores y cuadrantes para los dropdowns de ubicación geográfica.

### **🔧 Parámetros (Cuadrantes)**
- `sector_id`: Filtrar cuadrantes por sector (opcional)
- `subsector_id`: Filtrar cuadrantes por subsector (opcional)
- `estado`: Filtrar por estado (opcional)
- `activos`: Solo cuadrantes activos (true/false)

### **📊 Respuesta - Sectores**
```json
{
  "success": true,
  "data": [
    {
      "id": 26,
      "sector_code": "S1",
      "nombre": "SECTOR 1 - CHORRILLOS CENTRO",
      "estado": 1
    },
    {
      "id": 28,
      "sector_code": "S3", 
      "nombre": "SECTOR 3 - MATEO PUMACAHUA",
      "estado": 1
    }
  ]
}
```

### **📊 Respuesta - Cuadrantes**
```json
{
  "success": true,
  "data": [
    {
      "id": 24,
      "cuadrante_code": "CSS3A-01",
      "nombre": "Cuadrante CSS3A-01",
      "sector_id": 28,
      "zona_code": "ZONA1",
      "estado": 1
    },
    {
      "id": 27,
      "cuadrante_code": "CSS1A-01", 
      "nombre": "Cuadrante CSS1A-01",
      "sector_id": 26,
      "zona_code": "ZONA1",
      "estado": 1
    }
  ]
}
```

### **🎯 Uso en Dropdown (Anidado)**
```jsx
const [sectores, setSectores] = useState([]);
const [cuadrantes, setCuadrantes] = useState([]);
const [sectorSeleccionado, setSectorSeleccionado] = useState('');

// Cargar sectores
useEffect(() => {
  const fetchSectores = async () => {
    try {
      const response = await api.get('/sectores?estado=1');
      setSectores(response.data.data);
    } catch (error) {
      console.error('Error fetching sectores:', error);
    }
  };
  fetchSectores();
}, []);

// Cargar cuadrantes cuando se selecciona un sector
useEffect(() => {
  if (sectorSeleccionado) {
    const fetchCuadrantes = async () => {
      try {
        const response = await api.get(`/cuadrantes/sector/${sectorSeleccionado}`);
        setCuadrantes(response.data.data);
      } catch (error) {
        console.error('Error fetching cuadrantes:', error);
      }
    };
    fetchCuadrantes();
  }
}, [sectorSeleccionado]);

// Dropdowns:
<select onChange={(e) => setSectorSeleccionado(e.target.value)}>
  <option value="">Todos los Sectores</option>
  {sectores.map(sector => (
    <option key={sector.id} value={sector.id}>
      📍 {sector.nombre}
    </option>
  ))}
</select>

<select>
  <option value="">Todos los Cuadrantes</option>
  {cuadrantes.map(cuadrante => (
    <option key={cuadrante.id} value={cuadrante.id}>
      🗺️ {cuadrante.nombre} ({cuadrante.cuadrante_code})
    </option>
  ))}
</select>
```

---

## 🚗 **3. Vehículos**

### **🔗 Endpoint Principal**
```
GET /api/v1/vehiculos
```

### **📋 Descripción**
Obtiene la lista de vehículos disponibles para el dropdown de filtros por vehículo.

### **🔧 Parámetros Opcionales**
- `tipo_id`: Filtrar por tipo de vehículo
- `estado`: Filtrar por estado (activo, inactivo, mantenimiento)
- `disponible`: Solo vehículos disponibles (true/false)
- `page`: Número de página
- `limit`: Límite de resultados

### **📊 Respuesta Esperada**
```json
{
  "success": true,
  "data": [
    {
      "id": 30,
      "codigo_vehiculo": "VH-001",
      "nombre": "Patrullero Toyota Hilux 01",
      "placa": "ABC-123",
      "marca": "TOYOTA",
      "modelo": "HILUX",
      "tipo_id": 1,
      "tipo_vehiculo": {
        "nombre": "PATRULLERO"
      },
      "estado_operativo_id": 1,
      "kilometraje_actual": 15420,
      "estado": 1
    },
    {
      "id": 31,
      "codigo_vehiculo": "VH-002", 
      "nombre": "Motocicleta Yamaha 01",
      "placa": "XYZ-789",
      "marca": "YAMAHA",
      "modelo": "MT-09",
      "tipo_id": 2,
      "tipo_vehiculo": {
        "nombre": "MOTOCICLETA"
      },
      "estado_operativo_id": 1,
      "kilometraje_actual": 8750,
      "estado": 1
    }
  ],
  "pagination": {...}
}
```

### **🎯 Uso en Dropdown**
```jsx
const [vehiculos, setVehiculos] = useState([]);

useEffect(() => {
  const fetchVehiculos = async () => {
    try {
      const response = await api.get('/vehiculos?estado=1');
      setVehiculos(response.data.data);
    } catch (error) {
      console.error('Error fetching vehículos:', error);
    }
  };
  fetchVehiculos();
}, []);

// En el dropdown:
<select>
  <option value="">Todos los Vehículos</option>
  {vehiculos.map(vehiculo => (
    <option key={vehiculo.id} value={vehiculo.id}>
      🚗 {vehiculo.nombre} ({vehiculo.placa})
    </option>
  ))}
</select>
```

---

## 👥 **4. Personal de Seguridad**

### **🔗 Endpoint Principal**
```
GET /api/v1/personal
```

### **📋 Descripción**
Obtiene la lista de personal de seguridad para dropdowns de operador, supervisor, conductor, etc.

### **🔧 Parámetros Opcionales**
- `cargo_id`: Filtrar por cargo específico
- `sector_id`: Filtrar por sector asignado
- `estado_laboral`: Filtrar por estado laboral (Activo, Inactivo, etc.)
- `page`: Número de página
- `limit`: Límite de resultados

### **📊 Respuesta Esperada**
```json
{
  "success": true,
  "data": [
    {
      "id": 13,
      "doc_tipo": "DNI",
      "doc_numero": "12345678",
      "nombres": "Juan Carlos",
      "apellido_paterno": "Pérez",
      "apellido_materno": "López",
      "cargo_id": 1,
      "cargo": {
        "nombre": "OPERADOR"
      },
      "sector_id": 28,
      "sector": {
        "nombre": "SECTOR 3 - MATEO PUMACAHUA"
      },
      "estado_laboral": "Activo",
      "telefono": "987654321",
      "estado": 1
    },
    {
      "id": 19,
      "doc_tipo": "DNI",
      "doc_numero": "87654321", 
      "nombres": "María Elena",
      "apellido_paterno": "García",
      "apellido_materno": "Rodríguez",
      "cargo_id": 2,
      "cargo": {
        "nombre": "SUPERVISOR"
      },
      "sector_id": 26,
      "sector": {
        "nombre": "SECTOR 1 - CHORRILLOS CENTRO"
      },
      "estado_laboral": "Activo",
      "telefono": "912345678",
      "estado": 1
    }
  ],
  "pagination": {...}
}
```

### **🎯 Uso en Dropdown**
```jsx
const [personal, setPersonal] = useState([]);

useEffect(() => {
  const fetchPersonal = async () => {
    try {
      const response = await api.get('/personal?estado_laboral=Activo');
      setPersonal(response.data.data);
    } catch (error) {
      console.error('Error fetching personal:', error);
    }
  };
  fetchPersonal();
}, []);

// En el dropdown:
<select>
  <option value="">Todo el Personal</option>
  {personal.map(persona => (
    <option key={persona.id} value={persona.id}>
      👤 {persona.nombres} {persona.apellido_paterno} - {persona.cargo.nombre}
    </option>
  ))}
</select>
```

---

## 🔧 **5. Componente React Completo para Dropdowns**

### **📋 Hook Personalizado para Dropdowns**
```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useDropdownsData = () => {
  const [data, setData] = useState({
    turnos: [],
    sectores: [],
    cuadrantes: [],
    vehiculos: [],
    personal: []
  });
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  // Función genérica para cargar datos
  const fetchData = async (key, endpoint, params = {}) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    
    try {
      const response = await api.get(endpoint, { params });
      setData(prev => ({ 
        ...prev, 
        [key]: response.data.data || response.data 
      }));
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      setErrors(prev => ({ 
        ...prev, 
        [key]: error.response?.data?.message || 'Error al cargar datos' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Cargar todos los datos iniciales
  const loadAllData = () => {
    fetchData('turnos', '/horarios-turnos', { estado: 1 });
    fetchData('sectores', '/sectores', { estado: 1 });
    fetchData('vehiculos', '/vehiculos', { estado: 1 });
    fetchData('personal', '/personal', { estado_laboral: 'Activo' });
  };

  // Cargar cuadrantes por sector
  const loadCuadrantesBySector = (sectorId) => {
    if (sectorId) {
      fetchData('cuadrantes', `/cuadrantes/sector/${sectorId}`);
    } else {
      setData(prev => ({ ...prev, cuadrantes: [] }));
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return {
    data,
    loading,
    errors,
    loadAllData,
    loadCuadrantesBySector,
    refetch: fetchData
  };
};
```

### **🎨 Componente de Dropdowns Integrado**
```jsx
import React from 'react';
import { useDropdownsData } from '../hooks/useDropdownsData';

const DropdownsFiltros = ({ onFiltersChange }) => {
  const { data, loading, errors, loadCuadrantesBySector } = useDropdownsData();
  const [filters, setFilters] = useState({
    turno: '',
    sector_id: '',
    cuadrante_id: '',
    vehiculo_id: '',
    personal_id: ''
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    // Si cambia el sector, recargar cuadrantes
    if (field === 'sector_id') {
      loadCuadrantesBySector(value);
      // Limpiar cuadrante seleccionado
      newFilters.cuadrante_id = '';
    }
    
    onFiltersChange(newFilters);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Dropdown Turnos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Turno
        </label>
        {loading.turnos ? (
          <div className="text-sm text-gray-500">Cargando turnos...</div>
        ) : errors.turnos ? (
          <div className="text-sm text-red-500">{errors.turnos}</div>
        ) : (
          <select
            value={filters.turno}
            onChange={(e) => handleFilterChange('turno', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos los Turnos</option>
            {data.turnos.map(turno => (
              <option key={turno.turno} value={turno.turno}>
                🌅 {turno.turno} ({turno.hora_inicio} - {turno.hora_fin})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Dropdown Sectores */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sector
        </label>
        {loading.sectores ? (
          <div className="text-sm text-gray-500">Cargando sectores...</div>
        ) : errors.sectores ? (
          <div className="text-sm text-red-500">{errors.sectores}</div>
        ) : (
          <select
            value={filters.sector_id}
            onChange={(e) => handleFilterChange('sector_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos los Sectores</option>
            {data.sectores.map(sector => (
              <option key={sector.id} value={sector.id}>
                📍 {sector.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Dropdown Cuadrantes (dependiente de sector) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cuadrante
        </label>
        {loading.cuadrantes ? (
          <div className="text-sm text-gray-500">Cargando cuadrantes...</div>
        ) : errors.cuadrantes ? (
          <div className="text-sm text-red-500">{errors.cuadrantes}</div>
        ) : (
          <select
            value={filters.cuadrante_id}
            onChange={(e) => handleFilterChange('cuadrante_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={!filters.sector_id}
          >
            <option value="">
              {filters.sector_id ? 'Todos los Cuadrantes' : 'Seleccione un sector primero'}
            </option>
            {data.cuadrantes.map(cuadrante => (
              <option key={cuadrante.id} value={cuadrante.id}>
                🗺️ {cuadrante.nombre} ({cuadrante.cuadrante_code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Dropdown Vehículos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vehículo
        </label>
        {loading.vehiculos ? (
          <div className="text-sm text-gray-500">Cargando vehículos...</div>
        ) : errors.vehiculos ? (
          <div className="text-sm text-red-500">{errors.vehiculos}</div>
        ) : (
          <select
            value={filters.vehiculo_id}
            onChange={(e) => handleFilterChange('vehiculo_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos los Vehículos</option>
            {data.vehiculos.map(vehiculo => (
              <option key={vehiculo.id} value={vehiculo.id}>
                🚗 {vehiculo.nombre} ({vehiculo.placa})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Dropdown Personal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Personal
        </label>
        {loading.personal ? (
          <div className="text-sm text-gray-500">Cargando personal...</div>
        ) : errors.personal ? (
          <div className="text-sm text-red-500">{errors.personal}</div>
        ) : (
          <select
            value={filters.personal_id}
            onChange={(e) => handleFilterChange('personal_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Todo el Personal</option>
            {data.personal.map(persona => (
              <option key={persona.id} value={persona.id}>
                👤 {persona.nombres} {persona.apellido_paterno} - {persona.cargo.nombre}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default DropdownsFiltros;
```

---

## 📋 **6. Resumen de Endpoints**

| Dropdown | Endpoint | Método | Parámetros Principales | Respuesta Clave |
|----------|----------|---------|------------------------|-----------------|
| **Turnos** | `/horarios-turnos` | GET | estado, page, limit | `turno`, `hora_inicio`, `hora_fin` |
| **Sectores** | `/sectores` | GET | estado, page, limit | `id`, `nombre`, `sector_code` |
| **Cuadrantes** | `/cuadrantes` | GET | sector_id, estado, page | `id`, `nombre`, `cuadrante_code` |
| **Vehículos** | `/vehiculos` | GET | estado, tipo_id, page | `id`, `nombre`, `placa`, `marca` |
| **Personal** | `/personal` | GET | estado_laboral, cargo_id | `id`, `nombres`, `apellido_paterno`, `cargo` |

---

## 🔧 **7. Consideraciones Técnicas**

### **✅ Autenticación**
- Todos los endpoints requieren token JWT
- Permisos específicos por rol:
  - **Lectura**: `operador`, `supervisor`, `admin`, `consulta`
  - **Escritura**: `supervisor`, `admin`

### **⚡ Performance**
- Implementar caché local para datos estáticos (turnos, sectores)
- Usar paginación para listas grandes (personal, vehículos)
- Considerar debounce para búsquedas en tiempo real

### **🔄 Manejo de Errores**
```javascript
const handleApiError = (error, dataType) => {
  console.error(`Error loading ${dataType}:`, error);
  
  if (error.response?.status === 401) {
    // Redirigir a login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Mostrar mensaje de permisos insuficientes
    showNotification('No tienes permisos para ver estos datos', 'error');
  } else {
    // Error genérico
    showNotification(`Error al cargar ${dataType}`, 'error');
  }
};
```

### **📱 UX Recomendations**
- Mostrar loading states mientras cargan los datos
- Implementar búsqueda/filter dentro de los dropdowns grandes
- Usar placeholders descriptivos
- Agrupar opciones por categorías cuando sea necesario
- Implementar selección múltiple cuando aplique

---

## 🚀 **8. Implementación Rápida**

### **📦 Instalación**
```bash
npm install axios react-query
```

### **🔧 Configuración API**
```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### **🎯 Ejemplo de Uso Completo**
```jsx
import React from 'react';
import DropdownsFiltros from './components/DropdownsFiltros';

const FiltrosPage = () => {
  const handleFiltersChange = (filters) => {
    console.log('Filtros aplicados:', filters);
    // Aquí puedes aplicar los filtros a tus datos
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Filtros de Operativos</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Seleccionar Filtros</h2>
        <DropdownsFiltros onFiltersChange={handleFiltersChange} />
      </div>
    </div>
  );
};

export default FiltrosPage;
```

---

**Última actualización:** Mayo 2026  
**Versión:** 1.0.0  
**Responsable:** Backend Team
