# 📋 Guía para Frontend - Manejo de Errores de Validación

## 🎯 Problema: Frontend no puede acceder a los detalles del error

El frontend muestra solo "Errores de validación" pero no puede acceder al array `errors` con los detalles específicos.

---

## 🔍 **Estructura del Error del Backend**

### **Respuesta del Backend (Status 400):**
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    {
      "field": "latitud",
      "value": null,
      "message": "La latitud debe ser un número decimal",
      "location": "body"
    },
    {
      "field": "longitud", 
      "value": null,
      "message": "La longitud debe ser un número decimal",
      "location": "body"
    }
  ],
  "_meta": {
    "timestamp": "2026-01-23T23:36:01.025Z",
    "path": "/",
    "method": "POST"
  }
}
```

### **🔍 Problema Identificado:**

Según los logs del frontend:
```javascript
// ❌ Esto devuelve undefined
error.response?.data?.errors: undefined

// ❌ Esto también devuelve undefined  
error.response?.data: undefined
```

**El problema está en cómo el frontend accede a los datos del error de Axios.**

---

## 🛠️ **Solución para Frontend**

### **1. Acceso Correcto a los Datos del Error**

```javascript
// ✅ Forma correcta de acceder a los errores
const handleValidationError = (error) => {
  // Para errores de Axios
  if (error.response) {
    const errorData = error.response.data;
    
    console.log('🔍 Estructura completa del error:', errorData);
    console.log('🔍 Array de errores:', errorData.errors);
    
    return errorData.errors || [];
  }
  
  return [];
};
```

### **2. Servicio Actualizado (novedadesService.js)**

```javascript
// services/novedadesService.js
export const createNovedad = async (novedadData) => {
  try {
    const response = await axios.post('/novedades', novedadData);
    return response.data;
  } catch (error) {
    console.log('🔍 ERROR DEBUG - Estructura completa del error:', error);
    console.log('🔍 ERROR DEBUG - error.response:', error.response);
    console.log('🔍 ERROR DEBUG - error.response?.data:', error.response?.data);
    
    // 🔥 IMPORTANTE: Acceder correctamente a los datos del error
    if (error.response?.status === 400 && error.response?.data?.errors) {
      // Extraer errores específicos
      const validationErrors = error.response.data.errors;
      
      // Lanzar error con estructura personalizada
      const customError = new Error(error.response.data.message || 'Errores de validación');
      customError.validationErrors = validationErrors;
      customError.status = error.response.status;
      
      throw customError;
    }
    
    // Para otros errores, mantener comportamiento original
    throw error;
  }
};
```

### **3. Componente de Manejo de Errores**

```jsx
// components/ValidationErrorDisplay.jsx
import React from 'react';

const ValidationErrorDisplay = ({ error }) => {
  // 🔥 Verificar si el error tiene errores de validación
  const validationErrors = error?.validationErrors || [];
  
  if (validationErrors.length === 0) {
    return null;
  }

  return (
    <div className="alert alert-danger mt-3">
      <h6 className="alert-heading">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Errores de Validación
      </h6>
      
      <div className="error-list">
        {validationErrors.map((errorItem, index) => (
          <div key={index} className="error-item mb-2">
            <strong>Campo:</strong> {errorItem.field}<br/>
            <strong>Error:</strong> {errorItem.message}<br/>
            {errorItem.value !== null && (
              <small className="text-muted">
                Valor actual: {errorItem.value}
              </small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValidationErrorDisplay;
```

### **4. Uso en el Componente Principal**

```jsx
// pages/novedades/NovedadesPage.jsx
import ValidationErrorDisplay from '../components/ValidationErrorDisplay';

const NovedadesPage = () => {
  const [error, setError] = useState(null);

  const handleSaveRegistro = async () => {
    try {
      setError(null); // Limpiar errores anteriores
      await createNovedad(novedadPayload);
      // ... manejar éxito
    } catch (err) {
      console.log('🔍 ERROR DEBUG - error capturado:', err);
      
      // 🔥 Guardar el error completo para mostrarlo
      setError(err);
    }
  };

  return (
    <div>
      {/* ... resto del formulario */}
      
      {/* 🔥 Mostrar errores de validación específicos */}
      {error && (
        <ValidationErrorDisplay 
          error={error} 
        />
      )}
      
      {/* Mostrar error genérico si no es de validación */}
      {error && !error.validationErrors && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error.message}
        </div>
      )}
    </div>
  );
};
```

---

## 🔧 **Debugging Tips para Frontend**

### **1. Console.log Estratégico**

```javascript
catch (error) {
  console.log('🔍 Tipo de error:', error.constructor.name);
  console.log('🔍 Es AxiosError?', error.isAxiosError);
  console.log('🔍 Status:', error.response?.status);
  console.log('🔍 Data:', error.response?.data);
  console.log('🔍 Errors:', error.response?.data?.errors);
  console.log('🔍 String completo:', JSON.stringify(error.response?.data, null, 2));
}
```

### **2. Verificar Estructura del Error**

```javascript
// Función helper para debug
const debugError = (error) => {
  if (error.response) {
    // El servidor respondió con un status fuera del rango 2xx
    console.log('Response Data:', error.response.data);
    console.log('Response Status:', error.response.status);
    console.log('Response Headers:', error.response.headers);
  } else if (error.request) {
    // La solicitud fue hecha pero no se recibió respuesta
    console.log('Request:', error.request);
  } else {
    // Algo pasó al configurar la solicitud
    console.log('Error Message:', error.message);
  }
};
```

---

## 🎯 **Ejemplo Completo de Implementación**

### **Service con Manejo Mejorado**

```javascript
// services/novedadesService.js
export const createNovedad = async (novedadData) => {
  try {
    const response = await axios.post('/novedades', novedadData);
    return response.data;
  } catch (error) {
    // Debug completo
    console.log('🔍 Error completo:', error);
    console.log('🔍 Response data:', error.response?.data);
    
    // Manejo específico para errores de validación
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      
      // Verificar si tiene estructura de errores de validación
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const validationError = new Error(errorData.message || 'Errores de validación');
        validationError.validationErrors = errorData.errors;
        validationError.status = 400;
        validationError.isValidationError = true;
        
        throw validationError;
      }
    }
    
    // Para otros errores, lanzar error original
    throw error;
  }
};
```

### **Componente con Manejo Completo**

```jsx
const NovedadesPage = () => {
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSaveRegistro = async () => {
    try {
      setError(null);
      setFieldErrors({});
      await createNovedad(novedadPayload);
      showSuccessToast('Novedad creada exitosamente');
    } catch (err) {
      console.log('🔍 Error capturado:', err);
      
      if (err.isValidationError && err.validationErrors) {
        // Mapear errores a campos específicos
        const errorsByField = {};
        err.validationErrors.forEach(errorItem => {
          errorsByField[errorItem.field] = errorItem.message;
        });
        
        setFieldErrors(errorsByField);
        setError(err);
      } else {
        // Error genérico
        setError(err);
      }
    }
  };

  return (
    <form>
      {/* Campo Latitud */}
      <div className="form-group">
        <label>Latitud:</label>
        <input 
          type="number" 
          step="any"
          className={`form-control ${fieldErrors.latitud ? 'is-invalid' : ''}`}
          value={formData.latitud}
          onChange={(e) => setFormData({...formData, latitud: e.target.value})}
        />
        {fieldErrors.latitud && (
          <div className="invalid-feedback">
            {fieldErrors.latitud}
          </div>
        )}
      </div>

      {/* Campo Longitud */}
      <div className="form-group">
        <label>Longitud:</label>
        <input 
          type="number" 
          step="any"
          className={`form-control ${fieldErrors.longitud ? 'is-invalid' : ''}`}
          value={formData.longitud}
          onChange={(e) => setFormData({...formData, longitud: e.target.value})}
        />
        {fieldErrors.longitud && (
          <div className="invalid-feedback">
            {fieldErrors.longitud}
          </div>
        )}
      </div>

      {/* Mostrar todos los errores si existen */}
      {error && error.validationErrors && (
        <ValidationErrorDisplay error={error} />
      )}
    </form>
  );
};
```

---

## 📋 **Checklist de Implementación**

- [ ] **Acceder correctamente** a `error.response.data.errors`
- [ ] **Crear error personalizado** con `validationErrors` property
- [ ] **Componente ValidationErrorDisplay** para mostrar errores
- [ ] **Mapear errores a campos específicos** con `fieldErrors`
- [ ] **Debugging console.log** para verificar estructura
- [ ] **Manejo de estados** para limpiar errores al reintentar
- [ ] **Feedback visual** con clases CSS (is-invalid)
- [ ] **Mensajes específicos** por cada campo

---

## 🎯 **Resumen Rápido**

1. **El problema**: `error.response?.data?.errors` devuelve `undefined`
2. **La causa**: Acceso incorrecto a la estructura del error de Axios
3. **La solución**: 
   - Acceder via `error.response.data.errors` (sin el `?` extra)
   - Crear error personalizado con propiedad `validationErrors`
   - Mostrar errores específicos en cada campo
4. **Resultado**: Mensajes de error específicos como "La latitud debe ser un número decimal"

**Con esta guía el frontend podrá mostrar los errores de validación específicos en lugar del mensaje genérico "Errores de validación".**
