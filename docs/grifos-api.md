# API Documentation - Grifos

## **📋 Overview**
API para búsqueda de grifos registrados en el sistema de abastecimientos de combustible.

**🔗 Base URL:** `http://localhost:3000/api/v1/grifos`

---

## **🔐 Autenticación**
Todos los endpoints requieren token JWT en el header:

```javascript
headers: {
  "Authorization": "Bearer <token_jwt>"
}
```

---

## **📊 Estructura de Respuestas**

### **✅ Respuesta Exitosa**
```json
{
  "success": true,
  "message": "Grifos obtenidos exitosamente",
  "data": {
    "grifos": [...],
    "total": 15
  }
}
```

### **❌ Respuesta de Error**
```json
{
  "success": false,
  "message": "Mensaje descriptivo del error",
  "error": "Error al obtener grifos"
}
```

---

## **🔌 Endpoints**

### **1. Listar Grifos**
```http
GET /grifos
```

**📝 Query Parameters (opcional):**
- `search` (string) - Buscar por nombre o RUC del grifo
- `limit` (number) - Límite de resultados (default: 100)

**📤 Response Body:**
```json
{
  "success": true,
  "message": "Grifos obtenidos exitosamente",
  "data": {
    "grifos": [
      {
        "grifo_nombre": "GRIFO CENTRAL",
        "grifo_ruc": "20123456789",
        "total_abastecimientos": 25,
        "tiene_ruc": true
      },
      {
        "grifo_nombre": "GRIFO SUR",
        "grifo_ruc": null,
        "total_abastecimientos": 18,
        "tiene_ruc": false
      }
    ],
    "total": 2
  }
}
```

**📋 Atributos del Grifo:**
- `grifo_nombre`: Nombre del grifo/estación (siempre en mayúsculas)
- `grifo_ruc`: RUC del grifo (puede ser null)
- `total_abastecimientos`: Cantidad de abastecimientos registrados
- `tiene_ruc`: Indica si tiene RUC registrado

**⚠️ Importante:** 
- Todos los nombres de grifos se guardan automáticamente en **MAYÚSCULAS**
- El backend convierte cualquier entrada a mayúsculas antes de guardar
- Las búsquedas son case-insensitive (se convierten a mayúsculas)

---

### **2. Sugerencias de Búsqueda**
```http
GET /grifos/sugerencias
```

**📝 Query Parameters:**
- `q` (string, requerido) - Término de búsqueda (mínimo 2 caracteres)
- `limit` (number) - Límite de sugerencias (default: 10)

**📤 Response Body:**
```json
{
  "success": true,
  "message": "Sugerencias obtenidas exitosamente",
  "data": {
    "sugerencias": [
      {
        "grifo_nombre": "GRIFO CENTRAL",
        "grifo_ruc": "20123456789",
        "tiene_ruc": true
      }
    ],
    "total": 1
  }
}
```

---

## **🎯 Ejemplos de Uso**

### **Listar todos los grifos**
```javascript
const response = await fetch('/api/v1/grifos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.grifos); // Array de grifos
```

### **Buscar grifos por nombre**
```javascript
const searchGrifos = async (termino) => {
  const params = new URLSearchParams({
    search: termino,
    limit: 20
  });

  const response = await fetch(`/api/v1/grifos?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// Ejemplo de uso
const resultado = await searchGrifos('CENTRAL');
```

### **Obtener sugerencias para autocompletar**
```javascript
const getSugerencias = async (input) => {
  if (input.length < 2) return { sugerencias: [] };

  const params = new URLSearchParams({
    q: input,
    limit: 5
  });

  const response = await fetch(`/api/v1/grifos/sugerencias?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// Ejemplo en componente React
const GrifoAutocomplete = () => {
  const [sugerencias, setSugerencias] = useState([]);
  const [input, setInput] = useState('');

  const handleInputChange = async (e) => {
    const valor = e.target.value;
    setInput(valor);

    if (valor.length >= 2) {
      const resultado = await getSugerencias(valor);
      setSugerencias(resultado.data.sugerencias);
    } else {
      setSugerencias([]);
    }
  };

  return (
    <div>
      <input 
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Buscar grifo..."
        list="grifos"
      />
      <datalist id="grifos">
        {sugerencias.map(grifo => (
          <option key={grifo.grifo_nombre} value={grifo.grifo_nombre}>
            {grifo.grifo_nombre} {grifo.grifo_ruc ? `(${grifo.grifo_ruc})` : ''}
          </option>
        ))}
      </datalist>
    </div>
  );
};
```

---

## **🎨 Componente React Completo**

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GrifoSelector = ({ onGrifoSelect, valorInicial }) => {
  const [grifos, setGrifos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(valorInicial || '');
  const [showDropdown, setShowDropdown] = useState(false);

  // Cargar grifos populares al montar
  useEffect(() => {
    cargarGrifosPopulares();
  }, []);

  const cargarGrifosPopulares = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/grifos?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setGrifos(response.data.data.grifos);
    } catch (error) {
      console.error('Error al cargar grifos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e) => {
    const valor = e.target.value;
    setInput(valor);

    if (valor.length >= 2) {
      try {
        const response = await axios.get(`/api/v1/grifos/sugerencias?q=${valor}&limit=5`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setSugerencias(response.data.data.sugerencias);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error al obtener sugerencias:', error);
      }
    } else {
      setSugerencias([]);
      setShowDropdown(false);
    }
  };

  const selectGrifo = (grifo) => {
    setInput(grifo.grifo_nombre);
    setShowDropdown(false);
    setSugerencias([]);
    if (onGrifoSelect) {
      onGrifoSelect(grifo);
    }
  };

  const grifosFiltrados = input.length >= 2 ? sugerencias : grifos;

  return (
    <div className="grifo-selector">
      <label className="form-label">Grifo / Estación</label>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => input.length >= 2 && setShowDropdown(true)}
          placeholder="Buscar o seleccionar grifo..."
          className="form-input"
        />
        {loading && <span className="loading">Cargando...</span>}
        
        {showDropdown && grifosFiltrados.length > 0 && (
          <div className="dropdown">
            {grifosFiltrados.map((grifo, index) => (
              <div
                key={index}
                className="dropdown-item"
                onClick={() => selectGrifo(grifo)}
              >
                <div className="grifo-nombre">{grifo.grifo_nombre}</div>
                {grifo.grifo_ruc && (
                  <div className="grifo-ruc">RUC: {grifo.grifo_ruc}</div>
                )}
                <div className="grifo-stats">
                  {grifo.total_abastecimientos} abastecimientos
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrifoSelector;
```

---

## **🎨 Estilos CSS**

```css
.grifo-selector {
  position: relative;
  margin-bottom: 1rem;
}

.input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.loading {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  color: #666;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.grifo-nombre {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.grifo-ruc {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.grifo-stats {
  font-size: 0.75rem;
  color: #999;
}
```

---

## **⚡ Tips de Implementación**

1. **🔄 Autenticación**: Siempre incluir token JWT
2. **🎯 Debouncing**: Implementar debouncing para búsquedas (300ms)
3. **📱 Responsive**: Asegurar que el dropdown funcione en móviles
4. **🎨 UX**: Mostrar loading states y manejar focus/blur
5. **🔍 Búsqueda**: Buscar por nombre y RUC simultáneamente
6. **📊 Estadísticas**: Usar `total_abastecimientos` para mostrar popularidad

---

## **🚨 Errores Comunes**

| Error | Causa | Solución |
|-------|--------|----------|
| `401 Unauthorized` | Token inválido o expirado | Renovar token |
| `404 Not Found` | Endpoint incorrecto | Verificar URL |
| `500 Internal Server` | Error en consulta SQL | Revisar logs del backend |

---

## **📈 Notas de Performance**

- Los endpoints usan `DISTINCT` y `GROUP BY` para optimizar consultas
- Índices en `grifo_nombre` y `grifo_ruc` para búsquedas rápidas
- Caché sugerido para grifos populares
- Paginación implementada con `limit` parameter

---

**Última actualización:** 2026-04-18
