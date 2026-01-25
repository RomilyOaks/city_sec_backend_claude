# 📋 Guía para Frontend - Dropdown Radios TETRA

## 🎯 Problema: Dropdown vacío de Radios TETRA

El dropdown de radios TETRA aparece vacío en la aplicación. Aquí están las indicaciones para solucionarlo.

---

## 🔍 **Endpoint Disponible**

### **GET /api/v1/radios-tetra/disponibles**
```javascript
// URL completa
GET http://localhost:3000/api/v1/radios-tetra/disponibles

// Headers requeridos
Authorization: Bearer {token}
Content-Type: application/json
```

### **📊 Respuesta Esperada**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "radios": [
      {
        "id": 1,
        "radio_tetra_code": "RADIO-001",
        "descripcion": "Radio TETRA Patrulla Norte",
        "personal_seguridad_id": null,
        "estado": true,
        "created_at": "2026-01-23T10:00:00.000Z",
        "updated_at": "2026-01-23T10:00:00.000Z"
      },
      {
        "id": 2,
        "radio_tetra_code": "RADIO-002", 
        "descripcion": "Radio TETRA Patrulla Sur",
        "personal_seguridad_id": null,
        "estado": true,
        "created_at": "2026-01-23T10:00:00.000Z",
        "updated_at": "2026-01-23T10:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

---

## 🛠️ **Implementación Frontend**

### **1. Servicio/API**
```javascript
// services/radioTetraService.js
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

export const radioTetraService = {
  // Obtener radios disponibles para dropdown
  getRadiosDisponibles: async () => {
    try {
      const response = await axios.get(`${API_BASE}/radios-tetra/disponibles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error obteniendo radios TETRA disponibles:', error);
      throw error;
    }
  }
};
```

### **2. Componente Dropdown**
```jsx
// components/RadioTetraDropdown.jsx
import React, { useState, useEffect } from 'react';
import { radioTetraService } from '../services/radioTetraService';

const RadioTetraDropdown = ({ value, onChange, disabled = false }) => {
  const [radios, setRadios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarRadiosDisponibles();
  }, []);

  const cargarRadiosDisponibles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await radioTetraService.getRadiosDisponibles();
      
      if (response.success) {
        setRadios(response.data.radios);
      } else {
        setError('No se pudieron cargar los radios disponibles');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar radios TETRA');
      
      // Mostrar mensaje específico según el error
      if (error.response?.status === 401) {
        setError('No autorizado - Inicie sesión nuevamente');
      } else if (error.response?.status === 403) {
        setError('No tiene permisos para ver radios TETRA');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="radio-tetra-dropdown">
      <label htmlFor="radio_tetra_id">Radio TETRA:</label>
      
      {loading && (
        <div className="loading">
          <span>Cargando radios...</span>
        </div>
      )}
      
      {error && (
        <div className="error">
          <span>{error}</span>
          <button 
            type="button" 
            onClick={cargarRadiosDisponibles}
            className="retry-btn"
          >
            Reintentar
          </button>
        </div>
      )}
      
      <select
        id="radio_tetra_id"
        name="radio_tetra_id"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="form-control"
      >
        <option value="">Seleccione un radio TETRA...</option>
        {radios.map(radio => (
          <option key={radio.id} value={radio.id}>
            {radio.radio_tetra_code} - {radio.descripcion || 'Sin descripción'}
          </option>
        ))}
      </select>
      
      {radios.length === 0 && !loading && !error && (
        <div className="no-data">
          <span>No hay radios TETRA disponibles</span>
        </div>
      )}
    </div>
  );
};

export default RadioTetraDropdown;
```

### **3. Uso en Formulario de Novedades**
```jsx
// components/NovedadForm.jsx
import React, { useState } from 'react';
import RadioTetraDropdown from './RadioTetraDropdown';

const NovedadForm = () => {
  const [formData, setFormData] = useState({
    origen_llamada: '',
    radio_tetra_id: '',
    reportante_telefono: '',
    // ... otros campos
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrigenChange = (value) => {
    handleInputChange('origen_llamada', value);
    
    // Limpiar campos no relevantes
    if (value === 'RADIO_TETRA') {
      handleInputChange('reportante_telefono', '');
      handleInputChange('reportante_nombre', '');
    } else {
      handleInputChange('radio_tetra_id', '');
    }
  };

  return (
    <form>
      {/* ... otros campos del formulario */}
      
      <div className="form-group">
        <label htmlFor="origen_llamada">Origen de Llamada:</label>
        <select
          id="origen_llamada"
          name="origen_llamada"
          value={formData.origen_llamada}
          onChange={(e) => handleOrigenChange(e.target.value)}
          className="form-control"
        >
          <option value="">Seleccione origen...</option>
          <option value="TELEFONO_107">Teléfono 107</option>
          <option value="RADIO_TETRA">Radio TETRA</option>
          <option value="REDES_SOCIALES">Redes Sociales</option>
          <option value="BOTON_EMERGENCIA_ALERTA_SURCO">Botón Emergencia SURCO</option>
          <option value="BOTON_DENUNCIA_VECINO_ALERTA">Botón Denuncia Vecino</option>
          <option value="INTERVENCION_DIRECTA">Intervención Directa</option>
          <option value="ANALITICA">Analítica</option>
          <option value="APP_PODER_JUDICIAL">App Poder Judicial</option>
          <option value="VIDEO_CCO">Video CCO</option>
        </select>
      </div>

      {/* Mostrar radio TETRA solo si origen es RADIO_TETRA */}
      {formData.origen_llamada === 'RADIO_TETRA' && (
        <div className="form-group">
          <RadioTetraDropdown
            value={formData.radio_tetra_id}
            onChange={(value) => handleInputChange('radio_tetra_id', value)}
          />
        </div>
      )}

      {/* Mostrar campos de reportante para otros orígenes */}
      {formData.origen_llamada !== 'RADIO_TETRA' && (
        <>
          <div className="form-group">
            <label htmlFor="reportante_telefono">Teléfono del Reportante:</label>
            <input
              type="tel"
              id="reportante_telefono"
              name="reportante_telefono"
              value={formData.reportante_telefono}
              onChange={(e) => handleInputChange('reportante_telefono', e.target.value)}
              className="form-control"
              placeholder="Ej: 987654321"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reportante_nombre">Nombre del Reportante:</label>
            <input
              type="text"
              id="reportante_nombre"
              name="reportante_nombre"
              value={formData.reportante_nombre}
              onChange={(e) => handleInputChange('reportante_nombre', e.target.value)}
              className="form-control"
              placeholder="Ej: Juan Pérez"
            />
          </div>
        </>
      )}
      
      {/* ... resto del formulario */}
    </form>
  );
};

export default NovedadForm;
```

---

## 🚨 **Posibles Problemas y Soluciones**

### **1. Error 401 - No Autorizado**
```javascript
// Verificar que el token esté presente y sea válido
const token = localStorage.getItem('token');
if (!token) {
  // Redirigir al login
  window.location.href = '/login';
}
```

### **2. Error 403 - Sin Permisos**
```javascript
// El usuario necesita el permiso: "catalogos.radios_tetra.read"
// Contactar al administrador para asignar el permiso
```

### **3. Respuesta Vacía (total: 0)**
```javascript
// Significa que no hay radios disponibles en la BD
// Verificar que existan radios con:
// - personal_seguridad_id = NULL
// - estado = true
// - deleted_at = NULL
```

### **4. Error de Conexión**
```javascript
// Verificar que el backend esté corriendo
// URL correcta: http://localhost:3000/api/v1/radios-tetra/disponibles
```

---

## 🔧 **Debugging Tips**

### **1. Verificar en Consola del Navegador**
```javascript
// En la pestaña Network, buscar la petición:
// GET /api/v1/radios-tetra/disponibles

// Verificar:
// - Status Code: 200 OK
// - Response: Contiene datos o array vacío
// - Headers: Authorization token presente
```

### **2. Probar con Postman/Insomnia**
```bash
# 1. Login para obtener token
POST http://localhost:3000/api/v1/auth/login
{
  "username_or_email": "admin",
  "password": "Admin123!"
}

# 2. Usar token para obtener radios
GET http://localhost:3000/api/v1/radios-tetra/disponibles
Headers:
Authorization: Bearer {token_obtenido}
```

### **3. Verificar Base de Datos**
```sql
-- Consultar radios disponibles
SELECT id, radio_tetra_code, descripcion, personal_seguridad_id, estado
FROM radios_tetra 
WHERE personal_seguridad_id IS NULL 
  AND estado = 1 
  AND deleted_at IS NULL
ORDER BY radio_tetra_code;
```

---

## 📋 **Checklist de Implementación**

- [ ] **Token de autenticación** configurado
- [ ] **Endpoint correcto**: `/api/v1/radios-tetra/disponibles`
- [ ] **Manejo de errores** 401, 403, 500
- [ ] **Loading states** durante la carga
- [ ] **Validación condicional** según origen_llamada
- [ ] **Limpiar campos** al cambiar origen
- [ ] **Feedback al usuario** (mensajes de error)
- [ ] **Retry button** para reintentar carga
- [ ] **Empty state** cuando no hay radios

---

## 🎯 **Resumen Rápido**

1. **Endpoint**: `GET /api/v1/radios-tetra/disponibles`
2. **Autenticación**: Requiere token válido
3. **Permisos**: `catalogos.radios_tetra.read`
4. **Respuesta**: Array de radios disponibles
5. **Condición**: Solo radios sin asignar y activos
6. **Uso**: Mostrar dropdown solo cuando `origen_llamada = 'RADIO_TETRA'`

**Con esta guía el dropdown debería funcionar correctamente y mostrar los radios TETRA disponibles.**
