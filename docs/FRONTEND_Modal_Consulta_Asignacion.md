# Modal de Consulta de Asignación de Vehículo a Cuadrante

## 📋 Descripción

Modal para consultar información completa de una asignación de vehículo a cuadrante, incluyendo todos los campos de auditoría con información de usuarios.

## 🎯 Endpoint para Consulta

### **GET /api/v1/cuadrantes-vehiculos-asignados/:id**

Retorna la información completa de una asignación específica con todas sus relaciones de auditoría.

## 📊 Estructura de Respuesta

### **Campos Principales**
```javascript
{
  id: 1,
  cuadrante_id: 1,
  vehiculo_id: 1,
  observaciones: "Se ha asignado el Móvil con placa ABC-123 al cuadrante CENTRO satisfactoriamente",
  estado: 1, // 1=ACTIVO, 0=INACTIVO
  created_at: "2024-01-15T10:30:00.000Z",
  updated_at: "2024-01-15T10:30:00.000Z",
  deleted_at: null, // null si no está eliminado, fecha si está soft-deleted
}
```

### **Relaciones de Auditoría**

#### **1. Cuadrante Asignado**
```javascript
cuadrante: {
  id: 1,
  nombre: "CENTRO",
  cuadrante_code: "C-001"
}
```

#### **2. Vehículo Asignado**
```javascript
vehiculo: {
  id: 1,
  placa: "ABC-123",
  marca: "Toyota",
  modelo_vehiculo: "Hilux"
}
```

#### **3. Usuario que Creó**
```javascript
creadorAsignacion: {
  id: 5,
  username: "jadmin",
  nombres: "Juan",
  apellidos: "Administrador"
}
```

#### **4. Usuario que Actualizó**
```javascript
actualizadorAsignacion: {
  id: 5,
  username: "jadmin", 
  nombres: "Juan",
  apellidos: "Administrador"
}
// null si nunca ha sido actualizado
```

#### **5. Usuario que Eliminó**
```javascript
eliminadorAsignacion: {
  id: 8,
  username: "msupervisor",
  nombres: "María", 
  apellidos: "Supervisor"
}
// null si no está eliminado
```

## 🔧 Servicio Frontend

### **Método en el Servicio**
```javascript
// En src/services/cuadranteVehiculoAsignadoService.js

export const getAsignacionById = async (id) => {
  try {
    const response = await api.get(`/cuadrantes-vehiculos-asignados/${id}`);
    return response;
  } catch (error) {
    console.error("Error obteniendo asignación:", error);
    throw error;
  }
};
```

## 🎯 Cómo Usar el Modal

### **1. Importar el Servicio**
```javascript
import cuadranteVehiculoAsignadoService from "../services/cuadranteVehiculoAsignadoService";
```

### **2. Estado del Modal**
```javascript
const [showViewModal, setShowViewModal] = useState(false);
const [selectedAsignacionId, setSelectedAsignacionId] = useState(null);
const [asignacionData, setAsignacionData] = useState(null);
const [loading, setLoading] = useState(false);
```

### **3. Función para Cargar Datos**
```javascript
const cargarAsignacion = async (id) => {
  setLoading(true);
  try {
    const response = await cuadranteVehiculoAsignadoService.getAsignacionById(id);
    setAsignacionData(response.data.data);
  } catch (error) {
    console.error("Error cargando asignación:", error);
  } finally {
    setLoading(false);
  }
};
```

### **4. Abrir Modal desde la Tabla**
```javascript
const handleViewAsignacion = (asignacionId) => {
  setSelectedAsignacionId(asignacionId);
  setShowViewModal(true);
  cargarAsignacion(asignacionId);
};

// En la tabla de asignaciones
<button
  onClick={() => handleViewAsignacion(asignacion.id)}
  className="p-1 text-blue-600 hover:text-blue-800"
  title="Ver detalles"
>
  <Eye size={18} />
</button>
```

## 📋 Campos de Auditoría Disponibles

| Campo | Descripción | Formato |
|-------|-------------|---------|
| `created_at` | Fecha de creación | ISO 8601 |
| `created_by` | Usuario que creó | ID Usuario |
| `updated_at` | Última actualización | ISO 8601 |
| `updated_by` | Usuario que actualizó | ID Usuario |
| `deleted_at` | Fecha de eliminación | ISO 8601 (null si activo) |
| `deleted_by` | Usuario que eliminó | ID Usuario (null si activo) |

## 🎨 Estructura del Modal

### **Header**
- Título: "Detalles de Asignación"
- Botón de cerrar (X)

### **Contenido Principal**
1. **Información del Vehículo**
   - Placa
   - Marca
   - Modelo

2. **Información del Cuadrante**
   - Código
   - Nombre

3. **Estado**
   - Activo/Inactivo/Eliminado con colores

4. **Observaciones**
   - Texto completo de observaciones

5. **Auditoría**
   - Creado por: Usuario + Fecha
   - Actualizado por: Usuario + Fecha (si aplica)
   - Eliminado por: Usuario + Fecha (si aplica)

## 🔄 Flujo de Datos

### **1. Petición**
```
GET /api/v1/cuadrantes-vehiculos-asignados/123
```

### **2. Respuesta del Backend**
```javascript
{
  success: true,
  message: "Asignación obtenida exitosamente",
  data: {
    // Todos los campos incluyendo relaciones de auditoría
  }
}
```

### **3. Procesamiento Frontend**
- Extraer datos de `response.data.data`
- Mostrar información en el modal
- Formatear fechas y nombres de usuarios

## 🚀 Implementación Rápida

### **Componente Básico**
```jsx
const ViewModal = ({ isOpen, onClose, asignacionId }) => {
  const [asignacion, setAsignacion] = useState(null);
  
  useEffect(() => {
    if (isOpen && asignacionId) {
      cuadranteVehiculoAsignadoService.getAsignacionById(asignacionId)
        .then(response => setAsignacion(response.data.data));
    }
  }, [isOpen, asignacionId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {asignacion && (
        <div>
          <h3>{asignacion.vehiculo.placa}</h3>
          <p>Cuadrante: {asignacion.cuadrante.nombre}</p>
          <p>Creado por: {asignacion.creadorAsignacion?.nombres}</p>
          {/* Más campos... */}
        </div>
      )}
    </Modal>
  );
};
```

## ✅ Verificaciones Importantes

1. **✅ Relaciones Disponibles:**
   - `creadorAsignacion` → Usuario que creó
   - `actualizadorAsignacion` → Usuario que actualizó  
   - `eliminadorAsignacion` → Usuario que eliminó

2. **✅ Campos de Auditoría:**
   - `created_at`, `updated_at`, `deleted_at`
   - `created_by`, `updated_by`, `deleted_by`

3. **✅ paranoid: false**
   - Incluye soft-deleted
   - Muestra información completa de auditoría

4. **✅ Formato de Usuario:**
   - `username`, `nombres`, `apellidos`
   - Facilita mostrar nombres completos

## 🎯 Tips de Implementación

- **Formatear fechas:** Usar `toLocaleString()` para formato local
- **Nombres completos:** Concatenar `nombres + apellidos`
- **Estados visuales:** Usar colores y badges para estados
- **Loading states:** Mostrar spinner mientras carga
- **Error handling:** Manejar errores de API correctamente
