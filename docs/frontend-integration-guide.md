# Frontend Integration Guide - CitySecure API

## **🎯 Guía Rápida de Integración**

### **📋 Requisitos Previos**
1. **Token JWT válido** (obtenido del login)
2. **URL Base**: `http://localhost:3000/api/v1`
3. **Headers**: `Authorization: Bearer <token>`

---

## **🔧 Configuración de Cliente HTTP**

### **Axios Configuration**
```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
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
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## **📊 Estructura de Datos**

### **Abastecimiento Object**
```javascript
const abastecimiento = {
  id: number,
  vehiculo_id: number,
  personal_id: number,
  fecha_hora: string, // ISO 8601
  tipo_combustible: string, // ENUM values
  km_actual: number,
  cantidad: number,
  unidad: string, // "LITROS" | "GALONES"
  precio_unitario: number,
  importe_total: number,
  grifo_nombre: string,
  grifo_ruc?: string,
  factura_boleta?: string,
  moneda: string, // "PEN" | "USD"
  observaciones?: string,
  comprobante_adjunto?: string,
  estado: number, // 1 = activo
  created_at: string,
  updated_at: string,
  // Datos relacionados del vehículo
  vehiculo: {
    id: number,
    codigo_vehiculo: string,
    placa: string,
    marca: string,
    modelo_vehiculo: string,
    anio_vehiculo: number,
    color_vehiculo: string,
    estado_operativo: string, // "DISPONIBLE", "EN_SERVICIO", etc.
    kilometraje_actual: number,
    tipo_vehiculo: {
      id: number,
      nombre: string, // "Patrullero", "Motocicleta", "Ambulancia", etc.
      descripcion: string,
      prefijo: string
    }
  },
  // Datos relacionados del personal
  personal: {
    id: number,
    doc_tipo: string, // "DNI", "Carnet Extranjeria", "Pasaporte", "PTP"
    doc_numero: string,
    nombres: string,
    apellido_paterno: string,
    apellido_materno: string,
    status: string // "Activo", "Inactivo", "Suspendido", "Retirado"
  }
};
```

### **Helper Functions para Frontend**
```javascript
// Construir nombre completo del personal
const getNombreCompleto = (personal) => {
  return `${personal.apellido_paterno} ${personal.apellido_materno} ${personal.nombres}`;
};

// Construir documento completo del personal
const getDocumentoCompleto = (personal) => {
  return `${personal.doc_tipo} ${personal.doc_numero}`;
};

// Obtener tipo de vehículo formateado
const getTipoVehiculo = (vehiculo) => {
  return vehiculo.tipo_vehiculo?.nombre || 'Sin tipo';
};

// Obtener estado operativo formateado
const getEstadoOperativo = (vehiculo) => {
  const estados = {
    'DISPONIBLE': 'Disponible',
    'EN_SERVICIO': 'En Servicio',
    'MANTENIMIENTO': 'Mantenimiento',
    'REPARACION': 'Reparación',
    'FUERA_DE_SERVICIO': 'Fuera de Servicio',
    'INACTIVO': 'Inactivo',
    'CON_DESPERFECTO': 'Con Desperfecto'
  };
  return estados[vehiculo.estado_operativo] || vehiculo.estado_operativo;
};
```

---

## **🎨 Componente React Example**

### **AbastecimientosList.jsx**
```jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AbastecimientosList = () => {
  const [abastecimientos, setAbastecimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    vehiculo_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  useEffect(() => {
    fetchAbastecimientos();
  }, []);

  const fetchAbastecimientos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/abastecimientos?${params}`);
      
      if (response.data.success) {
        setAbastecimientos(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este abastecimiento?')) {
      return;
    }

    try {
      const response = await api.delete(`/abastecimientos/${id}`);
      
      if (response.data.success) {
        setAbastecimientos(prev => prev.filter(item => item.id !== id));
        alert('Abastecimiento eliminado correctamente');
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container">
      <h2>Abastecimientos de Combustible</h2>
      
      {/* Filtros */}
      <div className="filters">
        <input
          type="number"
          placeholder="ID Vehículo"
          value={filters.vehiculo_id}
          onChange={(e) => setFilters({...filters, vehiculo_id: e.target.value})}
        />
        <input
          type="date"
          value={filters.fecha_inicio}
          onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
        />
        <input
          type="date"
          value={filters.fecha_fin}
          onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
        />
        <button onClick={fetchAbastecimientos}>Filtrar</button>
      </div>

      {/* Tabla */}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehículo</th>
            <th>Tipo</th>
            <th>Conductor</th>
            <th>Fecha</th>
            <th>Tipo Combustible</th>
            <th>Cantidad</th>
            <th>Importe</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {abastecimientos.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                <div>{item.vehiculo?.placa || '-'}</div>
                <small>{item.vehiculo?.codigo_vehiculo || ''}</small>
              </td>
              <td>{item.vehiculo?.tipo_vehiculo?.nombre || '-'}</td>
              <td>
                <div>{item.personal ? 
                  `${item.personal.apellido_paterno} ${item.personal.apellido_materno}` : '-'}</div>
                <small>{item.personal?.doc_tipo} {item.personal?.doc_numero}</small>
              </td>
              <td>{new Date(item.fecha_hora).toLocaleDateString()}</td>
              <td>{item.tipo_combustible}</td>
              <td>{item.cantidad} {item.unidad}</td>
              <td>{item.moneda} {item.importe_total}</td>
              <td>
                <span className={`estado ${item.vehiculo?.estado_operativo?.toLowerCase()}`}>
                  {item.vehiculo?.estado_operativo || '-'}
                </span>
              </td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AbastecimientosList;
```

---

## **📝 Formulario Example**

### **AbastecimientoForm.jsx**
```jsx
import React, { useState } from 'react';
import api from '../services/api';

const AbastecimientoForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    vehiculo_id: '',
    fecha_hora: new Date().toISOString().slice(0, 16),
    tipo_combustible: 'GASOLINA_REGULAR',
    km_actual: '',
    cantidad: '',
    precio_unitario: '',
    importe_total: '',
    grifo_nombre: '',
    grifo_ruc: '',
    factura_boleta: '',
    moneda: 'PEN',
    observaciones: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const TIPOS_COMBUSTIBLE = [
    'GASOLINA_REGULAR',
    'GASOLINA_PREMIUM',
    'GASOHOL_REGULAR',
    'GASOHOL_PREMIUM',
    'DIESEL_B2',
    'DIESEL_B5',
    'DIESEL_S50',
    'GLP',
    'GNV'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const calculateImporte = () => {
    const cantidad = parseFloat(formData.cantidad) || 0;
    const precio = parseFloat(formData.precio_unitario) || 0;
    setFormData(prev => ({
      ...prev,
      importe_total: (cantidad * precio).toFixed(2)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.vehiculo_id) {
      newErrors.vehiculo_id = 'El vehículo es requerido';
    }
    if (!formData.fecha_hora) {
      newErrors.fecha_hora = 'La fecha es requerida';
    }
    if (!formData.km_actual || formData.km_actual <= 0) {
      newErrors.km_actual = 'El kilometraje debe ser mayor a 0';
    }
    if (!formData.cantidad || formData.cantidad <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    if (!formData.precio_unitario || formData.precio_unitario <= 0) {
      newErrors.precio_unitario = 'El precio debe ser mayor a 0';
    }
    if (!formData.grifo_nombre.trim()) {
      newErrors.grifo_nombre = 'El nombre del grifo es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/abastecimientos', formData);
      
      if (response.data.success) {
        alert('Abastecimiento creado correctamente');
        onSuccess();
        onClose();
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setErrors(
          err.response.data.errors.reduce((acc, error) => {
            acc[error.field] = error.message;
            return acc;
          }, {})
        );
      } else {
        alert(err.response?.data?.message || 'Error al crear abastecimiento');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Nuevo Abastecimiento</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vehículo ID:</label>
            <input
              type="number"
              name="vehiculo_id"
              value={formData.vehiculo_id}
              onChange={handleChange}
              className={errors.vehiculo_id ? 'error' : ''}
            />
            {errors.vehiculo_id && <span className="error-text">{errors.vehiculo_id}</span>}
          </div>

          <div className="form-group">
            <label>Fecha y Hora:</label>
            <input
              type="datetime-local"
              name="fecha_hora"
              value={formData.fecha_hora}
              onChange={handleChange}
              className={errors.fecha_hora ? 'error' : ''}
            />
            {errors.fecha_hora && <span className="error-text">{errors.fecha_hora}</span>}
          </div>

          <div className="form-group">
            <label>Tipo Combustible:</label>
            <select
              name="tipo_combustible"
              value={formData.tipo_combustible}
              onChange={handleChange}
            >
              {TIPOS_COMBUSTIBLE.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kilometraje Actual:</label>
              <input
                type="number"
                step="0.01"
                name="km_actual"
                value={formData.km_actual}
                onChange={handleChange}
                className={errors.km_actual ? 'error' : ''}
              />
              {errors.km_actual && <span className="error-text">{errors.km_actual}</span>}
            </div>

            <div className="form-group">
              <label>Cantidad:</label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                onBlur={calculateImporte}
                className={errors.cantidad ? 'error' : ''}
              />
              {errors.cantidad && <span className="error-text">{errors.cantidad}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Precio Unitario:</label>
              <input
                type="number"
                step="0.01"
                name="precio_unitario"
                value={formData.precio_unitario}
                onChange={handleChange}
                onBlur={calculateImporte}
                className={errors.precio_unitario ? 'error' : ''}
              />
              {errors.precio_unitario && <span className="error-text">{errors.precio_unitario}</span>}
            </div>

            <div className="form-group">
              <label>Importe Total:</label>
              <input
                type="number"
                step="0.01"
                name="importe_total"
                value={formData.importe_total}
                onChange={handleChange}
                readOnly
              />
            </div>
          </div>

          <div className="form-group">
            <label>Nombre del Grifo:</label>
            <input
              type="text"
              name="grifo_nombre"
              value={formData.grifo_nombre}
              onChange={handleChange}
              className={errors.grifo_nombre ? 'error' : ''}
            />
            {errors.grifo_nombre && <span className="error-text">{errors.grifo_nombre}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>RUC del Grifo:</label>
              <input
                type="text"
                name="grifo_ruc"
                value={formData.grifo_ruc}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Factura/Boleta:</label>
              <input
                type="text"
                name="factura_boleta"
                value={formData.factura_boleta}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Moneda:</label>
            <select
              name="moneda"
              value={formData.moneda}
              onChange={handleChange}
            >
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observaciones:</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbastecimientoForm;
```

---

## **🎨 Estilos CSS Básicos**

### **styles.css**
```css
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 5px;
}

.filters input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filters button {
  padding: 8px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background: #f8f9fa;
  font-weight: bold;
}

.table td div {
  font-weight: 500;
}

.table td small {
  color: #666;
  font-size: 0.85em;
}

.estado {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.estado.disponible {
  background: #d4edda;
  color: #155724;
}

.estado.en_servicio {
  background: #cce5ff;
  color: #004085;
}

.estado.mantenimiento {
  background: #fff3cd;
  color: #856404;
}

.estado.reparacion {
  background: #f8d7da;
  color: #721c24;
}

.estado.fuera_de_servicio {
  background: #e2e3e5;
  color: #383d41;
}

.estado.inactivo {
  background: #f8d7da;
  color: #721c24;
}

.estado.con_desperfecto {
  background: #fff3cd;
  color: #856404;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input.error,
.form-group select.error {
  border-color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="button"] {
  background: #6c757d;
  color: white;
}

.form-actions button[type="submit"] {
  background: #28a745;
  color: white;
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## **🔧 Testing Tips**

### **Postman Tests**
1. Importar la collection proporcionada
2. Ejecutar login primero para obtener token
3. Probar cada endpoint con diferentes datos

### **Frontend Testing**
```javascript
// Test de conexión
const testConnection = async () => {
  try {
    const response = await api.get('/abastecimientos?limit=1');
    console.log('✅ Conexión exitosa:', response.data.success);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
};
```

---

**📞 Soporte:**
- Documentación completa: `docs/abastecimiento-combustible-api.md`
- Collection Postman: `postman/CitySecure - Abastecimiento Combustible.postman_collection.json`
- Issues: Crear ticket en el sistema de seguimiento
