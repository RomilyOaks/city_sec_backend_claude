# 📋 **Guía Frontend - Mantenimiento de Radios TETRA**

## 🎯 **Objetivo**

Implementar pantalla completa de mantenimiento de radios TETRA con operaciones CRUD + asignación/desasignación de personal de seguridad.

---

## 📊 **Análisis de Endpoints Existentes**

### **✅ Endpoints CRUD Completos**

| Método | Endpoint | Funcionalidad | Estado |
|--------|----------|---------------|---------|
| `GET` | `/api/radios-tetra` | Listar radios con filtros y paginación | ✅ Disponible |
| `GET` | `/api/radios-tetra/:id` | Obtener radio por ID | ✅ Disponible |
| `POST` | `/api/radios-tetra` | Crear nuevo radio | ✅ Disponible |
| `PUT` | `/api/radios-tetra/:id` | Actualizar radio existente | ✅ Disponible |
| `DELETE` | `/api/radios-tetra/:id` | Eliminar radio (soft delete) | ✅ Disponible |

### **✅ Endpoints de Asignación**

| Método | Endpoint | Funcionalidad | Estado |
|--------|----------|---------------|---------|
| `PATCH` | `/api/radios-tetra/:id/asignar` | Asignar radio a personal | ✅ Disponible |
| `PATCH` | `/api/radios-tetra/:id/desasignar` | Desasignar radio | ✅ Disponible |
| `PATCH` | `/api/radios-tetra/:id/activar` | Activar radio | ✅ Disponible |
| `PATCH` | `/api/radios-tetra/:id/desactivar` | Desactivar radio | ✅ Disponible |

### **✅ Endpoints Especializados para Dropdowns**

| Método | Endpoint | Funcionalidad | Estado |
|--------|----------|---------------|---------|
| `GET` | `/api/radios-tetra/disponibles` | Radios disponibles (sin asignar) | ✅ Disponible |
| `GET` | `/api/radios-tetra/para-dropdown` | Todos los radios con info de asignación | ✅ Disponible |

---

## 🔍 **Análisis de Relaciones y Modelo**

### **📋 Modelo RadioTetra**

```javascript
// Campos principales
{
  id: INTEGER (PK),
  radio_tetra_code: STRING(10) UNIQUE,  // Código único
  descripcion: STRING(50),              // Descripción opcional
  personal_seguridad_id: INTEGER,       // FK a PersonalSeguridad
  fecha_fabricacion: DATEONLY,          // Fecha de fabricación
  estado: BOOLEAN DEFAULT true,         // Activo/Inactivo
  
  // Auditoría
  created_by: INTEGER,
  updated_by: INTEGER,
  deleted_by: INTEGER,
  created_at: DATETIME,
  updated_at: DATETIME,
  deleted_at: DATETIME
}
```

### **🔗 Relaciones Disponibles**

```javascript
// Relación con PersonalSeguridad
RadioTetra.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_seguridad_id",
  as: "personalAsignado"
});

// Relaciones de auditoría
RadioTetra.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorRadioTetra"
});

RadioTetra.belongsTo(Usuario, {
  foreignKey: "updated_by", 
  as: "actualizadorRadioTetra"
});

RadioTetra.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorRadioTetra"
});
```

---

## 🚨 **Análisis de Búsqueda de Personal**

### **❌ Endpoint Faltante**

**No existe un endpoint específico para buscar personal por apellidos con búsqueda optimizada para listas grandes (>1000 registros).**

### **✅ Endpoint Existente (Limitado)**

```javascript
// GET /api/personal
// Query params disponibles:
- search: búsqueda general (nombres, apellidos, documento)
- page: número de página
- limit: registros por página (max 100)
- sort: campo de ordenamiento
- order: ASC/DESC
```

**Limitación:** El endpoint actual no está optimizado para búsquedas rápidas en dropdowns grandes.

---

## 🛠️ **Solución Propuesta - Endpoint Optimizado**

### **🎯 Nuevo Endpoint Sugerido**

```javascript
// GET /api/personal/buscar-para-dropdown
// Query params:
- q: término de búsqueda (mínimo 3 caracteres)
- limit: número de resultados (default 20, max 50)
- campo: campo de búsqueda (apellido_paterno, nombres, ambos)
```

### **📋 Implementación Recomendada**

```javascript
// Nuevo método en PersonalSeguridad model
PersonalSeguridad.buscarParaDropdown = async function(termino, limit = 20) {
  return await PersonalSeguridad.findAll({
    where: {
      [Op.or]: [
        { 
          nombres: { [Op.like]: `${termino}%` } 
        },
        { 
          apellido_paterno: { [Op.like]: `${termino}%` } 
        },
        { 
          apellido_materno: { [Op.like]: `${termino}%` } 
        },
        {
          [Op.and]: [
            { apellido_paterno: { [Op.like]: `${termino.split(' ')[0]}%` } },
            { apellido_materno: { [Op.like]: `${termino.split(' ')[1]}%` } }
          ]
        }
      ],
      estado: 'Activo',
      deleted_at: null
    },
    attributes: [
      'id', 
      'nombres', 
      'apellido_paterno', 
      'apellido_materno',
      'doc_tipo',
      'doc_numero',
      'codigo_acceso'
    ],
    limit: Math.min(limit, 50),
    order: [
      ['apellido_paterno', 'ASC'],
      ['apellido_materno', 'ASC'],
      ['nombres', 'ASC']
    ]
  });
};
```

---

## 📱 **Guía de Implementación Frontend**

### **🏗️ Estructura de Componentes**

```javascript
// Componentes recomendados
- RadioTetraList.jsx          // Lista principal con paginación
- RadioTetraForm.jsx          // Formulario CRUD
- RadioTetraCard.jsx          // Card individual
- PersonalDropdown.jsx        // Dropdown optimizado para personal
- RadioTetraActions.jsx       // Botones de acción
- RadioTetraFilters.jsx       // Filtros avanzados
```

### **🔄 Flujo de Asignación**

```javascript
// 1. Abrir modal de asignación
const handleAsignarPersonal = async (radioId) => {
  // 2. Buscar personal con endpoint optimizado
  const personal = await buscarPersonalParaDropdown(termino);
  
  // 3. Seleccionar personal del dropdown
  // 4. Llamar endpoint de asignación
  await asignarRadioAPersonal(radioId, personalId);
  
  // 5. Refrescar lista
  await cargarRadios();
};
```

### **📋 Ejemplos de Uso de Endpoints**

#### **1. Listar Radios con Filtros**

```javascript
const cargarRadios = async (filtros = {}) => {
  try {
    const params = new URLSearchParams({
      page: filtros.page || 1,
      limit: filtros.limit || 10,
      search: filtros.search || '',
      estado: filtros.estado !== undefined ? filtros.estado : '',
      asignado: filtros.asignado || 'all'
    });

    const response = await axios.get(`/api/radios-tetra?${params}`);
    
    // Respuesta esperada:
    // {
    //   success: true,
    //   data: {
    //     radios: [...],
    //     pagination: {
    //       currentPage: 1,
    //       totalPages: 5,
    //       total: 47,
    //       hasNext: true,
    //       hasPrev: false
    //     }
    //   }
    // }
    
    setRadios(response.data.data.radios);
    setPagination(response.data.data.pagination);
  } catch (error) {
    console.error('Error cargando radios:', error);
  }
};
```

#### **2. Crear Nuevo Radio**

```javascript
const crearRadio = async (datosRadio) => {
  try {
    const response = await axios.post('/api/radios-tetra', {
      radio_tetra_code: datosRadio.codigo,
      descripcion: datosRadio.descripcion,
      fecha_fabricacion: datosRadio.fechaFabricacion,
      estado: datosRadio.estado || true
    });
    
    // Respuesta esperada:
    // {
    //   success: true,
    //   message: "Radio creado exitosamente",
    //   data: { ...radioCreado }
    // }
    
    await cargarRadios();
    return response.data.data;
  } catch (error) {
    console.error('Error creando radio:', error);
    throw error;
  }
};
```

#### **3. Asignar Personal**

```javascript
const asignarPersonal = async (radioId, personalId) => {
  try {
    const response = await axios.patch(`/api/radios-tetra/${radioId}/asignar`, {
      personal_seguridad_id: personalId
    });
    
    // Respuesta esperada:
    // {
    //   success: true,
    //   message: "Radio asignado exitosamente",
    //   data: { ...radioActualizado }
    // }
    
    await cargarRadios();
    return response.data.data;
  } catch (error) {
    console.error('Error asignando personal:', error);
    throw error;
  }
};
```

#### **4. Buscar Personal para Dropdown (Optimizado)**

```javascript
const buscarPersonalParaDropdown = async (termino, limit = 20) => {
  try {
    if (termino.length < 3) return [];
    
    const response = await axios.get('/api/personal/buscar-para-dropdown', {
      params: {
        q: termino,
        limit: limit
      }
    });
    
    // Respuesta esperada:
    // [
    //   {
    //     id: 123,
    //     nombres: "Juan Carlos",
    //     apellido_paterno: "Pérez",
    //     apellido_materno: "López",
    //     doc_tipo: "DNI",
    //     doc_numero: "12345678",
    //     codigo_acceso: "PER123"
    //   }
    // ]
    
    return response.data;
  } catch (error) {
    console.error('Error buscando personal:', error);
    return [];
  }
};
```

### **🎨 Componente Dropdown Optimizado**

```javascript
import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

const PersonalDropdown = ({ onSeleccionar, value, disabled = false }) => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Búsqueda optimizada con debounce
  const buscarPersonal = useCallback(
    debounce(async (termino) => {
      if (termino.length < 3) {
        setResultados([]);
        return;
      }

      setCargando(true);
      try {
        const resultados = await buscarPersonalParaDropdown(termino, 20);
        setResultados(resultados);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 300),
    []
  );

  // Manejar cambio en búsqueda
  const handleBusquedaChange = (e) => {
    const termino = e.target.value;
    setBusqueda(termino);
    buscarPersonal(termino);
  };

  // Formato de display para opciones
  const formatOpcion = (personal) => {
    return `${personal.apellido_paterno} ${personal.apellido_materno}, ${personal.nombres} (${personal.doc_numero})`;
  };

  return (
    <div className="personal-dropdown">
      <input
        type="text"
        value={busqueda}
        onChange={handleBusquedaChange}
        placeholder="Buscar por apellidos (mín. 3 caracteres)..."
        disabled={disabled}
        className="form-control"
      />
      
      {cargando && (
        <div className="dropdown-loading">
          <span className="spinner-border spinner-border-sm" />
          Buscando...
        </div>
      )}
      
      {!cargando && resultados.length > 0 && (
        <div className="dropdown-resultados">
          {resultados.map((personal) => (
            <div
              key={personal.id}
              className="dropdown-item"
              onClick={() => {
                onSeleccionar(personal);
                setBusqueda('');
                setResultados([]);
              }}
            >
              <div className="opcion-nombre">
                {formatOpcion(personal)}
              </div>
              <div className="opcion-detalle">
                {personal.codigo_acceso} • {personal.doc_tipo}-{personal.doc_numero}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!cargando && busqueda.length >= 3 && resultados.length === 0 && (
        <div className="dropdown-vacio">
          No se encontraron resultados para "{busqueda}"
        </div>
      )}
    </div>
  );
};

export default PersonalDropdown;
```

---

## 🔧 **Recomendaciones de Implementación**

### **✅ Buenas Prácticas**

1. **Debounce en búsquedas**: Implementar 300ms debounce para evitar llamadas excesivas
2. **Carga lazy**: Cargar resultados solo cuando el usuario escriba ≥3 caracteres
3. **Indicadores de carga**: Mostrar spinner durante búsquedas
4. **Manejo de errores**: Capturar y mostrar errores amigables
5. **Validación frontend**: Validar antes de enviar al backend

### **🎯 Optimizaciones de Rendimiento**

1. **Memoización**: Usar React.memo para componentes de lista
2. **Virtual scrolling**: Para listas muy grandes (>1000 items)
3. **Cache local**: Guardar búsquedas recientes en localStorage
4. **Paginación**: Implementar scroll infinito o paginación

### **🔐 Consideraciones de Seguridad**

1. **Validación de permisos**: Verificar permisos antes de mostrar acciones
2. **Sanitización**: Sanitizar entradas de búsqueda
3. **Rate limiting**: Respetar límites del backend
4. **Auditoría**: Registrar acciones de asignación/desasignación

---

## 📋 **Resumen de Estado Actual**

### **✅ Disponible y Funcional**
- Todos los endpoints CRUD de radios TETRA
- Endpoints de asignación/desasignación
- Endpoints especializados para dropdowns
- Relaciones completas con PersonalSeguridad
- Sistema de auditoría completo

### **❌ Faltante por Implementar**
- Endpoint optimizado para búsqueda de personal por apellidos
- Componente frontend dropdown optimizado

### **🎯 Próximos Pasos**
1. **Crear endpoint** `/api/personal/buscar-para-dropdown`
2. **Implementar componente** PersonalDropdown optimizado
3. **Integrar** en pantalla de mantenimiento de radios TETRA
4. **Probar** con datasets grandes (>1000 registros)

---

## 🚀 **Ejemplo de Flujo Completo**

```javascript
// Flujo completo de mantenimiento
const MantenimientoRadiosTETRA = () => {
  // Estado
  const [radios, setRadios] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [modalAsignacion, setModalAsignacion] = useState(false);
  const [radioSeleccionado, setRadioSeleccionado] = useState(null);

  // Cargar radios
  useEffect(() => {
    cargarRadios(filtros);
  }, [filtros]);

  // Asignar personal
  const handleAsignarPersonal = async (radio, personal) => {
    try {
      await asignarPersonal(radio.id, personal.id);
      setModalAsignacion(false);
      setRadioSeleccionado(null);
    } catch (error) {
      console.error('Error asignando:', error);
    }
  };

  return (
    <div className="mantenimiento-radios">
      <div className="header">
        <h1>Mantenimiento de Radios TETRA</h1>
        <button onClick={() => setModalCreacion(true)}>
          Nuevo Radio
        </button>
      </div>

      <RadioTetraFilters 
        filtros={filtros} 
        onCambiarFiltros={setFiltros} 
      />

      <RadioTetraList
        radios={radios}
        onAsignar={(radio) => {
          setRadioSeleccionado(radio);
          setModalAsignacion(true);
        }}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      {modalAsignacion && (
        <ModalAsignacionRadio
          radio={radioSeleccionado}
          onAsignar={handleAsignarPersonal}
          onClose={() => {
            setModalAsignacion(false);
            setRadioSeleccionado(null);
          }}
        />
      )}
    </div>
  );
};
```

---

**🎯 Con esta guía, el frontend tendrá todo lo necesario para implementar una pantalla completa y optimizada de mantenimiento de radios TETRA.**
