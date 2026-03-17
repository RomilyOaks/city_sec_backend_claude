# 🔧 **CORRECCIÓN DE CAMPOS EYE - Frontend a Backend**

## 📋 **PROBLEMA IDENTIFICADO**

Los campos `hora_llegada`, `personas_afectadas`, `perdidas_materiales` no se están pintando en el frontend porque **el backend los está buscando en la tabla incorrecta**.

---

## 🔍 **ANÁLISIS REALIZADO**

### **✅ Verificación en Base de Datos (MySQL):**
- **Tabla `operativos_vehiculos_novedades`**: ❌ NO tiene estos campos
- **Tabla `novedades_incidentes`**: ✅ SÍ tiene los campos:
  - `fecha_llegada` (datetime)
  - `num_personas_afectadas` (int) 
  - `perdidas_materiales_estimadas` (decimal)

### **✅ Datos Confirmados (ID: 99):**
```
- fecha_llegada: 2026-03-16T02:58:00.000Z
- num_personas_afectadas: 1
- perdidas_materiales_estimadas: 852.00
- cuadrante_code: CSS1A-01
- cuadrante_nombre: Cuadrante CSS1A-01
```

---

## 🛠️ **SOLUCIONES REQUERIDAS**

### **1. CORRECCIÓN EN `getEyeVehiculoNovedad()`**

**Archivo:** `src/controllers/operativosVehiculosNovedadesController.js`

**Problema:** Los campos se buscan en `data.hora_llegada` pero deberían buscarse en `data.novedad.fecha_llegada`

**Corrección requerida en el include de Novedad:**

```javascript
// EN LA FUNCIÓN getEyeVehiculoNovedad()
// MODIFICAR el include de Novedad para agregar los campos faltantes:

{
  model: Novedad,
  as: "novedad",
  attributes: [
    "id", 
    "novedad_code", 
    "descripcion",
    "fecha_llegada",                    // ← AGREGAR ESTE CAMPO
    "num_personas_afectadas",           // ← AGREGAR ESTE CAMPO  
    "perdidas_materiales_estimadas"     // ← AGREGAR ESTE CAMPO
  ],
  include: [
    // ... rest de includes existentes
  ]
}
```

### **2. CORRECCIÓN EN `getEyePersonalNovedad()`**

**Archivo:** `src/controllers/operativosPersonalNovedadesController.js`

**Misma corrección:** Agregar los mismos campos en el include de Novedad.

---

## 🎯 **REFERENCIA PARA FRONTEND (Corrección en el consumo)**

### **Nueva estructura de datos a usar:**

```jsx
// EN EyeVehiculoModal.jsx - CORREGIR LAS RUTAS DE ACCESO:

// ❌ ANTES (incorrecto):
data?.hora_llegada
data?.personas_afectadas
data?.perdidas_materiales

// ✅ AHORA (correcto):
data?.novedad?.fecha_llegada
data?.novedad?.num_personas_afectadas  
data?.novedad?.perdidas_materiales_estimadas

// ✅ Datos del cuadrante (ya funcionan):
data?.cuadranteOperativo?.cuadrante?.cuadrante_code
data?.cuadranteOperativo?.cuadrante?.nombre
```

### **Implementación en el componente:**

```jsx
<section className="detalles-operativo">
  <h3>Detalles del Operativo</h3>
  
  {/* Datos del Cuadrante */}
  <div className="campo">
    <label>Código Cuadrante:</label>
    <span>{data?.cuadranteOperativo?.cuadrante?.cuadrante_code || 'N/A'}</span>
  </div>
  
  <div className="campo">
    <label>Nombre Cuadrante:</label>
    <span>{data?.cuadranteOperativo?.cuadrante?.nombre || 'N/A'}</span>
  </div>
  
  {/* Campos del Operativo - CORREGIDOS */}
  <div className="campo">
    <label>Hora Llegada:</label>
    <span>
      {data?.novedad?.fecha_llegada 
        ? new Date(data.novedad.fecha_llegada).toLocaleString() 
        : 'N/A'}
    </span>
  </div>
  
  <div className="campo">
    <label>Personas Afectadas:</label>
    <span>{data?.novedad?.num_personas_afectadas || 0}</span>
  </div>
  
  <div className="campo">
    <label>Pérdidas Materiales:</label>
    <span>S/ {data?.novedad?.perdidas_materiales_estimadas || 0}</span>
  </div>
</section>
```

---

## 🔧 **OTRAS CORRECCIONES FRONTEND**

### **2. Comportamiento ESC:**
```jsx
// CORREGIR la navegación al presionar ESC:
const handleKeyDown = useCallback((e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    // Navegar a "Novedades del Cuadrante" en lugar de "Cuadrantes del Vehículo"
    navigate(`/operativos/vehiculos/${vehiculoId}/cuadrantes/${cuadranteId}/novedades`);
    onClose();
  }
}, [navigate, vehiculoId, cuadranteId, onClose]);
```

### **3. Homologación de Estilos:**
- Usar las mismas clases CSS que "Modal consulta Novedad"
- Mantener consistencia en títulos, botones y layout

---

## 📝 **RESUMEN PARA BACKEND**

### **🎯 Acciones requeridas:**

1. **En `operativosVehiculosNovedadesController.js`:**
   - Agregar `fecha_llegada`, `num_personas_afectadas`, `perdidas_materiales_estimadas` a los attributes del include de Novedad

2. **En `operativosPersonalNovedadesController.js`:**
   - Aplicar la misma corrección

3. **Verificar que los modelos Sequelize tengan estos campos definidos**

### **🔍 Campos correctos a usar:**
- `novedad.fecha_llegada` (no `data.hora_llegada`)
- `novedad.num_personas_afectadas` (no `data.personas_afectadas`)
- `novedad.perdidas_materiales_estimadas` (no `data.perdidas_materiales`)

---

## 🗄️ **VERIFICACIÓN SQL UTILIZADA**

```sql
-- Query que confirmó los datos existen en novedades_incidentes
SELECT 
  ovn.id,
  ovn.novedad_id,
  ni.fecha_llegada,
  ni.num_personas_afectadas,
  ni.perdidas_materiales_estimadas,
  ovc.cuadrante_id,
  c.cuadrante_code,
  c.nombre as cuadrante_nombre,
  ni.novedad_code
FROM operativos_vehiculos_novedades ovn
LEFT JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
LEFT JOIN cuadrantes c ON ovc.cuadrante_id = c.id
LEFT JOIN novedades_incidentes ni ON ovn.novedad_id = ni.id
WHERE ovn.id = 99
LIMIT 1;
```

---

## 📊 **ESTRUCTURA DE TABLAS REFERENCIA**

### **operativos_vehiculos_novedades (campos disponibles):**
```sql
- id
- operativo_vehiculo_cuadrante_id
- novedad_id
- reportado
- atendido
- estado
- prioridad
- observaciones
- acciones_tomadas
- resultado
- created_by
- created_at
- updated_by
- updated_at
```

### **novedades_incidentes (campos faltantes):**
```sql
- fecha_llegada
- num_personas_afectadas
- perdidas_materiales_estimadas
```

---

**Con estas correcciones, el frontend podrá mostrar correctamente todos los campos faltantes.** 🎯

**Fecha:** 17 de Marzo de 2026  
**Autor:** Frontend Team  
**Versión:** 1.0.0
