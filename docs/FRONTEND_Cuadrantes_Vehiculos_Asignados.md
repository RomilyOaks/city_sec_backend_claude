# 📋 **Guía Frontend - Mantenimiento de Cuadrantes Vehículo Asignado**

## 🎯 **Objetivo**

Implementar pantalla completa de mantenimiento para la asignación de vehículos a cuadrantes específicos con operaciones CRUD + reactivación de soft-deletes.

---

## 📊 **Análisis de Endpoints Backend**

### **✅ Endpoints CRUD Completos**

| Método | Endpoint | Funcionalidad | Estado |
|--------|----------|---------------|---------|
| `GET` | `/api/v1/cuadrantes-vehiculos-asignados` | Listar asignaciones con paginación y filtros | ✅ Disponible |
| `GET` | `/api/v1/cuadrantes-vehiculos-asignados/:id` | Obtener asignación por ID | ✅ Disponible |
| `POST` | `/api/v1/cuadrantes-vehiculos-asignados` | Crear nueva asignación | ✅ Disponible |
| `PUT` | `/api/v1/cuadrantes-vehiculos-asignados/:id` | Actualizar asignación existente | ✅ Disponible |
| `DELETE` | `/api/v1/cuadrantes-vehiculos-asignados/:id` | Eliminar asignación (soft delete) | ✅ Disponible |

### **✅ Endpoints Especializados**

| Método | Endpoint | Funcionalidad | Estado |
|--------|----------|---------------|---------|
| `PATCH` | `/api/v1/cuadrantes-vehiculos-asignados/:id/reactivar` | Reactivar asignación eliminada | ✅ Disponible |
| `PATCH` | `/api/v1/cuadrantes-vehiculos-asignados/:id/estado` | Activar/Desactivar asignación | ✅ Disponible |
| `GET` | `/api/v1/cuadrantes-vehiculos-asignados/eliminadas` | Listar asignaciones eliminadas | ✅ Disponible |

---

## 🔍 **Análisis de Modelo y Relaciones**

### **📋 Modelo CuadranteVehiculoAsignado**

```javascript
// Campos principales
{
  id: INTEGER (PK, AUTO_INCREMENT),
  cuadrante_id: INTEGER (FK → cuadrantes.id),
  vehiculo_id: INTEGER (FK → vehiculos.id),
  observaciones: VARCHAR(500),
  estado: TINYINT (1=ACTIVO, 0=INACTIVO),
  created_by: INTEGER (FK → usuarios.id),
  updated_by: INTEGER (FK → usuarios.id),
  deleted_by: INTEGER (FK → usuarios.id),
  created_at: DATETIME,
  updated_at: DATETIME,
  deleted_at: DATETIME
}

// Constraint único
UNIQUE KEY uq_cuadrante_vehiculo (cuadrante_id, vehiculo_id)
```

### **🔗 Relaciones Disponibles**

```javascript
// Relaciones principales
CuadranteVehiculoAsignado.belongsTo(Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "cuadrante"
});

CuadranteVehiculoAsignado.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculo"
});

// Relaciones de auditoría
CuadranteVehiculoAsignado.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorAsignacion"
});

CuadranteVehiculoAsignado.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorAsignacion"
});

CuadranteVehiculoAsignado.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorAsignacion"
});
```

---

## 🚀 **Guía de Implementación Frontend**

### **🏗️ Estructura de Componentes**

```javascript
// Componentes recomendados
- CuadrantesVehiculosAsignadosPage.jsx    // Página principal
- CuadranteVehiculoAsignadoList.jsx        // Lista con paginación
- CuadranteVehiculoAsignadoFormModal.jsx   // Formulario CRUD
- CuadranteVehiculoAsignadoFilters.jsx    // Filtros avanzados
- CuadranteDropdown.jsx                    // Dropdown de cuadrantes
- VehiculoDropdown.jsx                     // Dropdown de vehículos
- ReactivarModal.jsx                       // Modal de reactivación
```

### **🔄 Flujo Principal**

```javascript
// 1. Listar asignaciones con filtros
const cargarAsignaciones = async (filtros = {}) => {
  try {
    const params = new URLSearchParams({
      page: filtros.page || 1,
      limit: filtros.limit || 10,
      search: filtros.search || '',
      estado: filtros.estado !== undefined ? filtros.estado : '',
      cuadrante_id: filtros.cuadrante_id || '',
      vehiculo_id: filtros.vehiculo_id || '',
      sort: filtros.sort || 'created_at',
      order: filtros.order || 'DESC'
    });

    const response = await axios.get(`/api/v1/cuadrantes-vehiculos-asignados?${params}`);
    
    // Respuesta esperada:
    // {
    //   success: true,
    //   data: {
    //     asignaciones: [...],
    //     pagination: {
    //       currentPage: 1,
    //       totalPages: 5,
    //       total: 47,
    //       hasNext: true,
    //       hasPrev: false
    //     }
    //   }
    // }
    
    setAsignaciones(response.data.data.asignaciones);
    setPagination(response.data.data.pagination);
  } catch (error) {
    console.error('Error cargando asignaciones:', error);
  }
};

// 2. Crear nueva asignación
const crearAsignacion = async (datos) => {
  try {
    const response = await axios.post('/api/v1/cuadrantes-vehiculos-asignados', {
      cuadrante_id: datos.cuadrante_id,
      vehiculo_id: datos.vehiculo_id,
      observaciones: datos.observaciones || null,
      estado: datos.estado || true
    });
    
    toast.success('Asignación creada exitosamente');
    await cargarAsignaciones();
    return response.data.data;
  } catch (error) {
    if (error.response?.data?.code === 'DUPLICATE_ASSIGNMENT') {
      toast.error('Ya existe una asignación para este cuadrante y vehículo');
    } else {
      toast.error('Error al crear la asignación');
    }
    throw error;
  }
};

// 3. Reactivar asignación eliminada
const reactivarAsignacion = async (id) => {
  try {
    const response = await axios.patch(`/api/v1/cuadrantes-vehiculos-asignados/${id}/reactivar`);
    
    toast.success('Asignación reactivada exitosamente');
    await cargarAsignaciones();
    return response.data.data;
  } catch (error) {
    toast.error('Error al reactivar la asignación');
    throw error;
  }
};
```

### **📋 Ejemplos de Uso de Endpoints**

#### **1. Listar Asignaciones con Filtros**

```javascript
const getAsignaciones = async (filtros) => {
  const params = new URLSearchParams({
    page: filtros.page || 1,
    limit: filtros.limit || 10,
    search: filtros.search || '',
    estado: filtros.estado || '',
    cuadrante_id: filtros.cuadrante_id || '',
    vehiculo_id: filtros.vehiculo_id || ''
  });

  const response = await axios.get(`/api/v1/cuadrantes-vehiculos-asignados?${params}`);
  return response.data;
};
```

#### **2. Crear Asignación**

```javascript
const createAsignacion = async (data) => {
  const response = await axios.post('/api/v1/cuadrantes-vehiculos-asignados', {
    cuadrante_id: data.cuadrante_id,
    vehiculo_id: data.vehiculo_id,
    observaciones: data.observaciones,
    estado: data.estado
  });
  return response.data;
};
```

#### **3. Obtener Asignaciones Eliminadas**

```javascript
const getEliminadas = async (page = 1) => {
  const response = await axios.get(`/api/v1/cuadrantes-vehiculos-asignados/eliminadas?page=${page}`);
  return response.data;
};
```

### **🎨 Componentes Dropdown Optimizados**

#### **CuadranteDropdown.jsx**
```javascript
import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import api from '../services/api.js';

export default function CuadranteDropdown({ onSeleccionar, value, disabled = false }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  const buscarCuadrantes = useCallback(
    debounce(async (termino) => {
      if (termino.length < 2) {
        setResultados([]);
        return;
      }

      setCargando(true);
      try {
        const response = await api.get('/cuadrantes', {
          params: {
            search: termino,
            limit: 20,
            estado: true
          }
        });
        
        setResultados(response.data.data?.cuadrantes || []);
      } catch (error) {
        console.error('Error buscando cuadrantes:', error);
      } finally {
        setCargando(false);
      }
    }, 300),
    []
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={value ? `${value.codigo} - ${value.nombre}` : busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          buscarCuadrantes(e.target.value);
        }}
        placeholder="Buscar cuadrante..."
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25"
      />
      
      {resultados.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {resultados.map((cuadrante) => (
            <div
              key={cuadrante.id}
              onClick={() => {
                onSeleccionar(cuadrante);
                setBusqueda('');
                setResultados([]);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">{cuadrante.codigo}</div>
              <div className="text-sm text-gray-500">{cuadrante.nombre}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### **VehiculoDropdown.jsx**
```javascript
import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import api from '../services/api.js';

export default function VehiculoDropdown({ onSeleccionar, value, disabled = false }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  const buscarVehiculos = useCallback(
    debounce(async (termino) => {
      if (termino.length < 2) {
        setResultados([]);
        return;
      }

      setCargando(true);
      try {
        const response = await api.get('/vehiculos', {
          params: {
            search: termino,
            limit: 20,
            estado: true
          }
        });
        
        setResultados(response.data.data?.vehiculos || []);
      } catch (error) {
        console.error('Error buscando vehículos:', error);
      } finally {
        setCargando(false);
      }
    }, 300),
    []
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={value ? `${value.placa} - ${value.marca} ${value.modelo}` : busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          buscarVehiculos(e.target.value);
        }}
        placeholder="Buscar vehículo (placa, marca, modelo)..."
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25"
      />
      
      {resultados.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {resultados.map((vehiculo) => (
            <div
              key={vehiculo.id}
              onClick={() => {
                onSeleccionar(vehiculo);
                setBusqueda('');
                setResultados([]);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">{vehiculo.placa}</div>
              <div className="text-sm text-gray-500">{vehiculo.marca} {vehiculo.modelo}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### **🔧 Servicio API**

```javascript
// src/services/cuadranteVehiculoAsignadoService.js
import api from './api.js';

export const cuadranteVehiculoAsignadoService = {
  // Obtener todas las asignaciones
  getAllAsignaciones: async (params = {}) => {
    const response = await api.get('/cuadrantes-vehiculos-asignados', { params });
    return response.data;
  },

  // Obtener asignación por ID
  getAsignacionById: async (id) => {
    const response = await api.get(`/cuadrantes-vehiculos-asignados/${id}`);
    return response.data;
  },

  // Crear asignación
  createAsignacion: async (data) => {
    const response = await api.post('/cuadrantes-vehiculos-asignados', data);
    return response.data;
  },

  // Actualizar asignación
  updateAsignacion: async (id, data) => {
    const response = await api.put(`/cuadrantes-vehiculos-asignados/${id}`, data);
    return response.data;
  },

  // Eliminar asignación (soft delete)
  deleteAsignacion: async (id) => {
    const response = await api.delete(`/cuadrantes-vehiculos-asignados/${id}`);
    return response.data;
  },

  // Reactivar asignación
  reactivarAsignacion: async (id) => {
    const response = await api.patch(`/cuadrantes-vehiculos-asignados/${id}/reactivar`);
    return response.data;
  },

  // Cambiar estado
  toggleEstado: async (id, estado) => {
    const response = await api.patch(`/cuadrantes-vehiculos-asignados/${id}/estado`, { estado });
    return response.data;
  },

  // Obtener eliminadas
  getEliminadas: async (params = {}) => {
    const response = await api.get('/cuadrantes-vehiculos-asignados/eliminadas', { params });
    return response.data;
  }
};
```

---

## 🔧 **Validaciones y Manejo de Errores**

### **🚨 Errores Comunes**

```javascript
// Manejo de errores específicos
const handleApiError = (error) => {
  if (error.response?.data?.code === 'DUPLICATE_ASSIGNMENT') {
    toast.error('Ya existe una asignación para este cuadrante y vehículo');
  } else if (error.response?.data?.code === 'CUADRANTE_NOT_FOUND') {
    toast.error('El cuadrante especificado no existe');
  } else if (error.response?.data?.code === 'VEHICULO_NOT_FOUND') {
    toast.error('El vehículo especificado no existe');
  } else if (error.response?.data?.code === 'FOREIGN_KEY_ERROR') {
    toast.error('Error de referencia: El ID proporcionado no existe');
  } else {
    toast.error('Error en la operación');
  }
};
```

### **✅ Validaciones Frontend**

```javascript
// Validación de formulario
const validateForm = (data) => {
  const errors = {};

  if (!data.cuadrante_id) {
    errors.cuadrante_id = 'Debe seleccionar un cuadrante';
  }

  if (!data.vehiculo_id) {
    errors.vehiculo_id = 'Debe seleccionar un vehículo';
  }

  if (data.observaciones && data.observaciones.length > 500) {
    errors.observaciones = 'Las observaciones no pueden exceder 500 caracteres';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};
```

---

## 📱 **Ejemplo de Página Completa**

```javascript
// CuadrantesVehiculosAsignadosPage.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import CuadranteVehiculoAsignadoList from '../components/CuadranteVehiculoAsignadoList.jsx';
import CuadranteVehiculoAsignadoFormModal from '../components/CuadranteVehiculoAsignadoFormModal.jsx';
import { cuadranteVehiculoAsignadoService } from '../services/cuadranteVehiculoAsignadoService.js';

export default function CuadrantesVehiculosAsignadosPage() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);

  const cargarAsignaciones = async (filtros = {}) => {
    setLoading(true);
    try {
      const response = await cuadranteVehiculoAsignadoService.getAllAsignaciones(filtros);
      setAsignaciones(response.data.data.asignaciones);
    } catch (error) {
      toast.error('Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAsignaciones();
  }, []);

  const handleCrear = () => {
    setAsignacionSeleccionada(null);
    setShowCreateModal(true);
  };

  const handleEditar = (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setShowEditModal(true);
  };

  const handleEliminar = async (asignacion) => {
    if (!window.confirm(`¿Está seguro de eliminar esta asignación?`)) {
      return;
    }

    try {
      await cuadranteVehiculoAsignadoService.deleteAsignacion(asignacion.id);
      toast.success('Asignación eliminada exitosamente');
      await cargarAsignaciones();
    } catch (error) {
      toast.error('Error al eliminar la asignación');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Asignaciones Vehículo-Cuadrante</h1>
        <button
          onClick={handleCrear}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Nueva Asignación
        </button>
      </div>

      <CuadranteVehiculoAsignadoList
        asignaciones={asignaciones}
        loading={loading}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      {showCreateModal && (
        <CuadranteVehiculoAsignadoFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            cargarAsignaciones();
          }}
          mode="create"
        />
      )}

      {showEditModal && (
        <CuadranteVehiculoAsignadoFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            cargarAsignaciones();
          }}
          mode="edit"
          asignacion={asignacionSeleccionada}
        />
      )}
    </div>
  );
}
```

---

## 🔧 **Consideraciones Técnicas**

### **✅ Buenas Prácticas**

1. **Debounce en búsquedas**: Implementar 300ms para dropdowns
2. **Validación unique constraint**: Manejar error `DUPLICATE_ASSIGNMENT`
3. **Soft delete**: Mostrar opción de reactivación
4. **Auditoría**: Incluir información de quién creó/actualizó
5. **Carga lazy**: Para listas grandes de cuadrantes y vehículos

### **🎯 Optimizaciones**

1. **Memoización**: Usar React.memo para componentes de lista
2. **Virtual scrolling**: Para listas muy grandes
3. **Cache local**: Guardar búsquedas recientes
4. **Paginación**: Implementar scroll infinito

### **🔐 Consideraciones de Seguridad**

1. **Validación de permisos**: Verificar antes de mostrar acciones
2. **Sanitización**: Validar todas las entradas
3. **Rate limiting**: Respetar límites del backend
4. **Auditoría**: Registrar acciones importantes

---

## 📋 **Resumen de Implementación**

### **✅ Backend Completo**
- Modelo Sequelize con relaciones y validaciones
- Controller con CRUD + reactivación
- Routes con validaciones y documentación
- Manejo de errores específicos

### **✅ Frontend por Implementar**
- Página principal con lista y CRUD
- Componentes de dropdown optimizados
- Manejo de errores y validaciones
- Integración con menú Catálogos

### **🎯 Próximos Pasos**
1. Crear componentes frontend
2. Integrar en menú Catálogos
3. Probar funcionalidad completa
4. Aplicar ESLint y Build

---

**🎯 Con esta guía, el frontend tiene todo lo necesario para implementar una pantalla completa y optimizada de mantenimiento de asignaciones vehículo-cuadrante.**
