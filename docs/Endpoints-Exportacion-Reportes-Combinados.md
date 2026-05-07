# 📊 Endpoints de Exportación - Reportes Operativos Combinados

## 🎯 **INFORMACIÓN CRÍTICA PARA FRONTEND**

### **✅ PROBLEMA RESUELTO**
El endpoint `/api/v1/reportes-operativos/combinados/exportar` ya está disponible y funcionando.

---

## 📡 **ENDPOINTS DISPONIBLES**

### **1. Exportar Reportes Combinados (NUEVO)**
```http
GET /api/v1/reportes-operativos/combinados/exportar
```

**Status:** ✅ **DISPONIBLE Y FUNCIONANDO**

**Respuesta esperada:**
- ✅ **200 OK** - Archivo de exportación (Excel/CSV)
- ❌ **401 Unauthorized** - Si no hay token
- ❌ **403 Forbidden** - Si no tiene permisos
- ❌ **404 Not Found** - **NO DEBERÍA OCURRIR MÁS**

---

### **2. Exportar Operativos Vehiculares (Existente)**
```http
GET /api/v1/reportes-operativos/vehiculares/exportar
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS FRONTEND**

### **❌ Si recibes 404 Not Found:**

#### **1. LIMPIAR CACHÉ DEL NAVEGADOR**
```bash
# Hard refresh (Windows/Linux)
Ctrl + Shift + R

# O abrir en modo incógnito/privado
```

#### **2. REINICIAR SERVIDOR DE DESARROLLO VITE**
```bash
# Detener servidor (Ctrl + C)
# Luego reiniciar
npm run dev
```

#### **3. VERIFICAR URL EN EL SERVICIO**
```javascript
// ✅ CORRECTO - reportesOperativosNewService.js
const exportarReportesCombinados = async (params) => {
  try {
    const response = await api.get('/reportes-operativos/combinados/exportar', {
      params,
      responseType: 'blob' // IMPORTANTE para descargar archivos
    });
    return response;
  } catch (error) {
    // Manejar error
  }
};
```

---

## 🔐 **AUTENTICACIÓN REQUERIDA**

### **Headers necesarios:**
```javascript
headers: {
  'Authorization': 'Bearer TU_TOKEN_JWT',
  'Content-Type': 'application/json'
}
```

### **Response Type:**
```javascript
responseType: 'blob'  // CRÍTICO para descarga de archivos
```

---

## 📋 **PARÁMETROS DISPONIBLES**

### **Parámetros de consulta (query params):**
```javascript
{
  fecha_inicio: '2026-04-06',        // Formato YYYY-MM-DD
  fecha_fin: '2026-05-06',          // Formato YYYY-MM-DD
  turno: 'MAÑANA',                  // Opcional: MAÑANA, TARDE, NOCHE
  sector_id: 123,                    // Opcional: ID del sector
  cuadrante_id: 456,                // Opcional: ID del cuadrante
  estado_novedad: 1,                 // Opcional: 0 o 1
  prioridad: 'ALTA',                 // Opcional: BAJA, MEDIA, ALTA
  tipo_novedad_id: 789,              // Opcional: ID del tipo
  formato: 'excel',                  // Opcional: 'excel' (default) o 'csv'
  limit: 1000,                       // Opcional: Límite de registros
  page: 1                            // Opcional: Número de página
}
```

### **Ejemplo de uso completo:**
```javascript
const exportarCombinados = async () => {
  try {
    const response = await api.get('/reportes-operativos/combinados/exportar', {
      params: {
        fecha_inicio: '2026-04-06',
        fecha_fin: '2026-05-06',
        formato: 'excel',
        limit: 1000
      },
      responseType: 'blob'
    });
    
    // Descargar archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reportes-combinados-operativos.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error en exportación:', error);
    // Manejar error específico
    if (error.response?.status === 401) {
      alert('Sesión expirada. Por favor inicia sesión nuevamente.');
    } else if (error.response?.status === 403) {
      alert('No tienes permisos para exportar reportes.');
    } else if (error.response?.status === 404) {
      alert('Endpoint no encontrado. Verifica la configuración.');
    } else {
      alert('Error al exportar reportes. Intente nuevamente.');
    }
  }
};
```

---

## 📊 **ESTRUCTURA DE DATOS EXPORTADOS**

### **Campos incluidos en el archivo:**
1. **`tipo_operativo`** - Identifica la fuente (VEHICULAR, A PIE, NO ATENDIDA)
2. **Todos los campos de operativos vehiculares**
3. **Todos los campos de operativos a pie**
4. **Todos los campos de novedades no atendidas**

### **Formatos soportados:**
- **Excel (.xlsx)** - Formato por defecto
- **CSV (.csv)** - Formato alternativo

---

## 🔍 **VERIFICACIÓN DE ESTADO**

### **Para probar el endpoint directamente:**
```bash
# Con autenticación (necesitas token válido)
curl -X GET "http://localhost:3000/api/v1/reportes-operativos/combinados/exportar" \
  -H "Authorization: Bearer TU_TOKEN_JWT"

# Sin autenticación (debería dar 401)
curl -X GET "http://localhost:3000/api/v1/reportes-operativos/combinados/exportar"
```

### **Respuesta esperada sin token:**
```json
{
  "success": false,
  "message": "No se proporcionó un token de autenticación"
}
```

---

## 🚨 **ERRORES COMUNES Y SOLUCIONES**

### **Error 404 Not Found:**
- **Causa:** Caché del navegador o servidor Vite
- **Solución:** Hard refresh + reiniciar Vite

### **Error 401 Unauthorized:**
- **Causa:** Token no proporcionado o inválido
- **Solución:** Verificar que el token esté en los headers

### **Error 403 Forbidden:**
- **Causa:** Usuario no tiene permisos
- **Solución:** Verificar rol del usuario (super_admin, admin, supervisor)

### **Error de descarga:**
- **Causa:** Falta `responseType: 'blob'`
- **Solución:** Agregar responseType en la petición Axios

---

## 📝 **RESUMEN EJECUTIVO**

### **✅ ESTADO ACTUAL:**
- **Backend:** Endpoint funcionando correctamente
- **Autenticación:** Requerida y validada
- **Permisos:** Configurados para super_admin, admin, supervisor
- **Formatos:** Excel y CSV disponibles

### **🎯 ACCIONES REQUERIDAS FRONTEND:**
1. **Reiniciar servidor Vite**
2. **Limpiar caché navegador**
3. **Verificar implementación del servicio**
4. **Probar con token válido**

### **📞 SOPORTE:**
Si el problema persiste después de limpiar caché y reiniciar Vite, revisar:
- Configuración de baseURL en Axios
- Headers de autenticación
- responseType en la petición

---

**Última actualización:** 2026-05-05  
**Estado:** ✅ **Endpoint disponible y funcionando**
