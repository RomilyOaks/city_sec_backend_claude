# 📋 Guía para Frontend - Despacho de Patrullaje a Pie desde Novedades

## 🎯 Objetivo

Implementar en el frontend la lógica para despachar patrullaje a pie cuando una novedad tiene `personal_cargo_id` asignado, complementando el flujo existente de patrullaje vehicular.

---

## 🔄 **Flujo de Despacho**

### **📊 Lógica de Despacho Condicional**

```javascript
// Cuando novedad.personal_cargo_id tiene dato
if (novedadData.personal_cargo_id && novedadData.personal_cargo_id !== '') {
  // Despacho para patrullaje a pie
  await despacharPersonalAPie(novedadData);
} 
// Cuando novedad.vehiculo_id tiene dato  
else if (novedadData.vehiculo_id && novedadData.vehiculo_id !== '') {
  // Despacho para patrullaje vehicular (existente)
  await despacharVehiculo(novedadData);
}
// 🔥 IMPORTANTE: No se permite crear novedad sin despacho
else {
  throw new Error('Debe seleccionar vehículo o personal para despachar');
}
```

---

## 🛠️ **Endpoints del Backend**

### **Operativos Personales**

```javascript
// Obtener personal disponible para despacho
GET /api/v1/operativos-personal/disponibles?cuadrante_id={id}
Headers: Authorization: Bearer {token}

// Respuesta esperada
{
  "success": true,
  "message": "Personal disponible obtenido exitosamente",
  "data": [
    {
      "id": 456,
      "nombres": "Juan",
      "apellido_paterno": "Pérez",
      "apellido_materno": "García",
      "codigo_personal": "PER-001",
      "estado": true
    }
  ],
  "total": 1
}
```

```javascript
// Crear operativo personal completo (despacho)
POST /api/v1/operativos-personal/despachar-completo
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "novedad_id": 123,
  "personal_cargo_id": 456,
  "cuadrante_id": 78,
  "prioridad": "ALTA",
  "turno_id": 2,
  "observaciones": "Despacho desde novedades"
}

// Respuesta esperada
{
  "success": true,
  "message": "Operativo personal creado exitosamente",
  "data": {
    "operativo_turno": { 
      "id": 1, 
      "turno_id": 2, 
      "fecha_inicio": "2026-01-23T10:00:00.000Z" 
    },
    "operativo_personal": { 
      "id": 1, 
      "personal_id": 456, 
      "operativo_turno_id": 1 
    },
    "operativo_cuadrante": { 
      "id": 1, 
      "cuadrante_id": 78, 
      "operativo_personal_id": 1 
    },
    "operativo_novedad": { 
      "id": 1, 
      "novedad_id": 123, 
      "prioridad": "ALTA", 
      "resultado": "PENDIENTE",
      "reportado": "2026-01-23T10:00:00.000Z"
    }
  }
}
```

### **Endpoints Adicionales**

```javascript
// Listar operativos personales
GET /api/v1/operativos-personal

// Obtener operativo personal por ID
GET /api/v1/operativos-personal/:id

// Actualizar operativo personal
PUT /api/v1/operativos-personal/:id

// Eliminar operativo personal (soft delete)
DELETE /api/v1/operativos-personal/:id

// Gestión de cuadrantes asignados
GET /api/v1/operativos-personal-cuadrantes
POST /api/v1/operativos-personal-cuadrantes
PUT /api/v1/operativos-personal-cuadrantes/:id
DELETE /api/v1/operativos-personal-cuadrantes/:id

// Gestión de novedades asignadas
GET /api/v1/operativos-personal-novedades
POST /api/v1/operativos-personal-novedades
PUT /api/v1/operativos-personal-novedades/:id
DELETE /api/v1/operativos-personal-novedades/:id
```

---

## 🎨 **Implementación Frontend - Ejemplos de Uso**

### **1. Servicio de Despacho Personal**

```javascript
// services/operativosPersonalService.js
import axios from 'axios';

const API_BASE = '/api/v1';

export const operativosPersonalService = {
  // Obtener personal disponible para despacho
  getPersonalDisponible: async (cuadrante_id = null) => {
    try {
      const params = cuadrante_id ? `?cuadrante_id=${cuadrante_id}` : '';
      const response = await axios.get(
        `${API_BASE}/operativos-personal/disponibles${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener personal disponible:', error);
      throw error;
    }
  },

  // Crear operativo personal completo
  crearOperativoPersonalCompleto: async (novedadData) => {
    try {
      const response = await axios.post(
        `${API_BASE}/operativos-personal/despachar-completo`,
        {
          novedad_id: novedadData.id,
          personal_cargo_id: novedadData.personal_cargo_id,
          cuadrante_id: novedadData.cuadrante_id,
          prioridad: novedadData.prioridad_actual || 'MEDIA',
          turno_id: novedadData.turno_id || obtenerTurnoActual(),
          observaciones: novedadData.observaciones || ''
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear operativo personal:', error);
      throw error;
    }
  }
};

// Helper para obtener turno actual
const obtenerTurnoActual = () => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 14) return 1; // Mañana
  if (hora >= 14 && hora < 22) return 2; // Tarde
  return 3; // Noche
};
```

### **2. Componente Dropdown de Personal**

```jsx
// components/PersonalCargoDropdown.jsx
import React, { useState, useEffect } from 'react';
import { operativosPersonalService } from '../services/operativosPersonalService';

const PersonalCargoDropdown = ({ value, onChange, cuadrante_id, disabled = false }) => {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPersonalDisponible();
  }, [cuadrante_id]);

  const cargarPersonalDisponible = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await operativosPersonalService.getPersonalDisponible(cuadrante_id);
      if (response.success) {
        setPersonal(response.data?.data || []);
      } else {
        setError('No se pudieron cargar los datos del personal');
      }
    } catch (error) {
      console.error('Error cargando personal disponible:', error);
      setError('Error al cargar personal disponible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-group">
      <label htmlFor="personal_cargo_id">Personal a Cargo (Patrullaje a Pie):</label>
      
      {loading && (
        <div className="spinner-border spinner-border-sm me-2" role="status">
          <span className="sr-only">Cargando...</span>
        </div>
      )}
      
      {error && (
        <div className="alert alert-warning">
          <small>{error}</small>
        </div>
      )}
      
      <select
        id="personal_cargo_id"
        name="personal_cargo_id"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="form-control"
      >
        <option value="">Seleccione personal...</option>
        {personal.map(persona => (
          <option key={persona.id} value={persona.id}>
            {persona.nombres} {persona.apellido_paterno} {persona.apellido_materno} 
            ({persona.codigo_personal})
          </option>
        ))}
      </select>
      
      <small className="form-text text-muted">
        Seleccione personal para patrullaje a pie. Si selecciona vehículo, este campo se limpiará automáticamente.
      </small>
    </div>
  );
};

export default PersonalCargoDropdown;
```

### **3. Lógica de Selección Exclusiva**

```jsx
// En NovedadesPage.jsx
const handlePersonalChange = (personalId) => {
  setFormData(prev => ({
    ...prev,
    personal_cargo_id: personalId,
    vehiculo_id: null // 🔥 Limpiar vehículo al seleccionar personal
  }));
};

const handleVehiculoChange = (vehiculoId) => {
  setFormData(prev => ({
    ...prev,
    vehiculo_id: vehiculoId,
    personal_cargo_id: null // 🔥 Limpiar personal al seleccionar vehículo
  }));
};
```

### **4. Integración en Formulario**

```jsx
// En el formulario de creación/edición de novedades
<div className="row">
  {/* Columna de despacho vehicular (existente) */}
  <div className="col-md-6">
    <VehiculoDropdown
      value={formData.vehiculo_id}
      onChange={handleVehiculoChange}
      disabled={!!formData.personal_cargo_id}
    />
  </div>

  {/* 🔥 Nueva columna de despacho personal */}
  <div className="col-md-6">
    <PersonalCargoDropdown
      value={formData.personal_cargo_id}
      onChange={handlePersonalChange}
      cuadrante_id={formData.cuadrante_id}
      disabled={!!formData.vehiculo_id}
    />
  </div>
</div>

{/* Mensaje informativo */}
{(formData.vehiculo_id || formData.personal_cargo_id) && (
  <div className="alert alert-info">
    <i className="fas fa-info-circle me-2"></i>
    {formData.vehiculo_id 
      ? 'Se despachará patrullaje vehicular' 
      : 'Se despachará patrullaje a pie (personal)'
    }
  </div>
)}
```

---

## 🔍 **Validaciones y Reglas de Negocio**

### **Validaciones en Frontend**

```javascript
const validarDespacho = (formData) => {
  const errores = [];

  // 🔥 No se puede seleccionar ambos
  if (formData.vehiculo_id && formData.personal_cargo_id) {
    errores.push('No se puede despachar vehículo y personal simultáneamente');
  }

  // 🔥 Se debe seleccionar al menos uno
  if (!formData.vehiculo_id && !formData.personal_cargo_id) {
    errores.push('Debe seleccionar vehículo o personal para despachar');
  }

  // Validar cuadrante si hay personal
  if (formData.personal_cargo_id && !formData.cuadrante_id) {
    errores.push('El despacho de personal requiere cuadrante asignado');
  }

  return errores;
};

// Uso en el formulario
const handleSaveRegistro = async () => {
  const errores = validarDespacho(formData);
  if (errores.length > 0) {
    showErrorToast(errores.join('\n'));
    return;
  }
  
  // Continuar con el despacho...
};
```

---

## 📊 **Estados y Feedback Visual**

```jsx
// Estados de despacho
const [despachando, setDespachando] = useState(false);
const [operativoCreado, setOperativoCreado] = useState(null);

// Feedback visual durante el proceso
{despachando && (
  <div className="alert alert-warning">
    <i className="fas fa-spinner fa-spin me-2"></i>
    Despachando patrullaje a pie...
  </div>
)}

// Feedback de éxito
{operativoCreado && (
  <div className="alert alert-success">
    <i className="fas fa-check-circle me-2"></i>
    Operativo creado exitosamente: #{operativoCreado.id}
  </div>
)}
```

---

## 📋 **Checklist de Implementación Frontend**

### **Componentes Requeridos**
- [ ] **PersonalCargoDropdown** - Componente para seleccionar personal disponible
- [ ] permitir vehículo y personal simultáneamente
- [ ] **Validaciones** - Reglas de negocio en frontend
- [ ] **Feedback Visual** - Estados de carga y éxito
- [ ] **Manejo de Errores** - Capturar y mostrar errores específicos

### **Integración con Formulario**
- [ ] Agregar campo personal al formulario de novedades si no existe
- [ ] Implementar limpieza automática de campos
- [ ] Mostrar mensajes informativos de tipo de despacho
- [ ] Integrar con flujo existente de vehículos

### **Servicios y Lógica**
- [ ] Crear servicio de operativos personales
- [ ] Implementar función de despacho completo
- [ ] Manejar tokens de autenticación
- [ ] Probar flujo completo de creación

---

## 🚀 **Resumen de Implementación**

**El frontend debe:**
1. **Detectar** cuando `personal_cargo_id` tiene valor
2. **Despachar** usando el flujo de operativos personales
3. **Mostrar** dropdown de personal disponible
4. **Validar** que al menos uno de ellos se ingrese (vehículo O personal)
5. **Crear** toda la cadena de tablas automáticamente
6. **Proveer feedback** al usuario durante el proceso
7. **Manejar errores** de forma específica

**Regla Clave:** Siempre se debe seleccionar vehículo o personal para despachar. No se permite crear novedades sin asignación de recursos.
