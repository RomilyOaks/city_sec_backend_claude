# 📡 Guía de Endpoints Frontend - Reportes Operativos

## 🎯 **Referencia Rápida de Endpoints para Desarrolladores Frontend**

---

## 📊 **Dashboard Reportes**

### **Principal - KPIs y Métricas**
```http
GET /api/v1/reportes-operativos/dashboard
Authorization: Bearer <token>
```

**Query Parameters (Opcional):**
```javascript
{
  fecha_inicio?: "2026-04-19",    // YYYY-MM-DD
  fecha_fin?: "2026-04-27",      // YYYY-MM-DD
  turno?: "MAÑANA|TARDE|NOCHE",
  sector_id?: 123,
  estado_novedad?: 0|1,
  prioridad?: "BAJA|MEDIA|ALTA|CRÍTICA",
  tipo_novedad_id?: 456,
  include_deleted?: false
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Dashboard operativos generado exitosamente",
  "data": {
    "kpis_principales": {
      "total_novedades": 20,
      "novedades_atendidas": 19,
      "novedades_no_atendidas": 1,
      "tasa_atencion_general": "95.00",
      "distribucion_tipo": {
        "vehiculares": { "cantidad": 13, "porcentaje": "65.00" },
        "pie": { "cantidad": 6, "porcentaje": "30.00" },
        "no_atendidas": { "cantidad": 1, "porcentaje": "5.00" }
      }
    },
    "metricas_rendimiento": {
      "tiempo_promedio_respuesta": 14,
      "novedades_atendidas_a_tiempo": 11,
      "novedades_atendidas_fuera_tiempo": 3,
      "eficiencia_operativa": "95.00"
    },
    "analisis_turnos": [
      { "turno": "MAÑANA", "cantidad": 6, "porcentaje": 31.58 },
      { "turno": "TARDE", "cantidad": 11, "porcentaje": 57.89 },
      { "turno": "NOCHE", "cantidad": 2, "porcentaje": 10.53 }
    ],
    "analisis_prioridad": [
      { "prioridad": "ALTA", "cantidad": 14, "porcentaje": 70 },
      { "prioridad": "MEDIA", "cantidad": 3, "porcentaje": 15 },
      { "prioridad": "BAJA", "cantidad": 2, "porcentaje": 10 },
      { "prioridad": "SIN_PRIORIDAD", "cantidad": 1, "porcentaje": 5 }
    ],
    "tendencias": [
      { "fecha": "2026-04-19", "cantidad": 6, "tipo": "COMBINADO" },
      { "fecha": "2026-04-20", "cantidad": 0, "tipo": "COMBINADO" }
    ]
  }
}
```

---

## 🚗 **Operativos Vehiculares**

### **Listado Completo**
```http
GET /api/v1/reportes-operativos/vehiculares
Authorization: Bearer <token>
```

**Query Parameters:**
```javascript
{
  fecha_inicio?: "2026-04-19",
  fecha_fin?: "2026-04-27",
  turno?: "MAÑANA|TARDE|NOCHE",
  sector_id?: 123,
  vehiculo_id?: 456,
  conductor_id?: 789,
  estado_novedad?: 0|1,
  prioridad?: "BAJA|MEDIA|ALTA|CRÍTICA",
  tipo_novedad_id?: 101,
  page?: 1,
  limit?: 50,
  sort?: "fecha_hora_ocurrencia",
  order?: "DESC",
  include_deleted?: false
}
```

**Respuesta Paginada:**
```json
{
  "success": true,
  "message": "Operativos vehiculares obtenidos exitosamente",
  "data": {
    "operativos": [
      {
        "id": 123,
        "fecha_hora_ocurrencia": "2026-04-19T14:30:00.000Z",
        "turno": "TARDE",
        "vehiculo": {
          "id": 456,
          "placa": "ABC-123",
          "tipo_vehiculo": "PATRULLA"
        },
        "conductor": {
          "id": 789,
          "nombre": "Juan Pérez",
          "cargo": "OFICIAL"
        },
        "sector": {
          "id": 101,
          "nombre": "CENTRO",
          "sector_code": "SEC-001"
        },
        "novedad": {
          "id": 202,
          "tipo_novedad": "ROBO",
          "prioridad_actual": "ALTA",
          "tiempo_respuesta_min_operativo": 12
        }
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters_applied": {
      "fecha_inicio": "2026-04-19",
      "fecha_fin": "2026-04-27",
      "turno": "TARDE"
    }
  }
}
```

### **Resumen Estadístico**
```http
GET /api/v1/reportes-operativos/vehiculares/resumen
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_operativos": 150,
    "total_novedades": 145,
    "promedio_tiempo_respuesta": 14.5,
    "eficiencia_general": "92.5",
    "distribucion_turnos": [
      { "turno": "MAÑANA", "cantidad": 45, "porcentaje": 30.0 },
      { "turno": "TARDE", "cantidad": 80, "porcentaje": 53.3 },
      { "turno": "NOCHE", "cantidad": 25, "porcentaje": 16.7 }
    ],
    "distribucion_prioridades": [
      { "prioridad": "ALTA", "cantidad": 60, "porcentaje": 40.0 },
      { "prioridad": "MEDIA", "cantidad": 50, "porcentaje": 33.3 },
      { "prioridad": "BAJA", "cantidad": 35, "porcentaje": 23.3 }
    ],
    "top_vehiculos": [
      { "vehiculo_id": 456, "placa": "ABC-123", "total_operativos": 25 },
      { "vehiculo_id": 789, "placa": "XYZ-789", "total_operativos": 20 }
    ]
  }
}
```

### **Exportación (XLS/CSV)**
```http
GET /api/v1/reportes-operativos/vehiculares/exportar
Authorization: Bearer <token>
```

**Query Parameters:**
```javascript
{
  // Mismos filtros que el listado
  formato?: "excel|csv",  // Default: "excel"
  // ... otros filtros
}
```

**Response:**
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel)
- **Content-Type:** `text/csv` (CSV)
- **Content-Disposition:** `attachment; filename="operativos-vehiculares-2026-04-27.xlsx"`

---

## 🚶 **Operativos a Pie**

### **Listado Completo**
```http
GET /api/v1/reportes-operativos/pie
Authorization: Bearer <token>
```

**Query Parameters:**
```javascript
{
  fecha_inicio?: "2026-04-19",
  fecha_fin?: "2026-04-27",
  turno?: "MAÑANA|TARDE|NOCHE",
  sector_id?: 123,
  personal_id?: 456,
  cuadrante_id?: 789,
  estado_novedad?: 0|1,
  prioridad?: "BAJA|MEDIA|ALTA|CRÍTICA",
  tipo_novedad_id?: 101,
  page?: 1,
  limit?: 50,
  sort?: "fecha_hora_ocurrencia",
  order?: "DESC",
  include_deleted?: false
}
```

**Respuesta (Estructura similar a vehiculares):**
```json
{
  "success": true,
  "data": {
    "operativos": [
      {
        "id": 124,
        "fecha_hora_ocurrencia": "2026-04-19T15:45:00.000Z",
        "turno": "TARDE",
        "personal_asignado": {
          "id": 456,
          "nombre": "María García",
          "cargo": "SERENO"
        },
        "supervisor": {
          "id": 789,
          "nombre": "Carlos López",
          "cargo": "SUPERVISOR"
        },
        "cuadrante": {
          "id": 303,
          "nombre": "CUADRANTE NORTE",
          "codigo": "C-001"
        },
        "sector": {
          "id": 101,
          "nombre": "CENTRO",
          "sector_code": "SEC-001"
        },
        "novedad": {
          "id": 203,
          "tipo_novedad": "VANDALISMO",
          "prioridad_actual": "MEDIA",
          "tiempo_respuesta_min_operativo": 8
        }
      }
    ],
    "pagination": { /* ... */ },
    "filters_applied": { /* ... */ }
  }
}
```

### **Resumen Estadístico**
```http
GET /api/v1/reportes-operativos/pie/resumen
Authorization: Bearer <token>
```

### **Exportación (XLS/CSV)**
```http
GET /api/v1/reportes-operativos/pie/exportar
Authorization: Bearer <token>
```

---

## ⚠️ **Novedades no Atendidas**

### **Listado Completo**
```http
GET /api/v1/reportes-operativos/no-atendidas
Authorization: Bearer <token>
```

**Query Parameters:**
```javascript
{
  fecha_inicio?: "2026-04-19",
  fecha_fin?: "2026-04-27",
  tipo_novedad_id?: 101,
  prioridad?: "BAJA|MEDIA|ALTA|CRÍTICA",
  page?: 1,
  limit?: 50,
  sort?: "fecha_hora_ocurrencia",
  order?: "DESC",
  include_deleted?: false
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "novedades": [
      {
        "id": 305,
        "fecha_hora_ocurrencia": "2026-04-19T16:20:00.000Z",
        "fecha_hora_registro": "2026-04-19T16:25:00.000Z",
        "ubicacion": "Av. Principal #123",
        "tipo_novedad": {
          "id": 101,
          "nombre": "ASALTO",
          "categoria": "DELITO"
        },
        "prioridad_actual": "ALTA",
        "reportante": {
          "nombre": "Ciudadano Anónimo",
          "telefono": "999-888-777"
        },
        "descripcion": "Asalto a mano armada",
        "tiempo_espera_minutos": 45,
        "estado_actual": "PENDIENTE_ASIGNACION"
      }
    ],
    "pagination": { /* ... */ },
    "filters_applied": { /* ... */ }
  }
}
```

### **Resumen Estadístico**
```http
GET /api/v1/reportes-operativos/no-atendidas/resumen
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_novedades_no_atendidas": 25,
    "tiempo_promedio_espera": 35.5,
    "prioridades_criticas": 8,
    "distribucion_tipo_novedad": [
      { "tipo_novedad": "ASALTO", "cantidad": 10, "porcentaje": 40.0 },
      { "tipo_novedad": "ROBO", "cantidad": 8, "porcentaje": 32.0 },
      { "tipo_novedad": "VANDALISMO", "cantidad": 7, "porcentaje": 28.0 }
    ],
    "horas_pico_no_atencion": [
      { "hora": "14:00", "cantidad": 5 },
      { "hora": "18:00", "cantidad": 4 },
      { "hora": "22:00", "cantidad": 3 }
    ]
  }
}
```

### **Exportación (XLS/CSV)**
```http
GET /api/v1/reportes-operativos/no-atendidas/exportar
Authorization: Bearer <token>
```

---

## 🔄 **Reportes Combinados**

### **Datos Completos**
```http
GET /api/v1/reportes-operativos/combinados
Authorization: Bearer <token>
```

### **Exportación de Datos Combinados**
```http
GET /api/v1/reportes-operativos/combinados/exportar
Authorization: Bearer <token>
```

**Query Parameters Adicionales:**
```javascript
{
  formato?: "excel|csv",     // Default: "excel"
  limit?: 1000,              // Límite de registros
  // ... mismos filtros que el endpoint principal
}
```

**Respuesta (Integra todos los módulos):**
```json
{
  "success": true,
  "data": {
    "vehiculares": { /* Datos de operativos vehiculares */ },
    "pie": { /* Datos de operativos a pie */ },
    "no_atendidas": { /* Datos de novedades no atendidas */ },
    "resumen_general": {
      "total_operativos": 200,
      "total_novedades_atendidas": 175,
      "total_novedades_no_atendidas": 25,
      "tasa_atencion_general": "87.5",
      "eficiencia_global": "85.0"
    }
  }
}
```

---

## 🛠️ **Implementación Frontend - Ejemplos Prácticos**

### **Service de API**
```javascript
// services/reportesApi.js
import api from './api';

export const reportesApi = {
  // Dashboard
  getDashboard: (params) => api.get('/reportes-operativos/dashboard', { params }),
  
  // Vehiculares
  getVehiculares: (params) => api.get('/reportes-operativos/vehiculares', { params }),
  getResumenVehicular: (params) => api.get('/reportes-operativos/vehiculares/resumen', { params }),
  exportVehiculares: (params) => api.get('/reportes-operativos/vehiculares/exportar', { 
    params,
    responseType: 'blob' // Para descarga de archivos
  }),
  
  // Operativos a Pie
  getOperativosPie: (params) => api.get('/reportes-operativos/pie', { params }),
  getResumenPie: (params) => api.get('/reportes-operativos/pie/resumen', { params }),
  exportOperativosPie: (params) => api.get('/reportes-operativos/pie/exportar', { 
    params,
    responseType: 'blob'
  }),
  
  // Novedades no Atendidas
  getNoAtendidas: (params) => api.get('/reportes-operativos/novedades-no-atendidas', { params }),
  getResumenNoAtendidas: (params) => api.get('/reportes-operativos/novedades-no-atendidas/resumen', { params }),
  exportNoAtendidas: (params) => api.get('/reportes-operativos/novedades-no-atendidas/exportar', { 
    params,
    responseType: 'blob'
  }),
  
  // Combinados
  getCombinados: (params) => api.get('/reportes-operativos/combinados', { params }),
  exportCombinados: (params) => api.get('/reportes-operativos/combinados/exportar', { 
    params,
    responseType: 'blob'
  })
};
```

### **Hook de Datos con Paginación**
```javascript
// hooks/useReportesData.js
import { useState, useEffect } from 'react';
import { reportesApi } from '../services/reportesApi';

export const useVehiculares = (initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchData = async (newParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await reportesApi.getVehiculares({ ...params, ...newParams });
      setData(response.data.data.operativos);
      setPagination(response.data.data.pagination);
      setParams({ ...params, ...newParams });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    pagination,
    params,
    refetch: fetchData,
    setParams
  };
};
```

### **Manejo de Exportación**
```javascript
// hooks/useExportReportes.js
export const useExportReportes = () => {
  const [exporting, setExporting] = useState(false);
  
  const exportReport = async (reportType, params = {}) => {
    setExporting(true);
    
    try {
      let response;
      
      switch (reportType) {
        case 'vehiculares':
          response = await reportesApi.exportVehiculares(params);
          break;
        case 'operativosPie':
          response = await reportesApi.exportOperativosPie(params);
          break;
        case 'noAtendidas':
          response = await reportesApi.exportNoAtendidas(params);
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exportando:', error);
      return { success: false, error: error.message };
    } finally {
      setExporting(false);
    }
  };
  
  return { exportReport, exporting };
};
```

---

## 🚨 **Manejo de Errores**

### **Códigos de Error Comunes**
```javascript
// constants/errorCodes.js
export const REPORTES_ERRORS = {
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  SERVER_ERROR: 500,
  UNAUTHORIZED: 401
};

// Manejo centralizado de errores
export const handleReportesError = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message;
  
  switch (status) {
    case REPORTES_ERRORS.PERMISSION_DENIED:
      return 'No tienes permisos para acceder a este reporte';
    case REPORTES_ERRORS.NOT_FOUND:
      return 'El reporte solicitado no existe';
    case REPORTES_ERRORS.VALIDATION_ERROR:
      return message || 'Parámetros inválidos';
    case REPORTES_ERRORS.SERVER_ERROR:
      return 'Error interno del servidor. Inténtalo más tarde';
    case REPORTES_ERRORS.UNAUTHORIZED:
      return 'Tu sesión ha expirado. Inicia sesión nuevamente';
    default:
      return 'Error desconocido. Contacta al soporte técnico';
  }
};
```

---

## 📊 **Formato de Fechas**

### **Zona Horaria**
- **Backend:** America/Lima (UTC-5)
- **Frontend:** Todas las fechas deben enviarse en formato `YYYY-MM-DD`
- **Respuestas:** Fechas en formato ISO 8601 con timezone UTC

### **Ejemplos de Formato**
```javascript
// Formato correcto para parámetros
const params = {
  fecha_inicio: '2026-04-19',  // ✅ Correcto
  fecha_fin: '2026-04-27',    // ✅ Correcto
  // fecha_inicio: '19/04/2026', // ❌ Incorrecto
  // fecha_fin: '27-04-2026',   // ❌ Incorrecto
};

// Manejo de fechas en frontend
const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0]; // "2026-04-19"
};

const formatAPIResponseDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

---

## 🎯 **Best Practices**

### **1. 🔄 Caching de Datos**
```javascript
// Implementar cache para datos que no cambian frecuentemente
const useReportesCache = (key, fetchFunction, ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  
  const fetchData = async () => {
    const now = Date.now();
    
    if (data && (now - lastUpdate) < ttl) {
      return data; // Return cached data
    }
    
    const freshData = await fetchFunction();
    setData(freshData);
    setLastUpdate(now);
    return freshData;
  };
  
  return { data, fetchData, refresh: () => setLastUpdate(0) };
};
```

### **2. 📱 Lazy Loading para Grandes Volúmenes**
```javascript
// Para listados grandes, implementar scroll infinito
const useInfiniteScroll = (fetchFunction) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetchFunction({ page, limit: 50 });
      const newData = response.data.data.operativos;
      
      setData(prev => [...prev, ...newData]);
      setHasMore(response.data.data.pagination.hasNext);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, hasMore, loadMore };
};
```

### **3. 🎨 Optimización de Renderizado**
```javascript
// Memoizar componentes pesados
const OperativoItem = React.memo(({ operativo }) => {
  return (
    <div className="operativo-item">
      {/* Contenido del item */}
    </div>
  );
});

// Virtual scrolling para listados muy grandes
import { FixedSizeList as List } from 'react-window';

const OperativosList = ({ operativos }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <OperativoItem operativo={operativos[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={operativos.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
};
```

---

## 📞 **Soporte y Debugging**

### **Endpoints de Salud**
```http
GET /api/v1/reportes-operativos/health
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Servicio de reportes operativos funcionando correctamente",
  "service": "reportes-operativos",
  "version": "1.0.0",
  "timestamp": "2026-04-27T02:59:26.522Z",
  "endpoints_implemented": {
    "vehiculares": "active",
    "vehiculares_resumen": "active",
    "vehiculares_exportar": "active",
    "pie": "active",
    "pie_resumen": "active",
    "pie_exportar": "active",
    "no_atendidas": "active",
    "no_atendidas_resumen": "active",
    "no_atendidas_exportar": "active",
    "combinados": "active",
    "combinados_exportar": "active",
    "dashboard": "active"
  }
}
```

---

*Última actualización: 27 de abril de 2026*
*Versión: 1.0.0 - Compatible con Backend v2.3.0*
