# 📋 **API Documentation - Endpoint Combinado**

## 🎯 **Descripción General**

El endpoint combinado permite consultar ambos operativos (vehículo y personal) para una misma novedad en una sola llamada. Muestra quién llegó primero, qué campos llenó cada uno, y proporciona un análisis completo de la situación.

## 🔧 **ÚLTIMA ACTUALIZACIÓN: 17 de Marzo de 2026**

### **✅ Características principales:**
- **Consulta unificada:** Obtiene ambos operativos en una sola llamada
- **Análisis de campos:** Identifica quién llenó qué campos
- **Orden de llegada:** Determina quién llegó primero a la escena
- **Estado general:** Consolidado del estado de la novedad
- **Campos corregidos:** Incluye los campos principales desde `novedades_incidentes`

---

## 🔗 **Endpoint Combinado**

### **URL:**
```
GET /api/v1/operativos/novedades/:novedadId/combinadas
```

### **Parámetros:**
- `novedadId` (number) - ID de la novedad a consultar

### **Headers:**
- `Authorization: Bearer <token>` - Token de autenticación requerido

### **Permisos requeridos:**
- `operativos.combinados.read`

---

## 📊 **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Operativos combinados obtenidos exitosamente",
  "data": {
    "novedad": {
      "id": 45,
      "novedad_code": "NOV-2026-045",
      "descripcion": "Accidente de tránsito con heridos",
      "fecha_llegada": "2026-03-16T15:40:00.000Z",
      "num_personas_afectadas": 3,
      "perdidas_materiales_estimadas": 150.50,
      "novedadEstado": {
        "id": 3,
        "nombre": "Resuelto",
        "color_hex": "#10B981",
        "icono": "check-circle",
        "orden": 3
      },
      "novedadTipoNovedad": {
        "id": 2,
        "nombre": "Accidente",
        "color_hex": "#EF4444",
        "icono": "car-crash"
      },
      "novedadSubtipoNovedad": {
        "id": 5,
        "nombre": "Accidente de tránsito",
        "descripcion": "Colisión entre vehículos",
        "prioridad": "ALTA",
        "tiempo_respuesta_min": 15
      },
      "novedadSector": {
        "id": 3,
        "nombre": "Sector Centro",
        "sector_code": "SEC-003"
      },
      "novedadCuadrante": {
        "id": 12,
        "nombre": "Cuadrante 12-A",
        "cuadrante_code": "CUA-012A"
      }
    },
    "operativo_vehiculo": {
      "existe": true,
      "datos": {
        "id": 99,
        "operativo_vehiculo_cuadrante_id": 79,
        "novedad_id": 45,
        "reportado": "2026-03-16T15:30:00.000Z",
        "atendido": "2026-03-16T15:45:00.000Z",
        "resultado": "RESUELTO",
        "prioridad": "MEDIA",
        "estado": 2,
        "observaciones": "Incidente resuelto con asistencia médica",
        "acciones_tomadas": "Se coordinó con emergencias y se trasladó a afectados",
        "created_at": "2026-03-16T15:50:00.000Z",
        "updated_at": "2026-03-16T16:20:00.000Z",
        "cuadranteOperativo": {
          "id": 79,
          "operativo_vehiculo_id": 93,
          "cuadrante_id": 12,
          "hora_ingreso": "2026-03-16T14:00:00.000Z",
          "hora_salida": "2026-03-16T18:00:00.000Z",
          "operativoVehiculo": {
            "id": 93,
            "kilometraje_inicio": 15420,
            "kilometraje_fin": 15480,
            "nivel_combustible_inicio": 75,
            "nivel_combustible_fin": 68,
            "hora_inicio": "2026-03-16T14:00:00.000Z",
            "hora_fin": "2026-03-16T18:00:00.000Z",
            "turno": {
              "id": 128,
              "turno": "MAÑANA",
              "fecha": "2026-03-16",
              "fecha_hora_inicio": "2026-03-16T06:00:00.000Z",
              "fecha_hora_fin": "2026-03-16T14:00:00.000Z"
            },
            "vehiculo": {
              "id": 15,
              "codigo_vehiculo": "VH-015",
              "placa": "ABC-123",
              "marca": "Toyota",
              "modelo_vehiculo": "Hilux",
              "color_vehiculo": "Blanco"
            },
            "conductor": {
              "id": 45,
              "nombres": "Juan Carlos",
              "apellido_paterno": "Pérez",
              "apellido_materno": "López",
              "codigo_acceso": "PER-045"
            },
            "copiloto": {
              "id": 67,
              "nombres": "María Elena",
              "apellido_paterno": "García",
              "apellido_materno": "Sánchez",
              "codigo_acceso": "GAR-067"
            }
          },
          "cuadrante": {
            "id": 12,
            "nombre": "Cuadrante 12-A",
            "cuadrante_code": "CUA-012A",
            "sector_id": 3
          }
        },
        "creadorOperativosVehiculosNovedades": {
          "id": 12,
          "username": "jperez",
          "nombres": "Juan",
          "apellidos": "Pérez González"
        },
        "actualizadorOperativosVehiculosNovedades": {
          "id": 15,
          "username": "mgarcia",
          "nombres": "María",
          "apellidos": "García López"
        }
      },
      "campos_llenados": ["resultado", "hora_llegada", "personas_afectadas", "perdidas_materiales", "acciones_tomadas", "observaciones"],
      "acciones_tomadas": "Se coordinó con emergencias y se trasladó a afectados",
      "observaciones": "Incidente resuelto con asistencia médica",
      "fecha_registro": "2026-03-16T15:50:00.000Z",
      "registrado_por": {
        "id": 12,
        "username": "jperez",
        "nombres": "Juan",
        "apellidos": "Pérez González"
      }
    },
    "operativo_personal": {
      "existe": true,
      "datos": {
        "id": 156,
        "operativo_personal_cuadrante_id": 45,
        "novedad_id": 45,
        "reportado": "2026-03-16T15:30:00.000Z",
        "atendido": "2026-03-16T15:50:00.000Z",
        "resultado": null,
        "prioridad": "MEDIA",
        "estado": 2,
        "observaciones": "Se proporcionó primeros auxilios y se aseguró la zona",
        "acciones_tomadas": "Se controló el tráfico hasta llegar la unidad de emergencia",
        "created_at": "2026-03-16T16:10:00.000Z",
        "updated_at": "2026-03-16T16:15:00.000Z",
        "cuadranteOperativo": {
          "id": 45,
          "operativo_personal_id": 78,
          "cuadrante_id": 12,
          "hora_ingreso": "2026-03-16T14:00:00.000Z",
          "hora_salida": "2026-03-16T18:00:00.000Z",
          "operativoPersonal": {
            "id": 78,
            "hora_inicio": "2026-03-16T14:00:00.000Z",
            "hora_fin": "2026-03-16T18:00:00.000Z",
            "turno": {
              "id": 128,
              "turno": "MAÑANA",
              "fecha": "2026-03-16",
              "fecha_hora_inicio": "2026-03-16T06:00:00.000Z",
              "fecha_hora_fin": "2026-03-16T14:00:00.000Z"
            },
            "personal": {
              "id": 89,
              "nombres": "Carlos Alberto",
              "apellido_paterno": "Rodríguez",
              "apellido_materno": "Martínez",
              "codigo_acceso": "ROD-089"
            },
            "sereno": {
              "id": 102,
              "nombres": "Luis Fernando",
              "apellido_paterno": "Díaz",
              "apellido_materno": "Torres",
              "codigo_acceso": "DIA-102"
            }
          },
          "datosCuadrante": {
            "id": 12,
            "nombre": "Cuadrante 12-A",
            "cuadrante_code": "CUA-012A",
            "sector_id": 3
          }
        },
        "creadorOperativosPersonalNovedades": {
          "id": 25,
          "username": "crodriguez",
          "nombres": "Carlos",
          "apellidos": "Rodríguez Martínez"
        },
        "actualizadorOperativosPersonalNovedades": {
          "id": 25,
          "username": "crodriguez",
          "nombres": "Carlos",
          "apellidos": "Rodríguez Martínez"
        }
      },
      "campos_llenados": ["acciones_tomadas", "observaciones"],
      "acciones_tomadas": "Se controló el tráfico hasta llegar la unidad de emergencia",
      "observaciones": "Se proporcionó primeros auxilios y se aseguró la zona",
      "fecha_registro": "2026-03-16T16:10:00.000Z",
      "registrado_por": {
        "id": 25,
        "username": "crodriguez",
        "nombres": "Carlos",
        "apellidos": "Rodríguez Martínez"
      }
    },
    "estado_general": "RESUELTO",
    "primer_operativo": "vehiculo",
    "segundo_operativo": "personal",
    "resumen": {
      "total_operativos": 2,
      "campos_principales_completos": ["resultado", "hora_llegada", "personas_afectadas", "perdidas_materiales"],
      "campos_secundarios_completos": ["acciones_tomadas_vehiculo", "observaciones_vehiculo", "acciones_tomadas_personal", "observaciones_personal"],
      "ambos_operativos_presentes": true
    }
  }
}
```

---

## 🔍 **Respuestas de Error**

### **No encontrado (404)**
```json
{
  "status": "error",
  "message": "Novedad no encontrada"
}
```

### **Error de validación (400)**
```json
{
  "status": "error",
  "message": "El ID de la novedad debe ser un número entero positivo.",
  "errors": [
    {
      "field": "novedadId",
      "message": "El ID de la novedad debe ser un número entero positivo.",
      "value": "abc"
    }
  ]
}
```

### **Error interno (500)**
```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "Detailed error message"
}
```

---

## 💡 **Guía de Implementación para Frontend**

### **1. Estructura de respuesta principal:**
- `data.novedad.*` - Datos completos de la novedad (incluyendo campos principales)
- `data.operativo_vehiculo.*` - Información completa del operativo de vehículo
- `data.operativo_personal.*` - Información completa del operativo de personal
- `data.estado_general` - Estado consolidado de la novedad
- `data.primer_operativo` - Quién llegó primero ("vehiculo" o "personal")
- `data.segundo_operativo` - Quién llegó segundo
- `data.resumen.*` - Resumen estadístico de la situación

### **2. Campos principales (desde novedad):**
```jsx
// ✅ FORMA CORRECTA - Campos principales en data.novedad.*
const horaLlegada = data?.novedad?.fecha_llegada;
const personasAfectadas = data?.novedad?.num_personas_afectadas;
const perdidasMateriales = data?.novedad?.perdidas_materiales_estimadas;
```

### **3. Campos secundarios (por operativo):**
```jsx
// ✅ Campos secundarios en cada operativo
const accionesVehiculo = data?.operativo_vehiculo?.acciones_tomadas;
const accionesPersonal = data?.operativo_personal?.acciones_tomadas;
const obsVehiculo = data?.operativo_vehiculo?.observaciones;
const obsPersonal = data?.operativo_personal?.observaciones;
```

### **4. Análisis de quién llenó qué:**
```jsx
// ✅ Campos llenados por cada operativo
const camposVehiculo = data?.operativo_vehiculo?.campos_llenados;
const camposPersonal = data?.operativo_personal?.campos_llenados;

// ✅ Orden de llegada
const primero = data?.primer_operativo; // "vehiculo" o "personal"
const segundo = data?.segundo_operativo;
```

### **5. Datos de personal y vehículo:**
```jsx
// ✅ Datos del vehículo
const vehiculo = data?.operativo_vehiculo?.datos?.cuadranteOperativo?.operativoVehiculo?.vehiculo;
const conductor = data?.operativo_vehiculo?.datos?.cuadranteOperativo?.operativoVehiculo?.conductor;

// ✅ Datos del personal
const personal = data?.operativo_personal?.datos?.cuadranteOperativo?.operativoPersonal?.personal;
const sereno = data?.operativo_personal?.datos?.cuadranteOperativo?.operativoPersonal?.sereno;
```

---

## 🚀 **Ejemplo de Implementación Frontend**

### **React Component Example:**
```jsx
import React, { useState, useEffect } from 'react';

const OperativosCombinadosModal = ({ novedadId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOperativosCombinados = async () => {
      try {
        const response = await fetch(`/api/v1/operativos/novedades/${novedadId}/combinadas`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Error al cargar datos combinados');
      } finally {
        setLoading(false);
      }
    };

    fetchOperativosCombinados();
  }, [novedadId]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No se encontraron datos</div>;

  return (
    <div className="modal-combinado">
      <h2>Operativos Combinados - {data.novedad.novedad_code}</h2>
      
      {/* Información de la Novedad */}
      <section>
        <h3>Información de la Novedad</h3>
        <p><strong>Código:</strong> {data.novedad.novedad_code}</p>
        <p><strong>Descripción:</strong> {data.novedad.descripcion}</p>
        <p><strong>Estado:</strong> 
          <span style={{ color: data.novedad.novedadEstado.color_hex }}>
            {data.novedad.novedadEstado.nombre}
          </span>
        </p>
        <p><strong>Estado General:</strong> {data.estado_general}</p>
        <p><strong>Orden de llegada:</strong> {data.primer_operativo} → {data.segundo_operativo}</p>
      </section>

      {/* Campos Principales (desde novedad) */}
      <section>
        <h3>Datos Principales del Incidente</h3>
        <p><strong>Hora de llegada:</strong> 
          {data.novedad?.fecha_llegada 
            ? new Date(data.novedad.fecha_llegada).toLocaleString() 
            : 'N/A'}
        </p>
        <p><strong>Personas afectadas:</strong> {data.novedad?.num_personas_afectadas || 0}</p>
        <p><strong>Pérdidas materiales:</strong> S/ {data.novedad?.perdidas_materiales_estimadas || 0}</p>
      </section>

      {/* Operativo de Vehículo */}
      {data.operativo_vehiculo.existe && (
        <section>
          <h3>🚗 Operativo de Vehículo {data.primer_operativo === 'vehiculo' ? '(1° en llegar)' : '(2° en llegar)'}</h3>
          <p><strong>Registrado por:</strong> {data.operativo_vehiculo.registrado_por.nombres} {data.operativo_vehiculo.registrado_por.apellidos}</p>
          <p><strong>Fecha de registro:</strong> {new Date(data.operativo_vehiculo.fecha_registro).toLocaleString()}</p>
          <p><strong>Resultado:</strong> {data.operativo_vehiculo.datos.resultado || 'No definido'}</p>
          <p><strong>Acciones tomadas:</strong> {data.operativo_vehiculo.acciones_tomadas || 'N/A'}</p>
          <p><strong>Observaciones:</strong> {data.operativo_vehiculo.observaciones || 'N/A'}</p>
          
          {/* Datos del vehículo */}
          <div className="vehiculo-info">
            <h4>Datos del Vehículo</h4>
            <p><strong>Vehículo:</strong> {data.operativo_vehiculo.datos.cuadranteOperativo.operativoVehiculo.vehiculo.codigo_vehiculo}</p>
            <p><strong>Placa:</strong> {data.operativo_vehiculo.datos.cuadranteOperativo.operativoVehiculo.vehiculo.placa}</p>
            <p><strong>Conductor:</strong> {data.operativo_vehiculo.datos.cuadranteOperativo.operativoVehiculo.conductor.nombres} {data.operativo_vehiculo.datos.cuadranteOperativo.operativoVehiculo.conductor.apellido_paterno}</p>
          </div>
        </section>
      )}

      {/* Operativo de Personal */}
      {data.operativo_personal.existe && (
        <section>
          <h3>🚶 Operativo de Personal {data.primer_operativo === 'personal' ? '(1° en llegar)' : '(2° en llegar)'}</h3>
          <p><strong>Registrado por:</strong> {data.operativo_personal.registrado_por.nombres} {data.operativo_personal.registrado_por.apellidos}</p>
          <p><strong>Fecha de registro:</strong> {new Date(data.operativo_personal.fecha_registro).toLocaleString()}</p>
          <p><strong>Acciones tomadas:</strong> {data.operativo_personal.acciones_tomadas || 'N/A'}</p>
          <p><strong>Observaciones:</strong> {data.operativo_personal.observaciones || 'N/A'}</p>
          
          {/* Datos del personal */}
          <div className="personal-info">
            <h4>Datos del Personal</h4>
            <p><strong>Personal:</strong> {data.operativo_personal.datos.cuadranteOperativo.operativoPersonal.personal.nombres} {data.operativo_personal.datos.cuadranteOperativo.operativoPersonal.personal.apellido_paterno}</p>
            <p><strong>Sereno:</strong> {data.operativo_personal.datos.cuadranteOperativo.operativoPersonal.sereno?.nombres} {data.operativo_personal.datos.cuadranteOperativo.operativoPersonal.sereno?.apellido_paterno}</p>
          </div>
        </section>
      )}

      {/* Resumen */}
      <section>
        <h3>📊 Resumen de la Situación</h3>
        <p><strong>Total operativos:</strong> {data.resumen.total_operativos}</p>
        <p><strong>Ambos operativos presentes:</strong> {data.resumen.ambos_operativos_presentes ? 'Sí' : 'No'}</p>
        <div>
          <strong>Campos principales completos:</strong>
          <ul>
            {data.resumen.campos_principales_completos.map((campo, index) => (
              <li key={index}>{campo}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Campos secundarios completos:</strong>
          <ul>
            {data.resumen.campos_secundarios_completos.map((campo, index) => (
              <li key={index}>{campo}</li>
            ))}
          </ul>
        </div>
      </section>

      <button onClick={onClose}>Cerrar</button>
    </div>
  );
};

export default OperativosCombinadosModal;
```

---

## 📝 **Notas Importantes**

1. **Autenticación:** Requiere token JWT válido
2. **Permisos:** Verificar que el usuario tenga `operativos.combinados.read`
3. **Manejo de errores:** Implementar manejo adecuado de errores 404, 400, 500
4. **Timezone:** Considerar convertir fechas a timezone local del usuario
5. **Campos opcionales:** Muchos campos pueden ser null, manejar casos vacíos
6. **Orden de llegada:** El endpoint determina automáticamente quién llegó primero basado en `created_at`

---

## 🔍 **Casos de Uso Típicos**

### **1. Solo vehículo presente:**
```json
{
  "operativo_vehiculo": { "existe": true, ... },
  "operativo_personal": { "existe": false, ... },
  "primer_operativo": "vehiculo",
  "segundo_operativo": null
}
```

### **2. Solo personal presente:**
```json
{
  "operativo_vehiculo": { "existe": false, ... },
  "operativo_personal": { "existe": true, ... },
  "primer_operativo": "personal",
  "segundo_operativo": null
}
```

### **3. Ambos presentes:**
```json
{
  "operativo_vehiculo": { "existe": true, ... },
  "operativo_personal": { "existe": true, ... },
  "primer_operativo": "vehiculo", // o "personal"
  "segundo_operativo": "personal" // o "vehiculo"
}
```

---

**Última actualización: 17 de Marzo de 2026**  
**Versión: 1.0.0**  
**Autor: Backend Team**
