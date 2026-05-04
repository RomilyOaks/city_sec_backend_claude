# 📋 **Filtros Homologados - Operativos a Pie**

## 🎯 **Homologación Completada**

Los operativos a pie ahora tienen los **mismos filtros avanzados** que los operativos vehiculares para consistencia en el frontend.

---

## 🔧 **Filtros Disponibles**

### **📅 Filtros Temporales**
```javascript
// Rango de fechas
fecha_inicio: "2026-05-01"    // YYYY-MM-DD [opcional]
fecha_fin: "2026-05-04"        // YYYY-MM-DD [opcional]
```

### **🎛️ Filtros de Operación**
```javascript
// Turnos y asignaciones
turno: "MAÑANA"                 // MAÑANA, TARDE, NOCHE [opcional]
sector_id: 1                   // ID del sector [opcional]
cuadrante_id: 5                // ID del cuadrante [opcional]
personal_id: 123               // ID del personal asignado [opcional]
```

### **🚨 Filtros de Novedades**
```javascript
// Estados y prioridades
estado_novedad_id: 1           // ID del estado de novedad [opcional]
prioridad: "ALTA"              // BAJA, MEDIA, ALTA, CRÍTICA [opcional]
tipo_novedad_id: 3             // ID del tipo de novedad [opcional]
origen_llamada: "911"          // Origen de la llamada [opcional]
```

### **🔍 Búsqueda Genérica**
```javascript
// Búsqueda en múltiples campos
generico: "robos"              // Busca en: descripción, ubicación, referencias, nombres del personal
```

### **📄 Paginación**
```javascript
page: 1                        // Número de página (default: 1, min: 1)
limit: 50                      // Límite de resultados (default: 50, max: 1000)
```

---

## 🚀 **Ejemplos de Uso**

### **✅ Filtro Básico por Fecha**
```javascript
GET /api/v1/reportes-operativos/pie?fecha_inicio=2026-05-01&fecha_fin=2026-05-04
```

### **✅ Filtro por Turno y Sector**
```javascript
GET /api/v1/reportes-operativos/pie?turno=MAÑANA&sector_id=1
```

### **✅ Filtro por Personal Asignado**
```javascript
GET /api/v1/reportes-operativos/pie?personal_id=123
```

### **✅ Filtro por Prioridad Alta**
```javascript
GET /api/v1/reportes-operativos/pie?prioridad=ALTA
```

### **✅ Búsqueda Genérica**
```javascript
GET /api/v1/reportes-operativos/pie?generico=incidente
```

### **✅ Filtro Combinado Avanzado**
```javascript
GET /api/v1/reportes-operativos/pie?fecha_inicio=2026-05-01&turno=NOCHE&sector_id=2&prioridad=CRÍTICA&page=1&limit=25
```

---

## 📊 **Respuesta del API**

### **✅ Estructura de Respuesta**
```json
{
  "success": true,
  "message": "Operativos a pie obtenidos exitosamente",
  "data": [
    {
      "fecha_turno": "2026-05-04",
      "turno": "MAÑANA",
      "Personal_asignado": "GARCIA, PEREZ JUAN",
      "nombre_cuadrante": "CENTRO HISTORICO",
      "novedad_id": 12345,
      "tipo_novedad_nombre": "ROBO A VEHICULO",
      "prioridad": "ALTA"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_records": 125,
    "records_per_page": 25,
    "has_next": true,
    "has_prev": false
  },
  "filters_applied": {
    "fecha_inicio": "2026-05-01",
    "fecha_fin": "2026-05-04",
    "turno": "MAÑANA",
    "sector_id": 1,
    "prioridad": "ALTA",
    "page": 1,
    "limit": 25
  }
}
```

---

## 🔄 **Consistencia con Vehiculares**

### **✅ Mismos Filtros Disponibles**
| Filtro | Vehiculares | Operativos a Pie | Estado |
|--------|-------------|------------------|---------|
| **fecha_inicio/fin** | ✅ | ✅ | Homologado |
| **turno** | ✅ | ✅ | Homologado |
| **sector_id** | ✅ | ✅ | Homologado |
| **cuadrante_id** | ✅ | ✅ | Homologado |
| **prioridad** | ✅ | ✅ | Homologado |
| **estado_novedad_id** | ✅ | ✅ | Homologado |
| **origen_llamada** | ✅ | ✅ | Homologado |
| **generico** | ✅ | ✅ | Homologado |
| **tipo_novedad_id** | ✅ | ✅ | Homologado |
| **page/limit** | ✅ | ✅ | Homologado |
| **vehiculo_id** | ✅ | ❌ | Específico |
| **personal_id** | ❌ | ✅ | Específico |

### **✅ Misma Estructura de Respuesta**
- **pagination**: Identical structure
- **filters_applied**: Same fields
- **data**: Consistent field naming
- **success/message**: Standard format

---

## 🎨 **Implementación Frontend Completa**

### **📋 1. Componente React - Filtros Operativos a Pie**
```jsx
import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Input, Button } from 'antd';

const FiltrosOperativosPie = ({ onFiltersChange, loading }) => {
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    turno: '',
    sector_id: '',
    cuadrante_id: '',
    personal_id: '',
    prioridad: '',
    estado_novedad_id: '',
    origen_llamada: '',
    generico: '',
    page: 1,
    limit: 50
  });

  // Opciones para dropdowns (cargar desde API)
  const [opciones, setOpciones] = useState({
    turnos: [],
    sectores: [],
    cuadrantes: [],
    personal: [],
    prioridades: ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'],
    estadosNovedad: [],
    origenesLlamada: ['911', 'DIRECTO', 'TELEFONO', 'APP']
  });

  // Cargar opciones de dropdowns
  useEffect(() => {
    cargarOpciones();
  }, []);

  const cargarOpciones = async () => {
    try {
      const [turnosRes, sectoresRes, cuadrantesRes, personalRes, estadosRes] = await Promise.all([
        fetch('/api/v1/horarios-turnos'),
        fetch('/api/v1/sectores'),
        fetch('/api/v1/cuadrantes'),
        fetch('/api/v1/personal'),
        fetch('/api/v1/estados-novedad')
      ]);

      const turnos = await turnosRes.json();
      const sectores = await sectoresRes.json();
      const cuadrantes = await cuadrantesRes.json();
      const personal = await personalRes.json();
      const estados = await estadosRes.json();

      setOpciones({
        turnos: turnos.data || [],
        sectores: sectores.data || [],
        cuadrantes: cuadrantes.data || [],
        personal: personal.data || [],
        prioridades: ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'],
        estadosNovedad: estados.data || [],
        origenesLlamada: ['911', 'DIRECTO', 'TELEFONO', 'APP']
      });
    } catch (error) {
      console.error('Error cargando opciones:', error);
    }
  };

  // Manejar cambios en filtros
  const handleFilterChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    
    // Notificar al componente padre
    if (onFiltersChange) {
      onFiltersChange(nuevosFiltros);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    if (onFiltersChange) {
      onFiltersChange({ ...filtros, page: 1 }); // Resetear página al aplicar filtros
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    const filtrosLimpios = {
      ...filtros,
      fecha_inicio: '',
      fecha_fin: '',
      turno: '',
      sector_id: '',
      cuadrante_id: '',
      personal_id: '',
      prioridad: '',
      estado_novedad_id: '',
      origen_llamada: '',
      generico: '',
      page: 1
    };
    setFiltros(filtrosLimpios);
    if (onFiltersChange) {
      onFiltersChange(filtrosLimpios);
    }
  };

  return (
    <div className="filtros-operativos-pie">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Filtros Temporales */}
        <div>
          <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
          <DatePicker
            value={filtros.fecha_inicio ? moment(filtros.fecha_inicio) : null}
            onChange={(date) => handleFilterChange('fecha_inicio', date ? date.format('YYYY-MM-DD') : '')}
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha Fin</label>
          <DatePicker
            value={filtros.fecha_fin ? moment(filtros.fecha_fin) : null}
            onChange={(date) => handleFilterChange('fecha_fin', date ? date.format('YYYY-MM-DD') : '')}
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
          />
        </div>

        {/* Filtros de Operación */}
        <div>
          <label className="block text-sm font-medium mb-1">Turno</label>
          <Select
            value={filtros.turno}
            onChange={(value) => handleFilterChange('turno', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {opciones.turnos.map(turno => (
              <Select.Option key={turno.id} value={turno.turno}>
                {turno.turno}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sector</label>
          <Select
            value={filtros.sector_id}
            onChange={(value) => handleFilterChange('sector_id', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {opciones.sectores.map(sector => (
              <Select.Option key={sector.id} value={sector.id}>
                {sector.nombre}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cuadrante</label>
          <Select
            value={filtros.cuadrante_id}
            onChange={(value) => handleFilterChange('cuadrante_id', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {opciones.cuadrantes.map(cuadrante => (
              <Select.Option key={cuadrante.id} value={cuadrante.id}>
                {cuadrante.nombre}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Personal Asignado</label>
          <Select
            value={filtros.personal_id}
            onChange={(value) => handleFilterChange('personal_id', value)}
            style={{ width: '100%' }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {opciones.personal.map(persona => (
              <Select.Option key={persona.id} value={persona.id}>
                {`${persona.apellido_paterno}, ${persona.nombres}`}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Filtros de Novedades */}
        <div>
          <label className="block text-sm font-medium mb-1">Prioridad</label>
          <Select
            value={filtros.prioridad}
            onChange={(value) => handleFilterChange('prioridad', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {opciones.prioridades.map(prioridad => (
              <Select.Option key={prioridad} value={prioridad}>
                {prioridad}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Estado Novedad</label>
          <Select
            value={filtros.estado_novedad_id}
            onChange={(value) => handleFilterChange('estado_novedad_id', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {opciones.estadosNovedad.map(estado => (
              <Select.Option key={estado.id} value={estado.id}>
                {estado.nombre}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Origen Llamada</label>
          <Select
            value={filtros.origen_llamada}
            onChange={(value) => handleFilterChange('origen_llamada', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {opciones.origenesLlamada.map(origen => (
              <Select.Option key={origen} value={origen}>
                {origen}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Búsqueda Genérica */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium mb-1">Búsqueda Genérica</label>
          <Input
            value={filtros.generico}
            onChange={(e) => handleFilterChange('generico', e.target.value)}
            placeholder="Buscar en descripción, ubicación, referencias, nombres del personal..."
            allowClear
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-2 mt-4">
        <Button 
          type="primary" 
          onClick={aplicarFiltros}
          loading={loading}
        >
          Aplicar Filtros
        </Button>
        <Button onClick={limpiarFiltros}>
          Limpiar Filtros
        </Button>
      </div>
    </div>
  );
};

export default FiltrosOperativosPie;
```

### **🎣 2. Hook Personalizado - useOperativosPie**
```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const useOperativosPie = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    records_per_page: 50,
    has_next: false,
    has_prev: false
  });

  const fetchOperativosPie = async (filtros = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir query string
      const queryParams = new URLSearchParams();
      
      // Agregar filtros solo si tienen valor
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          queryParams.append(key, filtros[key]);
        }
      });

      const response = await axios.get(`/api/v1/reportes-operativos/pie?${queryParams}`);
      
      if (response.data.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.message || 'Error al obtener datos');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const resetData = () => {
    setData([]);
    setError(null);
    setPagination({
      current_page: 1,
      total_pages: 1,
      total_records: 0,
      records_per_page: 50,
      has_next: false,
      has_prev: false
    });
  };

  return {
    data,
    loading,
    error,
    pagination,
    fetchOperativosPie,
    resetData
  };
};

export default useOperativosPie;
```

### **📄 3. Componente Principal - OperativosPiePage**
```jsx
import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Spin } from 'antd';
import FiltrosOperativosPie from '../components/FiltrosOperativosPie';
import useOperativosPie from '../hooks/useOperativosPie';
import moment from 'moment';

const OperativosPiePage = () => {
  const [filtros, setFiltros] = useState({
    fecha_inicio: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    fecha_fin: moment().format('YYYY-MM-DD'),
    page: 1,
    limit: 50
  });

  const { data, loading, error, pagination, fetchOperativosPie } = useOperativosPie();

  // Cargar datos iniciales
  useEffect(() => {
    fetchOperativosPie(filtros);
  }, []);

  // Manejar cambios en filtros
  const handleFiltersChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    fetchOperativosPie(nuevosFiltros);
  };

  // Manejar paginación
  const handleTableChange = (paginationConfig) => {
    const nuevosFiltros = {
      ...filtros,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize
    };
    setFiltros(nuevosFiltros);
    fetchOperativosPie(nuevosFiltros);
  };

  // Columnas de la tabla
  const columns = [
    {
      title: 'Fecha Turno',
      dataIndex: 'fecha_turno',
      key: 'fecha_turno',
      sorter: true,
      render: (text) => moment(text).format('DD/MM/YYYY')
    },
    {
      title: 'Turno',
      dataIndex: 'turno',
      key: 'turno',
      sorter: true
    },
    {
      title: 'Personal Asignado',
      dataIndex: 'Personal_asignado',
      key: 'Personal_asignado',
      sorter: true
    },
    {
      title: 'Cuadrante',
      dataIndex: 'nombre_cuadrante',
      key: 'nombre_cuadrante',
      sorter: true
    },
    {
      title: 'Tipo Novedad',
      dataIndex: 'tipo_novedad_nombre',
      key: 'tipo_novedad_nombre',
      sorter: true
    },
    {
      title: 'Prioridad',
      dataIndex: 'prioridad',
      key: 'prioridad',
      sorter: true,
      render: (prioridad) => (
        <span className={`badge badge-${prioridad.toLowerCase()}`}>
          {prioridad}
        </span>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <div className="flex gap-2">
          <button 
            className="btn btn-sm btn-info"
            onClick={() => verDetalles(record)}
          >
            Ver
          </button>
          <button 
            className="btn btn-sm btn-warning"
            onClick={() => editarRegistro(record)}
          >
            Editar
          </button>
        </div>
      )
    }
  ];

  const verDetalles = (record) => {
    // Implementar lógica para ver detalles
    console.log('Ver detalles:', record);
  };

  const editarRegistro = (record) => {
    // Implementar lógica para editar
    console.log('Editar:', record);
  };

  return (
    <div className="operativos-pie-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Operativos a Pie</h1>
        <p className="text-gray-600">Consulta y filtra operativos de personal a pie</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <FiltrosOperativosPie 
          onFiltersChange={handleFiltersChange}
          loading={loading}
        />
      </Card>

      {/* Error */}
      {error && (
        <Alert 
          message="Error" 
          description={error} 
          type="error" 
          className="mb-4"
          showIcon
        />
      )}

      {/* Tabla de resultados */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Resultados ({pagination.total_records} registros)
          </h2>
          <div className="text-sm text-gray-600">
            Página {pagination.current_page} de {pagination.total_pages}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.current_page,
            pageSize: pagination.records_per_page,
            total: pagination.total_records,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} registros`
          }}
          onChange={handleTableChange}
          rowKey="novedad_id"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default OperativosPiePage;
```

### **🎨 4. Estilos CSS**
```css
/* Componente Filtros Operativos a Pie */
.filtros-operativos-pie {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filtros-operativos-pie .grid {
  display: grid;
  gap: 16px;
}

.filtros-operativos-pie .grid-cols-1 {
  grid-template-columns: 1fr;
}

.filtros-operativos-pie .md\:grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.filtros-operativos-pie .lg\:grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.filtros-operativos-pie label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  display: block;
}

/* Badges de prioridad */
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.badge-baja {
  background-color: #e5e7eb;
  color: #374151;
}

.badge-media {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-alta {
  background-color: #fed7aa;
  color: #c2410c;
}

.badge-crítica {
  background-color: #fecaca;
  color: #b91c1c;
}

/* Tabla responsive */
.operativos-pie-page .ant-table-wrapper {
  overflow-x: auto;
}

/* Loading states */
.ant-spin-nested-loading {
  min-height: 200px;
}
```

### **🔄 5. Reutilización con Vehiculares**
```jsx
// Crear un componente genérico FiltrosOperativos
const FiltrosOperativos = ({ tipo, onFiltersChange, loading }) => {
  // tipo puede ser 'vehicular' o 'pie'
  const esVehicular = tipo === 'vehicular';
  
  return (
    <div className="filtros-operativos">
      {/* Mismos filtros para ambos tipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ... filtros comunes ... */}
        
        {/* Filtro específico según tipo */}
        {esVehicular ? (
          <div>
            <label>Vehículo</label>
            <Select name="vehiculo_id" options={vehiculosOptions} />
          </div>
        ) : (
          <div>
            <label>Personal Asignado</label>
            <Select name="personal_id" options={personalOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

// Uso en componentes:
<FiltrosOperativos tipo="pie" onFiltersChange={handleFiltersPie} />
<FiltrosOperativos tipo="vehicular" onFiltersChange={handleFiltersVehicular} />
```

---

## 📋 **Endpoints Disponibles**

### **✅ Operativos a Pie**
```
GET /api/v1/reportes-operativos/pie
```
- **Filtros**: Todos los homologados disponibles
- **Paginación**: Soportada
- **Ordenamiento**: Disponible

### **✅ Dropdowns para Filtros**
```
GET /api/v1/horarios-turnos          // Para turnos
GET /api/v1/sectores                  // Para sectores  
GET /api/v1/cuadrantes               // Para cuadrantes
GET /api/v1/personal                 // Para personal
GET /api/v1/tipos-novedad            // Para tipos de novedad
GET /api/v1/estados-novedad          // Para estados de novedad
```

---

## 🚀 **Guía de Implementación Frontend**

### **📦 1. Dependencias Requeridas**
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "antd": "^5.0.0",
    "axios": "^1.0.0",
    "moment": "^2.29.0",
    "react-router-dom": "^6.0.0"
  }
}
```

### **🔧 2. Configuración de Axios**
```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### **🗂️ 3. Estructura de Carpetas Sugerida**
```
src/
├── components/
│   ├── common/
│   │   ├── FiltrosOperativos.jsx
│   │   └── TablaOperativos.jsx
│   └── operativos/
│       ├── FiltrosOperativosPie.jsx
│       └── TablaOperativosPie.jsx
├── hooks/
│   ├── useOperativosPie.js
│   └── useOperativosVehiculares.js
├── pages/
│   ├── OperativosPiePage.jsx
│   └── OperativosVehicularesPage.jsx
├── services/
│   ├── api.js
│   └── endpoints/
│       ├── operativos.js
│       └── catalogos.js
├── utils/
│   ├── constants.js
│   └── helpers.js
└── styles/
    ├── components.css
    └── pages.css
```

### **⚡ 4. Optimizaciones de Performance**
```javascript
// Memoización de componentes pesados
import React, { memo, useMemo, useCallback } from 'react';

const FiltrosOperativosPie = memo(({ onFiltersChange, loading }) => {
  // Memoizar opciones para evitar recargas innecesarias
  const opcionesMemo = useMemo(() => ({
    turnos: opciones.turnos,
    sectores: opciones.sectores,
    // ... otras opciones
  }), [opciones.turnos, opciones.sectores]);

  // Callback memoizado para evitar re-renders
  const handleFilterChangeMemo = useCallback((campo, valor) => {
    handleFilterChange(campo, valor);
  }, [handleFilterChange]);

  return (
    // ... componente
  );
});

// Debounce para búsqueda genérica
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((value) => handleFilterChange('generico', value), 500),
  [handleFilterChange]
);
```

### **🔄 5. Manejo de Estado Global (Redux/Zustand)**
```javascript
// src/store/operativosSlice.js (Redux Toolkit)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchOperativosPie = createAsyncThunk(
  'operativos/fetchPie',
  async (filtros) => {
    const response = await api.get('/reportes-operativos/pie', { params: filtros });
    return response.data;
  }
);

const operativosSlice = createSlice({
  name: 'operativos',
  initialState: {
    pie: { data: [], loading: false, error: null, pagination: {} },
    vehiculares: { data: [], loading: false, error: null, pagination: {} }
  },
  reducers: {
    clearError: (state) => {
      state.pie.error = null;
      state.vehiculares.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperativosPie.pending, (state) => {
        state.pie.loading = true;
        state.pie.error = null;
      })
      .addCase(fetchOperativosPie.fulfilled, (state, action) => {
        state.pie.loading = false;
        state.pie.data = action.payload.data;
        state.pie.pagination = action.payload.pagination;
      })
      .addCase(fetchOperativosPie.rejected, (state, action) => {
        state.pie.loading = false;
        state.pie.error = action.error.message;
      });
  }
});

export const { clearError } = operativosSlice.actions;
export default operativosSlice.reducer;
```

### **🎨 6. Componentes Reutilizables**
```javascript
// src/components/common/FiltrosOperativosGenericos.jsx
const FiltrosOperativosGenericos = ({ 
  filtros, 
  onFilterChange, 
  opciones, 
  loading,
  tipo = 'pie' // 'pie' o 'vehicular'
}) => {
  const esVehicular = tipo === 'vehicular';

  return (
    <div className="filtros-genericos">
      {/* Filtros comunes */}
      <FiltroFechas 
        fechaInicio={filtros.fecha_inicio}
        fechaFin={filtros.fecha_fin}
        onChange={onFilterChange}
      />
      
      <FiltroSelect 
        name="turno"
        value={filtros.turno}
        options={opciones.turnos}
        onChange={onFilterChange}
        placeholder="Seleccionar turno"
      />
      
      {/* Filtro específico según tipo */}
      {esVehicular ? (
        <FiltroVehiculo 
          value={filtros.vehiculo_id}
          options={opciones.vehiculos}
          onChange={onFilterChange}
        />
      ) : (
        <FiltroPersonal 
          value={filtros.personal_id}
          options={opciones.personal}
          onChange={onFilterChange}
        />
      )}
    </div>
  );
};
```

### **🧪 7. Testing Unitario**
```javascript
// src/hooks/__tests__/useOperativosPie.test.js
import { renderHook, act } from '@testing-library/react';
import useOperativosPie from '../useOperativosPie';
import api from '../../services/api';

jest.mock('../../services/api');

describe('useOperativosPie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe cargar datos iniciales', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [{ id: 1, nombre: 'Test' }],
        pagination: { current_page: 1, total_pages: 1 }
      }
    };
    api.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOperativosPie());

    await act(async () => {
      await result.current.fetchOperativosPie();
    });

    expect(result.current.data).toEqual(mockResponse.data.data);
    expect(result.current.loading).toBe(false);
  });

  it('debe manejar errores', async () => {
    api.get.mockRejectedValue(new Error('Error de red'));

    const { result } = renderHook(() => useOperativosPie());

    await act(async () => {
      await result.current.fetchOperativosPie();
    });

    expect(result.current.error).toBe('Error de red');
    expect(result.current.loading).toBe(false);
  });
});
```

### **📱 8. Responsive Design**
```css
/* Estilos responsive para filtros */
@media (max-width: 768px) {
  .filtros-operativos-pie .grid {
    grid-template-columns: 1fr;
  }
  
  .filtros-operativos-pie .flex {
    flex-direction: column;
  }
  
  .ant-table {
    font-size: 12px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .filtros-operativos-pie .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .filtros-operativos-pie .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### **🔄 9. Manejo de Cache**
```javascript
// src/utils/cache.js
const cache = new Map();

export const getCachedData = (key, ttl = 300000) => { // 5 minutos por defecto
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
};

export const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Uso en el hook
const fetchOperativosPie = async (filtros = {}) => {
  const cacheKey = `operativos-pie-${JSON.stringify(filtros)}`;
  const cached = getCachedData(cacheKey);
  
  if (cached) {
    setData(cached.data);
    setPagination(cached.pagination);
    return;
  }
  
  // ... lógica de fetch
  
  setCachedData(cacheKey, { data: response.data.data, pagination: response.data.pagination });
};
```

### **🎯 10. Best Practices**
```javascript
// src/constants/filters.js
export const FILTER_DEFAULTS = {
  page: 1,
  limit: 50,
  fecha_inicio: moment().subtract(7, 'days').format('YYYY-MM-DD'),
  fecha_fin: moment().format('YYYY-MM-DD')
};

export const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja', color: 'gray' },
  { value: 'MEDIA', label: 'Media', color: 'yellow' },
  { value: 'ALTA', label: 'Alta', color: 'orange' },
  { value: 'CRÍTICA', label: 'Crítica', color: 'red' }
];

export const TURNOS = [
  { value: 'MAÑANA', label: 'Mañana (06:00-14:00)' },
  { value: 'TARDE', label: 'Tarde (14:00-22:00)' },
  { value: 'NOCHE', label: 'Noche (22:00-06:00)' }
];
```

### **📊 11. Métricas y Monitorización**
```javascript
// src/utils/analytics.js
export const trackFilterUsage = (filterName, filterValue) => {
  if (window.gtag) {
    window.gtag('event', 'filter_usage', {
      filter_name: filterName,
      filter_value: filterValue,
      page: 'operativos-pie'
    });
  }
};

// Uso en componente
const handleFilterChange = (campo, valor) => {
  trackFilterUsage(campo, valor);
  // ... resto de la lógica
};
```

### **🔐 12. Seguridad**
```javascript
// Validación de datos en el frontend
const validateFilters = (filtros) => {
  const errors = {};
  
  if (filtros.fecha_inicio && !moment(filtros.fecha_inicio).isValid()) {
    errors.fecha_inicio = 'Fecha inválida';
  }
  
  if (filtros.fecha_fin && !moment(filtros.fecha_fin).isValid()) {
    errors.fecha_fin = 'Fecha inválida';
  }
  
  if (filtros.fecha_inicio && filtros.fecha_fin && 
      moment(filtros.fecha_inicio).isAfter(filtros.fecha_fin)) {
    errors.fecha_fin = 'La fecha fin debe ser posterior a la fecha inicio';
  }
  
  return errors;
};
```

---

## 🎯 **Ventajas de la Homologación**

### **✅ Para el Frontend**
- **Componentes reutilizables** entre vehiculares y operativos a pie
- **Misma lógica de filtros** y validación
- **Consistencia en UI/UX** para el usuario
- **Menor código duplicado** y mantenimiento

### **✅ Para el Usuario**
- **Experiencia consistente** al filtrar diferentes tipos de operativos
- **Mismos patrones de búsqueda** en toda la aplicación
- **Resultados predecibles** y esperados

### **✅ Para el Backend**
- **Código mantenible** y escalable
- **Validaciones consistentes** across endpoints
- **Fácil extensión** de nuevos filtros

---

## 🚀 **Estado Actual**

- **✅ Homologación completada**: Todos los filtros vehiculares disponibles en operativos a pie
- **✅ Validadores actualizados**: Mismas reglas de validación
- **✅ Documentación completa**: Guía para implementación frontend
- **✅ Testing listo**: Endpoints funcionando correctamente
- **✅ Producción estable**: Sin errores en deployment

---

## 🎯 **Resumen de Implementación Frontend**

### **📋 Checklist de Implementación:**

#### **✅ Backend (Completado)**
- [x] Homologación de filtros en `getOperativosPie`
- [x] Sanitización de parámetros
- [x] SQL con filtros dinámicos
- [x] CountQuery actualizado
- [x] Replacements dinámicos
- [x] Response `filters_applied` completo
- [x] ESLint sin errores
- [x] Servidor estable

#### **🔄 Frontend (Por Implementar)**
- [ ] Crear componente `FiltrosOperativosPie.jsx`
- [ ] Crear hook `useOperativosPie.js`
- [ ] Crear página `OperativosPiePage.jsx`
- [ ] Configurar axios y endpoints
- [ ] Implementar manejo de errores
- [ ] Agregar loading states
- [ ] Implementar paginación
- [ ] Agregar testing unitario
- [ ] Optimizar performance (memoización)
- [ ] Implementar responsive design

### **🚀 Pasos Siguientes para el Frontend:**

#### **1. Configuración Inicial**
```bash
# Instalar dependencias
npm install antd axios moment react-router-dom

# Crear estructura de carpetas
mkdir -p src/components/operativos
mkdir -p src/hooks
mkdir -p src/pages
mkdir -p src/services/endpoints
mkdir -p src/utils
```

#### **2. Implementación Base**
- Copiar los componentes de la documentación
- Configurar axios con interceptores
- Crear el hook personalizado
- Implementar la página principal

#### **3. Testing y Optimización**
- Agregar tests unitarios
- Implementar memoización
- Agregar manejo de cache
- Optimizar performance

#### **4. Despliegue**
- Verificar funcionamiento en desarrollo
- Probar en diferentes dispositivos
- Deploy a producción

### **🎯 Beneficios Inmediatos:**
- **Consistencia total** entre operativos vehiculares y a pie
- **Reutilización de componentes** y lógica
- **Mantenimiento simplificado**
- **Experiencia de usuario uniforme**

### **📊 Tiempo Estimado de Implementación:**
- **Configuración inicial**: 2-3 horas
- **Componentes básicos**: 4-6 horas
- **Testing y optimización**: 2-3 horas
- **Total estimado**: 8-12 horas

---

## 🔗 **Recursos Adicionales**

### **📚 Documentación de Referencia:**
- [Ant Design Documentation](https://ant.design/docs/react/introduce)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [Axios Documentation](https://axios-http.com/docs/intro)

### **🎨 Diseño y UX:**
- **Paleta de colores**: Verde oliva (militar/policial)
- **Componentes**: Consistentes con el resto de la aplicación
- **Responsive**: Mobile-first approach

### **🔧 Herramientas de Desarrollo:**
- **ESLint**: Para calidad de código
- **Prettier**: Para formato consistente
- **Jest**: Para testing unitario
- **React DevTools**: Para debugging

---

**¡Documentación completa y lista para implementación!** 🎯✨

**El frontend ahora tiene todas las herramientas necesarias para implementar filtros avanzados en operativos a pie con total consistencia con los operativos vehiculares.** 🚀
