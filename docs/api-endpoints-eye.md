# 📋 **API Documentation - Endpoints EYE Individuales**

## 🎯 **Descripción General**

Los endpoints EYE (Eye) permiten consultar datos completos de operativos individuales en modo READ ONLY para mostrar en modales de consulta. Estos endpoints devuelven toda la información jerárquica del operativo incluyendo datos de la novedad, turno, vehículo/personal, cuadrante y usuarios.

## 🔧 **ÚLTIMA ACTUALIZACIÓN: 17 de Marzo de 2026**

### **✅ Correcciones aplicadas:**
- **Campos principales corregidos:** `fecha_llegada`, `num_personas_afectadas`, `perdidas_materiales_estimadas` ahora se incluyen desde la tabla `novedades_incidentes`
- **Nueva estructura de datos:** Los campos están disponibles en `data.novedad.*` en lugar de `data.*`
- **Endpoints actualizados:** Todos los endpoints EYE incluyen los campos faltantes

---

## 🚗 **Endpoint EYE Vehículos**

### **URLs Disponibles:**
```
# Ruta completa (con IDs jerárquicos)
GET /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades/eye/:id

# Ruta directa (recomendada para frontend)
GET /api/v1/operativos/vehiculos/cuadrantes/:cuadranteId/novedades/eye/:id
```

### **Parámetros:**
- `turnoId` (number) - ID del turno operativo (solo ruta completa)
- `vehiculoId` (number) - ID del vehículo operativo (solo ruta completa)
- `cuadranteId` (number) - ID del cuadrante asignado
- `id` (number) - ID del operativo vehículo novedad

### **Headers:**
- `Authorization: Bearer <token>` - Token de autenticación requerido

### **Permisos requeridos:**
- `operativos.vehiculos.novedades.read`

---

## 📊 **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Datos del operativo obtenidos para consulta",
  "data": {
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
      },
      "novedadVehiculo": {
        "id": null,
        "codigo_vehiculo": null,
        "placa": null
      }
    },
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
  "meta": {
    "mode": "READ_ONLY",
    "permission": "operativos.vehiculos.novedades.read",
    "modalType": "Atender Novedad",
    "eyeTriggered": true
  }
}
```

---

## 🚶 **Endpoint EYE Personal**

### **URL:**
```
GET /api/v1/operativos/personal/cuadrantes/:cuadranteId/novedades/eye/:id
```

### **Parámetros:**
- `cuadranteId` (number) - ID del cuadrante asignado
- `id` (number) - ID del operativo personal novedad

### **Headers:**
- `Authorization: Bearer <token>` - Token de autenticación requerido

### **Permisos requeridos:**
- `operativos.personal.novedades.read`

---

## 📊 **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Datos del operativo obtenidos para consulta",
  "data": {
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
  "meta": {
    "mode": "READ_ONLY",
    "permission": "operativos.personal.novedades.read",
    "modalType": "Actualizar Novedad",
    "eyeTriggered": true
  }
}
```

---

## 🔍 **Respuestas de Error**

### **No encontrado (404)**
```json
{
  "status": "error",
  "message": "Operativo de vehículo no encontrado"
}
```

### **Error de validación (400)**
```json
{
  "status": "error",
  "message": "El ID de la novedad debe ser un número entero positivo.",
  "errors": [
    {
      "field": "id",
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

### **1. Campos Principales (solo primer operativo puede llenar):**
- `resultado` - Estado final del incidente (en `data.resultado`)
- `fecha_llegada` - Tiempo de llegada al lugar (en `data.novedad.fecha_llegada`)
- `num_personas_afectadas` - Número de personas afectadas (en `data.novedad.num_personas_afectadas`)
- `perdidas_materiales_estimadas` - Pérdidas económicas estimadas (en `data.novedad.perdidas_materiales_estimadas`)

### **2. Campos Secundarios (ambos operativos pueden llenar):**
- `acciones_tomadas` - Descripción de acciones realizadas
- `observaciones` - Observaciones adicionales

### **3. Estructura de datos anidados importantes:**
- `data.novedad.*` - Datos completos de la novedad (código, tipo, estado, etc.)
- `data.cuadranteOperativo.operativoVehiculo.*` - Datos del vehículo y personal asignado
- `data.cuadranteOperativo.operativoPersonal.*` - Datos del personal operativo
- `data.cuadranteOperativo.turno.*` - Información del turno

### **4. Datos del personal y vehículo:**
#### **Vehículo:**
- `data.cuadranteOperativo.operativoVehiculo.vehiculo.*` - Datos del vehículo
- `data.cuadranteOperativo.operativoVehiculo.conductor.*` - Datos del conductor
- `data.cuadranteOperativo.operativoVehiculo.copiloto.*` - Datos del copiloto

#### **Personal:**
- `data.cuadranteOperativo.operativoPersonal.personal.*` - Datos del personal principal
- `data.cuadranteOperativo.operativoPersonal.sereno.*` - Datos del sereno/compañero

### **5. Metadatos útiles para UI:**
- `meta.mode` - Siempre "READ_ONLY" para estos endpoints
- `meta.modalType` - "Atender Novedad" para vehículos, "Actualizar Novedad" para personal
- `meta.eyeTriggered` - Indica que es un endpoint EYE (para tracking)

### **6. Campos de auditoría:**
- `creador*` - Usuario que registró el operativo
- `actualizador*` - Usuario que actualizó por última vez
- `created_at` - Fecha y hora de registro
- `updated_at` - Fecha y hora de última actualización

### **7. Estados y prioridades:**
- `data.estado` - 0=Inactivo, 1=Activo, 2=Atendido
- `data.resultado` - "PENDIENTE", "RESUELTO", "ESCALADO", "CANCELADO"
- `data.prioridad` - "BAJA", "MEDIA", "ALTA", "URGENTE"

### **8. Formatos de fecha:**
- Todas las fechas vienen en formato ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Para mostrar en UI, considerar convertir a timezone local del usuario

### **9. ⚠️ CORRECCIONES IMPORTANTES (17/03/2026):**

#### **Campos movidos a `data.novedad.*`:**
- ❌ `data.hora_llegada` → ✅ `data.novedad.fecha_llegada`
- ❌ `data.personas_afectadas` → ✅ `data.novedad.num_personas_afectadas`
- ❌ `data.perdidas_materiales` → ✅ `data.novedad.perdidas_materiales_estimadas`

#### **Ejemplo de acceso correcto:**
```jsx
// ✅ FORMA CORRECTA:
const horaLlegada = data?.novedad?.fecha_llegada;
const personasAfectadas = data?.novedad?.num_personas_afectadas;
const perdidasMateriales = data?.novedad?.perdidas_materiales_estimadas;

// ❌ FORMA INCORRECTA (ya no funciona):
const horaLlegada = data?.hora_llegada;  // undefined
const personasAfectadas = data?.personas_afectadas;  // undefined
```

---

## 🚀 **Ejemplo de Implementación Frontend**

### **React Component Example:**
```jsx
import React, { useState, useEffect } from 'react';

const EyeVehiculoModal = ({ operativoId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOperativo = async () => {
      try {
        const response = await fetch(`/api/v1/operativos/128/vehiculos/93/cuadrantes/79/novedades/eye/${operativoId}`, {
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
        setError('Error al cargar datos del operativo');
      } finally {
        setLoading(false);
      }
    };

    fetchOperativo();
  }, [operativoId]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No se encontraron datos</div>;

  return (
    <div className="modal-eye">
      <h2>{data.meta.modalType}</h2>
      
      {/* Datos de la Novedad */}
      <section>
        <h3>Información de la Novedad</h3>
        <p><strong>Código:</strong> {data.novedad.novedad_code}</p>
        <p><strong>Descripción:</strong> {data.novedad.descripcion}</p>
        <p><strong>Estado:</strong> 
          <span style={{ color: data.novedad.novedadEstado.color_hex }}>
            {data.novedad.novedadEstado.nombre}
          </span>
        </p>
      </section>

      {/* Datos del Operativo */}
      <section>
        <h3>Datos del Operativo</h3>
        <p><strong>Resultado:</strong> {data.resultado || 'No definido'}</p>
        <p><strong>Hora de llegada:</strong> 
          {data.novedad?.fecha_llegada 
            ? new Date(data.novedad.fecha_llegada).toLocaleString() 
            : 'N/A'}
        </p>
        <p><strong>Personas afectadas:</strong> {data.novedad?.num_personas_afectadas || 0}</p>
        <p><strong>Pérdidas materiales:</strong> S/ {data.novedad?.perdidas_materiales_estimadas || 0}</p>
        <p><strong>Acciones tomadas:</strong> {data.acciones_tomadas || 'N/A'}</p>
        <p><strong>Observaciones:</strong> {data.observaciones || 'N/A'}</p>
      </section>

      {/* Datos del Vehículo */}
      <section>
        <h3>Vehículo Asignado</h3>
        <p><strong>Vehículo:</strong> {data.cuadranteOperativo.operativoVehiculo.vehiculo.codigo_vehiculo}</p>
        <p><strong>Placa:</strong> {data.cuadranteOperativo.operativoVehiculo.vehiculo.placa}</p>
        <p><strong>Conductor:</strong> {data.cuadranteOperativo.operativoVehiculo.conductor.nombres} {data.cuadranteOperativo.operativoVehiculo.conductor.apellido_paterno}</p>
        <p><strong>Copiloto:</strong> {data.cuadranteOperativo.operativoVehiculo.copiloto?.nombres} {data.cuadranteOperativo.operativoVehiculo.copiloto?.apellido_paterno}</p>
      </section>

      {/* Auditoría */}
      <section>
        <h3>Información de Registro</h3>
        <p><strong>Registrado por:</strong> {data.creadorOperativosVehiculosNovedades.nombres} {data.creadorOperativosVehiculosNovedades.apellidos}</p>
        <p><strong>Fecha de registro:</strong> {new Date(data.created_at).toLocaleString()}</p>
        <p><strong>Actualizado por:</strong> {data.actualizadorOperativosVehiculosNovedades?.nombres} {data.actualizadorOperativosVehiculosNovedades?.apellidos}</p>
      </section>

      <button onClick={onClose}>Cerrar</button>
    </div>
  );
};

export default EyeVehiculoModal;
```

---

## 📝 **Notas Importantes**

1. **Autenticación:** Todos los +endpoints requieren token JWT válido
2. **Permisos:** Verificar que el usuario tenga los permisos requeridos
3. **Manejo de errores:** Implementar manejo adecuado de errores 404, 400, 500
4. **Timezone:** Considerar convertir fechas a timezone local del usuario
5. **Campos opcionales:** Muchos campos pueden ser null, manejar casos vacíos
6. **Modo READ ONLY:** Estos endpoints son solo para consulta, no permiten modificaciones

---

## 🔗 **Endpoint Combinado Adicional**

### **Consulta unificada de ambos operativos:**
Existe también un endpoint que obtiene ambos operativos (vehículo + personal) para una misma novedad en una sola llamada:

**Documentación completa:** [Ver `api-endpoint-combinado.md`](./api-endpoint-combinado.md)

**URL:** `GET /api/v1/operativos/novedades/:novedadId/combinadas`

**Características:**
- ✅ Obtiene ambos operativos en una sola llamada
- ✅ Analiza quién llenó qué campos
- ✅ Determina orden de llegada
- ✅ Estado general consolidado
- ✅ Incluye campos principales corregidos

---

**Última actualización: 17 de Marzo de 2026**
**Versión: 1.1.0**
**Autor: Backend Team**
