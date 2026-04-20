# API Documentation - Cargos

## **Overview**
API para la gestión de cargos/puestos de trabajo del sistema de seguridad ciudadana.

**Base URL:** `http://localhost:3000/api/v1/cargos`

---

## **Autenticación**
Todos los endpoints requieren token JWT en el header:

```javascript
headers: {
  "Authorization": "Bearer <token_jwt>"
}
```

---

## **Estructura de Respuestas**

### **Respuesta Exitosa**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### **Respuesta de Error**
```json
{
  "success": false,
  "message": "Mensaje descriptivo del error",
  "error": "Error al procesar la solicitud"
}
```

---

## **Endpoints**

### **1. Listar Cargos**
```http
GET /cargos
```

**Query Parameters (opcionales):**
- `categoria` (string) - Filtrar por categoría
- `requiere_licencia` (boolean) - Filtrar si requiere licencia
- `activos` (boolean) - Filtrar por estado (true=activos, false=inactivos, default: true)
- `page` (number) - Página actual (default: 1)
- `limit` (number) - Registros por página (default: 50)

**Response Body:**
```json
{
  "success": true,
  "data": {
    "cargos": [
      {
        "id": 1,
        "nombre": "Sereno",
        "descripcion": "Personal de seguridad ciudadana",
        "nivel_jerarquico": 8,
        "categoria": "Operativo",
        "requiere_licencia": true,
        "salario_base": 2500.00,
        "codigo": "SERN-001",
        "color": "#3B82F6",
        "estado": true,
        "created_at": "2026-04-19T18:30:00.000Z",
        "updated_at": "2026-04-19T18:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

### **2. Obtener Cargo por ID**
```http
GET /cargos/{id}
```

**Response Body:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Sereno",
    "descripcion": "Personal de seguridad ciudadana",
    "nivel_jerarquico": 8,
    "categoria": "Operativo",
    "requiere_licencia": true,
    "salario_base": 2500.00,
    "codigo": "SERN-001",
    "color": "#3B82F6",
    "estado": true,
    "cantidad_personal": 12,
    "created_at": "2026-04-19T18:30:00.000Z",
    "updated_at": "2026-04-19T18:30:00.000Z"
  }
}
```

---

### **3. Crear Cargo**
```http
POST /cargos
```

**Request Body:**
```json
{
  "nombre": "Supervisor de Turno",
  "descripcion": "Supervisa operaciones de seguridad en su turno",
  "nivel_jerarquico": 6,
  "categoria": "Supervisión",
  "requiere_licencia": true,
  "salario_base": 3500.00,
  "codigo": "SUPT-001",
  "color": "#10B981"
}
```

**Response Body:**
```json
{
  "success": true,
  "message": "Cargo creado exitosamente",
  "data": {
    "id": 16,
    "nombre": "Supervisor De Turno",
    "descripcion": "Supervisa operaciones de seguridad en su turno",
    "nivel_jerarquico": 6,
    "categoria": "Supervisión",
    "requiere_licencia": true,
    "salario_base": 3500.00,
    "codigo": "SUPT-001",
    "color": "#10B981",
    "estado": true,
    "created_at": "2026-04-19T18:45:00.000Z",
    "updated_at": "2026-04-19T18:45:00.000Z"
  }
}
```

---

### **4. Actualizar Cargo**
```http
PUT /cargos/{id}
```

**Request Body (parcial):**
```json
{
  "descripcion": "Supervisa y coordina operaciones de seguridad",
  "salario_base": 3750.00,
  "color": "#059669"
}
```

**Response Body:**
```json
{
  "success": true,
  "message": "Cargo actualizado exitosamente",
  "data": {
    "id": 16,
    "nombre": "Supervisor De Turno",
    "descripcion": "Supervisa y coordina operaciones de seguridad",
    "nivel_jerarquico": 6,
    "categoria": "Supervisión",
    "requiere_licencia": true,
    "salario_base": 3750.00,
    "codigo": "SUPT-001",
    "color": "#059669",
    "estado": true,
    "updated_at": "2026-04-19T19:00:00.000Z"
  }
}
```

---

### **5. Verificar si Cargo Puede Ser Eliminado**
```http
GET /cargos/{id}/can-delete
```

**Response Body (puede eliminar):**
```json
{
  "success": true,
  "data": {
    "canDelete": true,
    "reason": null,
    "cantidadPersonal": 0
  }
}
```

**Response Body (no puede eliminar):**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "reason": "No se puede eliminar el cargo porque tiene 4 persona(s) asignada(s)",
    "cantidadPersonal": 4
  }
}
```

---

### **6. Eliminar Cargo (Soft Delete)**
```http
DELETE /cargos/{id}
```

**Response Body:**
```json
{
  "success": true,
  "message": "Cargo eliminado exitosamente"
}
```

**Error si tiene personal asignado:**
```json
{
  "success": false,
  "message": "No se puede eliminar el cargo porque tiene 4 persona(s) asignada(s)"
}
```

---

### **7. Restaurar Cargo**
```http
POST /cargos/{id}/restore
```

**Response Body:**
```json
{
  "success": true,
  "message": "Cargo restaurado exitosamente",
  "data": {
    "id": 16,
    "nombre": "Supervisor De Turno",
    "estado": true,
    "deleted_at": null
  }
}
```

---

### **8. Estadísticas de Cargos**
```http
GET /cargos/stats
```

**Response Body:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "conLicencia": 8,
    "porCategoria": {
      "Operativo": 8,
      "Supervisión": 3,
      "Jefatura": 2,
      "Directivo": 2
    }
  }
}
```

---

### **9. Cargos por Categoría**
```http
GET /cargos/categoria/{categoria}
```

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sereno",
      "categoria": "Operativo",
      "nivel_jerarquico": 8
    }
  ]
}
```

---

### **10. Personas Asociadas a Cargo**
```http
GET /cargos/{id}/personas-asociadas
```

**Response Body:**
```json
{
  "success": true,
  "data": {
    "cargo": {
      "id": 1,
      "nombre": "Sereno",
      "codigo": "SERN-001",
      "categoria": "Operativo",
      "nivel_jerarquico": 8
    },
    "personas_asociadas": [
      {
        "id": 123,
        "nombres": "Juan Carlos",
        "apellido_paterno": "Pérez",
        "apellido_materno": "García",
        "doc_tipo": "DNI",
        "doc_numero": "12345678",
        "sexo": "Masculino",
        "fecha_nacimiento": "1990-05-15",
        "direccion": "Av. Principal 123",
        "ubigeo_code": "150101",
        "fecha_ingreso": "2020-01-15",
        "status": "Activo",
        "licencia": "A1234567",
        "categoria": "Sereno",
        "vigencia": "2025-12-31",
        "regimen": "276",
        "vehiculo_id": 5,
        "codigo_acceso": "SER001",
        "estado": true,
        "created_at": "2026-04-19T18:30:00.000Z"
      },
      {
        "id": 124,
        "nombres": "María Elena",
        "apellido_paterno": "López",
        "apellido_materno": "Martínez",
        "doc_tipo": "DNI",
        "doc_numero": "87654321",
        "sexo": "Femenino",
        "fecha_nacimiento": "1992-08-20",
        "direccion": "Jr. Secundaria 456",
        "ubigeo_code": "150101",
        "fecha_ingreso": "2021-03-10",
        "status": "Activo",
        "licencia": "B7654321",
        "categoria": "Sereno",
        "vigencia": "2025-12-31",
        "regimen": "276",
        "vehiculo_id": null,
        "codigo_acceso": "SER002",
        "estado": true,
        "created_at": "2026-04-19T18:45:00.000Z"
      }
    ],
    "total_personas": 2
  }
}
```

**Response Body (sin personas):**
```json
{
  "success": true,
  "data": {
    "cargo": {
      "id": 5,
      "nombre": "Analista Senior",
      "codigo": "ANLS-002",
      "categoria": "Administrativo",
      "nivel_jerarquico": 6
    },
    "personas_asociadas": [],
    "total_personas": 0
  }
}
```

---

### **11. Cargos con Licencia**
```http
GET /cargos/con-licencia
```

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sereno",
      "requiere_licencia": true,
      "categoria": "Operativo"
    }
  ]
}
```

---

## **Estructura de Datos**

### **Cargo Object**
```json
{
  "id": "number",
  "nombre": "string (2-100 chars)",
  "descripcion": "string (opcional, max 1000 chars)",
  "nivel_jerarquico": "number (1-10)",
  "categoria": "enum",
  "requiere_licencia": "boolean",
  "salario_base": "decimal (opcional)",
  "codigo": "string (opcional, 2-20 chars)",
  "color": "string (hex #RRGGBB)",
  "estado": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### **Categorías Válidas**
```json
[
  "Alcalde",
  "Gerente", 
  "Directivo",
  "Jefatura",
  "Supervisión",
  "Operativo",
  "Administrativo",
  "Apoyo"
]
```

---

## **Validaciones Importantes**

### **Campos Requeridos**
- `nombre`: Obligatorio, único, 2-100 caracteres

### **Validaciones de Formato**
- `nombre`: No puede estar vacío
- `nivel_jerarquico`: Entero entre 1 y 10
- `codigo`: 2-20 caracteres, único si se proporciona
- `color`: Formato hexadecimal (#RRGGBB)
- `salario_base`: No puede ser negativo

### **Reglas de Negocio**
- **Nombre único**: No puede haber dos cargos con el mismo nombre
- **Código único**: Si se proporciona, debe ser único
- **Conversión automática**: 
  - `nombre` se convierte a Title Case
  - `codigo` se convierte a **MAYÚSCULAS**
- **Eliminación restringida**: No se puede eliminar si tiene personal asignado

---

## **Mensajes de Error**

### **Errores de Validación (400)**
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "nombre",
      "message": "El nombre del cargo es obligatorio"
    },
    {
      "field": "nivel_jerarquico", 
      "message": "El nivel jerárquico debe estar entre 1 y 10"
    }
  ]
}
```

### **Errores Comunes**

| Código | Mensaje | Causa | Solución |
|--------|---------|--------|----------|
| 400 | "El nombre del cargo es obligatorio" | No se envió nombre | Enviar nombre |
| 400 | "Ya existe un cargo con ese nombre" | Nombre duplicado | Usar otro nombre |
| 400 | "Ya existe un cargo con ese código" | Código duplicado | Usar otro código |
| 404 | "Cargo no encontrado" | ID inválido | Verificar ID |
| 400 | "No se puede eliminar el cargo porque tiene X persona(s) asignada(s)" | Tiene personal | Reasignar personal primero |

---

## **Ejemplos de Uso para Frontend**

### **Crear Cargo**
```javascript
const crearCargo = async (cargoData) => {
  try {
    const response = await fetch('/api/v1/cargos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Analista de Seguridad',
        descripcion: 'Analiza información de seguridad',
        nivel_jerarquico: 7,
        categoria: 'Administrativo',
        requiere_licencia: false,
        salario_base: 3000,
        codigo: 'ANLS-001',
        color: '#8B5CF6'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Cargo creado:', result.data);
      return result.data;
    } else {
      console.error('Error:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al crear cargo:', error);
    throw error;
  }
};
```

### **Listar Cargos con Filtros**
```javascript
const listarCargos = async (filtros = {}) => {
  const params = new URLSearchParams({
    categoria: filtros.categoria || '',
    requiere_licencia: filtros.requiereLicencia || '',
    activos: filtros.soloActivos !== false ? 'true' : 'false',
    page: filtros.page || 1,
    limit: filtros.limit || 50
  });

  try {
    const response = await fetch(`/api/v1/cargos?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al listar cargos:', error);
    throw error;
  }
};
```

### **Ejemplos de Filtrado**

#### **Solo Cargos Activos**
```javascript
// GET /api/v1/cargos?activos=true
const activos = await listarCargos({ soloActivos: true });
// Resultado: Solo cargos con estado=true y deleted_at=null
```

#### **Solo Cargos Inactivos**
```javascript
// GET /api/v1/cargos?activos=false
const inactivos = await listarCargos({ soloActivos: false });
// Resultado: Cargos con estado=false O deleted_at != null
```

#### **Por Categoría**
```javascript
// GET /api/v1/cargos?categoria=Operativo&activos=true
const operativos = await listarCargos({ 
  categoria: 'Operativo', 
  soloActivos: true 
});
```

#### **Combinar Filtros**
```javascript
// GET /api/v1/cargos?categoria=Supervisión&requiere_licencia=true&activos=true
const supervisoresConLicencia = await listarCargos({
  categoria: 'Supervisión',
  requiereLicencia: true,
  soloActivos: true
});
```

### **Actualizar Cargo**
```javascript
const actualizarCargo = async (id, datosActualizados) => {
  try {
    const response = await fetch(`/api/v1/cargos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosActualizados)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Cargo actualizado:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al actualizar cargo:', error);
    throw error;
  }
};
```

### **Verificar si Cargo Puede Ser Eliminado**
```javascript
const verificarPuedeEliminar = async (id) => {
  try {
    const response = await fetch(`/api/v1/cargos/${id}/can-delete`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al verificar si puede eliminar:', error);
    throw error;
  }
};
```

### **Obtener Personas Asociadas a Cargo**
```javascript
const getPersonasAsociadas = async (cargoId) => {
  try {
    const response = await fetch(`/api/v1/cargos/${cargoId}/personas-asociadas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al obtener personas asociadas:', error);
    throw error;
  }
};
```

### **Eliminar Cargo**
```javascript
const eliminarCargo = async (id) => {
  try {
    // Primero verificar si puede eliminar
    const puedeEliminar = await verificarPuedeEliminar(id);
    
    if (!puedeEliminar.canDelete) {
      // Mostrar personas asociadas antes de bloquear eliminación
      const personasAsociadas = await getPersonasAsociadas(id);
      
      if (personasAsociadas.total_personas > 0) {
        // Mostrar modal con personas asociadas
        console.log('Personas asociadas:', personasAsociadas.personas_asociadas);
        alert(`No se puede eliminar el cargo porque tiene ${personasAsociadas.total_personas} persona(s) asignada(s):\n\n` +
          personasAsociadas.personas_asociadas.map(p => 
            `-${p.nombres} ${p.apellido_paterno} ${p.apellido_materno} (${p.doc_tipo}: ${p.doc_numero}) - Status: ${p.status}`
          ).join('\n'));
      }
      return false;
    }

    const response = await fetch(`/api/v1/cargos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Cargo eliminado');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al eliminar cargo:', error);
    throw error;
  }
};
```

---

## **Componente React de Ejemplo**

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CargoForm = ({ cargoExistente, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    nivel_jerarquico: 5,
    categoria: 'Operativo',
    requiere_licencia: false,
    salario_base: '',
    codigo: '',
    color: '#6B7280'
  });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  const categorias = [
    'Alcalde', 'Gerente', 'Directivo', 'Jefatura', 
    'Supervisión', 'Operativo', 'Administrativo', 'Apoyo'
  ];

  useEffect(() => {
    if (cargoExistente) {
      setFormData(cargoExistente);
    }
  }, [cargoExistente]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrores({});

    try {
      const url = cargoExistente 
        ? `/api/v1/cargos/${cargoExistente.id}`
        : '/api/v1/cargos';
      
      const method = cargoExistente ? 'PUT' : 'POST';

      const response = await axios({
        method,
        url,
        data: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        onSave(response.data.data);
      } else {
        setErrores(response.data);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const erroresMap = {};
        error.response.data.errors.forEach(err => {
          erroresMap[err.field] = err.message;
        });
        setErrores(erroresMap);
      } else {
        setErrores({ general: 'Error al guardar el cargo' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cargo-form">
      <div className="form-group">
        <label>Nombre del Cargo *</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          className={errores.nombre ? 'error' : ''}
          placeholder="Ej: Sereno, Supervisor, etc."
        />
        {errores.nombre && <span className="error-text">{errores.nombre}</span>}
      </div>

      <div className="form-group">
        <label>Descripción</label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Funciones y responsabilidades del cargo"
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Nivel Jerárquico</label>
          <input
            type="number"
            name="nivel_jerarquico"
            value={formData.nivel_jerarquico}
            onChange={handleChange}
            min="1"
            max="10"
          />
        </div>

        <div className="form-group">
          <label>Categoría</label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Salario Base (S/.)</label>
          <input
            type="number"
            name="salario_base"
            value={formData.salario_base}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="Opcional"
          />
        </div>

        <div className="form-group">
          <label>Código</label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            placeholder="Ej: SERN-001"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Color</label>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="requiere_licencia"
              checked={formData.requiere_licencia}
              onChange={handleChange}
            />
            Requiere Licencia de Conducir
          </label>
        </div>
      </div>

      {errores.general && (
        <div className="error-message">{errores.general}</div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : (cargoExistente ? 'Actualizar' : 'Crear')}
        </button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default CargoForm;
```

---

## **Tips de Implementación**

1. **Validación Frontend**: Validar formato de código y color antes de enviar
2. **Código Automático**: El backend convierte el código a mayúsculas automáticamente
3. **Nombres Únicos**: Verificar unicidad antes de enviar para mejor UX
4. **Eliminación**: Verificar si hay personal asignado antes de intentar eliminar
5. **Colores**: Usar picker de color con formato hexadecimal
6. **Nivel Jerárquico**: Usar slider o input numérico con validación 1-10

---

## **Notas Importantes**

- **Conversión Automática**: El campo `codigo` se convierte automáticamente a **MAYÚSCULAS**
- **Soft Delete**: Los eliminados se marcan como `deleted_at` pero no se borran físicamente
- **Ordenamiento**: Por defecto se ordena por `nivel_jerarquico` ASC y `nombre` ASC
- **Paginación**: Implementada en el endpoint de listado general
- **Permisos**: Requiere autenticación y roles específicos según la operación

- **RBAC Slugs**: 
catalogos.cargos.create
catalogos.cargos.read
catalogos.cargos.update
catalogos.cargos.delete

---

**Última actualización:** 2026-04-19
