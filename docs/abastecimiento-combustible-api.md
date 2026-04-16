# API Documentation - Abastecimiento Combustible

## **📋 Overview**
API RESTful para la gestión de abastecimientos de combustible del sistema CitySecure.

**🔗 Base URL:** `http://localhost:3000/api/v1/abastecimientos`

---

## **🔐 Autenticación**
Todos los endpoints requieren token JWT en el header:

```javascript
headers: {
  "Authorization": "Bearer <token_jwt>"
}
```

**🔑 Login:**
```http
POST /auth/login
Content-Type: application/json

{
  "username_or_email": "admin",
  "password": "Admin123!"
}
```

---

## **📊 Estructura de Respuestas**

### **✅ Respuesta Exitosa**
```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {
    // Datos del recurso
  },
  "pagination": {  // Solo en listados
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### **❌ Respuesta de Error**
```json
{
  "success": false,
  "message": "Mensaje descriptivo del error",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detalles adicionales si aplica"
  },
  "errors": [  // Solo en errores de validación
    {
      "field": "campo_afectado",
      "message": "Mensaje específico del campo",
      "value": "valor_enviado"
    }
  ]
}
```

---

## **🔌 Endpoints**

### **1. Listar Abastecimientos**
```http
GET /abastecimientos
```

**📝 Query Parameters (opcional):**
- `vehiculo_id` (number) - Filtrar por vehículo
- `personal_id` (number) - Filtrar por personal
- `fecha_inicio` (date) - Fecha inicial (YYYY-MM-DD)
- `fecha_fin` (date) - Fecha final (YYYY-MM-DD)
- `page` (number) - Número de página (default: 1)
- `limit` (number) - Límite por página (default: 20)

---

### **🎯 Guía para Frontend: Consumo por Rangos de Fechas**

#### **⚠️ Importante: Timezone America/Lima**
El backend está configurado para trabajar con timezone **America/Lima (UTC-5)**. 
Las fechas se procesan automáticamente considerando la hora local de Perú.

#### **📅 Ejemplos de Consumo por Rangos de Fechas**

**1. 🔍 Búsqueda por Rango Específico**
```javascript
// Ejemplo: Buscar abastecimientos del 15 de abril de 2026
const params = new URLSearchParams({
  vehiculo_id: 38,
  fecha_inicio: '2026-04-15',
  fecha_fin: '2026-04-15',
  limit: 50
});

const response = await fetch(`/api/v1/abastecimientos?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Abastecimientos encontrados:', data.data.abastecimientos);
```

**2. 📊 Búsqueda por Semana Actual**
```javascript
// Función para obtener rango de la semana actual
const getRangoSemanaActual = () => {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Inicio de la semana (domingo)
  
  return {
    fecha_inicio: inicioSemana.toISOString().split('T')[0],
    fecha_fin: hoy.toISOString().split('T')[0]
  };
};

const rango = getRangoSemanaActual();
const params = new URLSearchParams({
  vehiculo_id: 38,
  ...rango,
  limit: 100
});
```

**3. 📈 Búsqueda por Últimos 30 Días**
```javascript
const getUltimos30Dias = () => {
  const hoy = new Date();
  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hoy.getDate() - 30);
  
  return {
    fecha_inicio: hace30Dias.toISOString().split('T')[0],
    fecha_fin: hoy.toISOString().split('T')[0]
  };
};

const rango = getUltimos30Dias();
const params = new URLSearchParams({
  vehiculo_id: 38,
  ...rango,
  limit: 200
});
```

**4. 🎯 Búsqueda por Mes Específico**
```javascript
const getRangoMes = (anio, mes) => {
  // mes: 1-12 (enero-diciembre)
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0); // Último día del mes
  
  return {
    fecha_inicio: primerDia.toISOString().split('T')[0],
    fecha_fin: ultimoDia.toISOString().split('T')[0]
  };
};

// Ejemplo: Abril 2026
const rangoAbril = getRangoMes(2026, 4);
const params = new URLSearchParams({
  vehiculo_id: 38,
  ...rangoAbril,
  limit: 200
});
```

**5. 🔧 Búsqueda Sin Filtro de Fechas (Todos los Registros)**
```javascript
// Para obtener todos los registros sin filtro de fecha
const params = new URLSearchParams({
  vehiculo_id: 38,
  limit: 500 // Aumentar límite para obtener más registros
});

const response = await fetch(`/api/v1/abastecimientos?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### **🎨 Componente React Ejemplo con Rangos de Fechas**

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AbastecimientoList = ({ vehiculoId }) => {
  const [abastecimientos, setAbastecimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rangoFechas, setRangoFechas] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  });

  // Opciones predefinidas de rangos
  const rangosPredefinidos = {
    hoy: () => {
      const hoy = new Date().toISOString().split('T')[0];
      return { fecha_inicio: hoy, fecha_fin: hoy };
    },
    ultimaSemana: () => {
      const hoy = new Date();
      const haceUnaSemana = new Date(hoy);
      haceUnaSemana.setDate(hoy.getDate() - 7);
      return {
        fecha_inicio: haceUnaSemana.toISOString().split('T')[0],
        fecha_fin: hoy.toISOString().split('T')[0]
      };
    },
    ultimoMes: () => {
      const hoy = new Date();
      const haceUnMes = new Date(hoy);
      haceUnMes.setMonth(hoy.getMonth() - 1);
      return {
        fecha_inicio: haceUnMes.toISOString().split('T')[0],
        fecha_fin: hoy.toISOString().split('T')[0]
      };
    }
  };

  const cargarAbastecimientos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        vehiculo_id: vehiculoId,
        ...rangoFechas,
        limit: 100
      });

      const response = await axios.get(`/api/v1/abastecimientos?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setAbastecimientos(response.data.data.abastecimientos);
    } catch (error) {
      console.error('Error al cargar abastecimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehiculoId) {
      // Por defecto cargar última semana
      setRangoFechas(rangosPredefinidos.ultimaSemana());
    }
  }, [vehiculoId]);

  useEffect(() => {
    if (rangoFechas.fecha_inicio && rangoFechas.fecha_fin) {
      cargarAbastecimientos();
    }
  }, [rangoFechas]);

  return (
    <div>
      <div className="filtros-fechas">
        <h3>Filtrar por Rango de Fechas</h3>
        
        <div className="botones-rapidos">
          <button onClick={() => setRangoFechas(rangosPredefinidos.hoy())}>
            Hoy
          </button>
          <button onClick={() => setRangoFechas(rangosPredefinidos.ultimaSemana())}>
            Última Semana
          </button>
          <button onClick={() => setRangoFechas(rangosPredefinidos.ultimoMes())}>
            Último Mes
          </button>
        </div>

        <div className="fechas-manual">
          <input
            type="date"
            value={rangoFechas.fecha_inicio}
            onChange={(e) => setRangoFechas(prev => ({
              ...prev,
              fecha_inicio: e.target.value
            }))}
            placeholder="Fecha inicio"
          />
          <input
            type="date"
            value={rangoFechas.fecha_fin}
            onChange={(e) => setRangoFechas(prev => ({
              ...prev,
              fecha_fin: e.target.value
            }))}
            placeholder="Fecha fin"
          />
          <button onClick={cargarAbastecimientos}>
            Buscar
          </button>
        </div>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="resultados">
          <h3>Resultados ({abastecimientos.length} registros)</h3>
          {/* Aquí tu tabla o lista de resultados */}
        </div>
      )}
    </div>
  );
};

export default AbastecimientoList;
```

#### **⚡ Tips para Frontend**

1. **🔄 Actualización Automática**: Usa `useEffect` para recargar cuando cambien las fechas
2. **📅 Formato de Fechas**: Siempre usa `YYYY-MM-DD` para los parámetros
3. **🎯 Rangos Predefinidos**: Implementa botones rápidos para rangos comunes
4. **📊 Paginación**: Maneja el parámetro `limit` para evitar timeouts
5. **⏰ Timezone**: No necesitas convertir horas, el backend lo maneja automáticamente
6. **🔍 Búsqueda Flexible**: Puedes usar solo `fecha_inicio` o solo `fecha_fin`

#### **🚨 Errores Comunes y Soluciones**

| Error | Causa | Solución |
|-------|-------|----------|
| `abastecimientos: []` | Rango de fechas sin registros | Amplía el rango o verifica fechas |
| `Maximum update depth exceeded` | Loop en useEffect | Agrega dependencias correctas en useEffect |
| `400 Bad Request` | Formato de fecha inválido | Usa formato `YYYY-MM-DD` |
| `401 Unauthorized` | Token inválido o expirado | Renueva el token JWT |
| `500 Internal Server Error` | `Incorrect DATETIME value: 'Invalid date'` | Formato de fecha con hora incorrecto |

#### **# Troubleshooting para Frontend**

**Si recibes este error:**
```
Error: "Incorrect DATETIME value: 'Invalid date'"
Status: 500 Internal Server Error
```

**El backend ahora acepta ambos formatos:**
```javascript
// Opción 1: Solo fecha (recomendado)
const filtros = {
  fecha_inicio: '2026-04-15',
  fecha_fin: '2026-04-15',
  vehiculo_id: 38
};

// Opción 2: Con hora (el backend lo manejará)
const filtros = {
  fecha_inicio: '2026-04-15T00:00:00',
  fecha_fin: '2026-04-15T23:59:59',
  vehiculo_id: 38
};
```

**Para el frontend - Corrección recomendada:**
```javascript
// En tu servicio o componente
const formatFechaForBackend = (fecha) => {
  // Si ya viene con hora, devolverla tal cual
  if (fecha.includes('T')) {
    return fecha;
  }
  // Si es solo fecha, devolverla tal cual
  return fecha;
};

// O mejor aún, usar solo fechas sin hora
const getFiltros = () => ({
  vehiculo_id: vehicleId,
  fecha_inicio: '2026-04-15', // Solo fecha
  fecha_fin: '2026-04-15'     // Solo fecha
});
```

**Validación en frontend:**
```javascript
const validarFechas = (fecha_inicio, fecha_fin) => {
  // Formatos válidos
  const formatosValidos = [
    /^\d{4}-\d{2}-\d{2}$/,                    // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/  // YYYY-MM-DDTHH:mm:ss
  ];
  
  const esValido = (fecha) => {
    return formatosValidos.some(formato => formato.test(fecha));
  };
  
  if (fecha_inicio && !esValido(fecha_inicio)) {
    throw new Error('Formato de fecha_inicio inválido');
  }
  
  if (fecha_fin && !esValido(fecha_fin)) {
    throw new Error('Formato de fecha_fin inválido');
  }
};
```

**Atributos de Vehículo:**
- `id`: ID del vehículo
- `codigo_vehiculo`: Código interno
- `placa`: Placa del vehículo
- `marca`: Marca del vehículo
- `modelo_vehiculo`: Modelo del vehículo
- `anio_vehiculo`: Año del vehículo
- `color_vehiculo`: Color del vehículo
- `estado_operativo`: Estado operativo (DISPONIBLE, EN_SERVICIO, MANTENIMIENTO, etc.)
- `kilometraje_actual`: Kilometraje actual del vehículo
- `tipo_vehiculo`: Objeto con información del tipo de vehículo
  - `id`: ID del tipo
  - `nombre`: Nombre del tipo (Patrullero, Motocicleta, Ambulancia, etc.)
  - `descripcion`: Descripción del tipo
  - `prefijo`: Prefijo del tipo

**Atributos de Personal:**
- `id`: ID del personal
- `doc_tipo`: Tipo de documento (DNI, Carnet Extranjeria, Pasaporte, PTP)
- `doc_numero`: Número de documento
- `nombres`: Nombres del personal
- `apellido_paterno`: Apellido paterno
- `apellido_materno`: Apellido materno
- `status`: Estado laboral (Activo, Inactivo, Suspendido, Retirado)

**Nombre Completo del Personal:**
Para facilitar el frontend, puede construir el nombre completo como:
```javascript
const nombreCompleto = `${personal.apellido_paterno} ${personal.apellido_materno} ${personal.nombres}`;
```

**Documento Completo del Personal:**
Para facilitar el frontend, puede construir el documento completo como:
```javascript
const documentoCompleto = `${personal.doc_tipo} ${personal.doc_numero}`;
```

**📤 Ejemplo:**
```javascript
GET /abastecimientos?vehiculo_id=1&fecha_inicio=2026-04-01&limit=10
```

**📥 Respuesta:**
```json
{
  "success": true,
  "message": "Abastecimientos obtenidos correctamente",
  "data": [
    {
      "id": 1,
      "vehiculo_id": 1,
      "personal_id": 8,
      "fecha_hora": "2026-04-14T12:00:00.000Z",
      "tipo_combustible": "GASOLINA_REGULAR",
      "km_actual": 15000.50,
      "cantidad": 45.50,
      "unidad": "LITROS",
      "precio_unitario": 18.50,
      "importe_total": 841.75,
      "grifo_nombre": "GRIFO REPSOL",
      "grifo_ruc": "20100070270",
      "factura_boleta": "F001-123456",
      "moneda": "PEN",
      "observaciones": "Abastecimiento de prueba",
      "comprobante_adjunto": null,
      "estado": 1,
      "created_at": "2026-04-14T17:00:00.000Z",
      "updated_at": "2026-04-14T17:00:00.000Z",
      "vehiculo": {
        "id": 1,
        "codigo_vehiculo": "M001",
        "placa": "ABC-123",
        "marca": "TOYOTA",
        "modelo_vehiculo": "HILUX",
        "anio_vehiculo": 2022,
        "color_vehiculo": "Blanco",
        "estado_operativo": "DISPONIBLE",
        "kilometraje_actual": 15500,
        "tipo_vehiculo": {
          "id": 1,
          "nombre": "Patrullero",
          "descripcion": "Vehículo móvil para patrullaje urbano",
          "prefijo": "M"
        }
      },
      "personal": {
        "id": 8,
        "doc_tipo": "DNI",
        "doc_numero": "12345678",
        "nombres": "Juan Carlos",
        "apellido_paterno": "Pérez",
        "apellido_materno": "López",
        "status": "Activo"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### **2. Obtener Abastecimiento por ID**
```http
GET /abastecimientos/{id}
```

**📥 Respuesta:**
```json
{
  "success": true,
  "message": "Abastecimiento obtenido correctamente",
  "data": {
    // Mismo objeto que en listado
  }
}
```

---

### **3. Crear Abastecimiento**
```http
POST /abastecimientos
Content-Type: application/json
```

**📤 Request Body:**
```json
{
  "vehiculo_id": 1,
  "fecha_hora": "2026-04-14T12:00:00.000Z",
  "tipo_combustible": "GASOLINA_REGULAR",
  "km_actual": 15000.50,
  "cantidad": 45.50,
  "precio_unitario": 18.50,
  "importe_total": 841.75,
  "grifo_nombre": "GRIFO REPSOL",
  "grifo_ruc": "20100070270",
  "factura_boleta": "F001-123456",
  "moneda": "PEN",
  "observaciones": "Abastecimiento de prueba",
  "comprobante_adjunto": null
}
```

**📥 Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Abastecimiento creado correctamente",
  "data": {
    // Objeto creado con ID asignado
  }
}
```

---

### **4. Actualizar Abastecimiento**
```http
PUT /abastecimientos/{id}
Content-Type: application/json
```

**📤 Request Body (parcial):**
```json
{
  "km_actual": 15500.75,
  "cantidad": 50.00,
  "precio_unitario": 19.00,
  "importe_total": 950.00,
  "observaciones": "Actualización de prueba"
}
```

**📥 Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Abastecimiento actualizado correctamente",
  "data": {
    // Objeto actualizado
  }
}
```

---

### **5. Eliminar Abastecimiento (Soft Delete)**
```http
DELETE /abastecimientos/{id}
```

**📥 Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Abastecimiento eliminado correctamente",
  "data": {
    "id": 1,
    "deleted_at": "2026-04-14T17:30:00.000Z",
    "deleted_by": 1
  }
}
```

---

## **🔍 Tipos de Combustible Disponibles**
```javascript
const TIPOS_COMBUSTIBLE = [
  "GASOLINA_REGULAR",
  "GASOLINA_PREMIUM", 
  "GASOHOL_REGULAR",
  "GASOHOL_PREMIUM",
  "DIESEL_B2",
  "DIESEL_B5",
  "DIESEL_S50",
  "GLP",
  "GNV"
];
```

---

## **⚠️ Códigos de Error Comunes**

### **🔐 Errores de Autenticación**
```json
{
  "success": false,
  "message": "No se proporcionó un token de autenticación",
  "error": {
    "code": "NO_TOKEN"
  }
}
```

```json
{
  "success": false,
  "message": "Token inválido o expirado",
  "error": {
    "code": "INVALID_TOKEN"
  }
}
```

### **📝 Errores de Validación (400)**
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    {
      "field": "vehiculo_id",
      "message": "El vehículo es requerido",
      "value": null
    },
    {
      "field": "km_actual", 
      "message": "El kilometraje debe ser mayor o igual a 0",
      "value": -100
    }
  ]
}
```

### **🔍 Errores de Recurso (404)**
```json
{
  "success": false,
  "message": "Abastecimiento no encontrado",
  "error": {
    "code": "NOT_FOUND",
    "details": "No existe un abastecimiento con el ID proporcionado"
  }
}
```

### **🚫 Errores de Permiso (403)**
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción",
  "error": {
    "code": "FORBIDDEN"
  }
}
```

### **💥 Errores del Servidor (500)**
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": "Error al procesar la solicitud"
  }
}
```

---

## **🎯 Mejores Prácticas para Frontend**

### **🔄 Manejo de Errores**
```javascript
try {
  const response = await api.get('/abastecimientos');
  
  if (!response.data.success) {
    // Manejar errores de negocio
    throw new Error(response.data.message);
  }
  
  return response.data.data;
} catch (error) {
  if (error.response) {
    // Error de API (4xx, 5xx)
    const { status, data } = error.response;
    
    if (status === 400 && data.errors) {
      // Errores de validación - mostrar por campo
      data.errors.forEach(err => {
        console.error(`${err.field}: ${err.message}`);
      });
    } else {
      // Otros errores - mostrar mensaje general
      console.error(data.message);
    }
  } else {
    // Error de red o configuración
    console.error('Error de conexión:', error.message);
  }
}
```

### **📊 Paginación**
```javascript
const fetchAbastecimientos = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...filters
  });
  
  const response = await api.get(`/abastecimientos?${params}`);
  
  return {
    data: response.data.data,
    pagination: response.data.pagination,
    hasMore: response.data.pagination.page < response.data.pagination.totalPages
  };
};
```

### **🔐 Refresh Token**
```javascript
// Interceptor para manejar refresh automático de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Refrescar token
      const newToken = await refreshAuthToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);
```

---

## **📝 Ejemplo Completo de Implementación**

### **React Hook para Abastecimientos**
```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useAbastecimientos = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchAbastecimientos = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/abastecimientos', { params: filters });
      
      if (response.data.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const createAbastecimiento = async (formData) => {
    try {
      const response = await api.post('/abastecimientos', formData);
      
      if (response.data.success) {
        await fetchAbastecimientos(); // Refrescar lista
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Error al crear abastecimiento' 
      };
    }
  };

  useEffect(() => {
    fetchAbastecimientos();
  }, []);

  return {
    data,
    loading,
    error,
    pagination,
    fetchAbastecimientos,
    createAbastecimiento
  };
};
```

---

**📞 Soporte:**
- Para cualquier duda sobre la API, contactar al equipo de backend
- Revisar logs del servidor para errores detallados
- Usar Postman collection para pruebas manuales
