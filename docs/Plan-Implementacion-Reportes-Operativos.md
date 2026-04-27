# Plan de Implementación - Reportes de Operativos de Patrullaje

## Overview
Basado en las indicaciones y queries proporcionados, se presenta un plan completo para implementar endpoints de reportes de operativos de patrullaje que faciliten consultas, resúmenes y estadísticas por turnos, sectores, vehículos, personal a pie, cuadrantes y novedades atendidas.

---

## 1. Estructura de Archivos a Crear

### **Controller Principal**
```
src/controllers/reportesOperativosController.js
```

### **Rutas**
```
src/routes/reportes-operativos.routes.js
```

### **Validadores**
```
src/validators/reportesOperativos.validator.js
```

### **Servicios**
```
src/services/reportesOperativosService.js
```

---

## 2. Endpoints a Implementar

### **2.1 Reportes de Operativos Vehiculares**

#### **GET /api/v1/reportes-operativos/vehiculares**
- **Descripción**: Lista de novedades atendidas por patrullaje vehicular
- **Parámetros**:
  - `fecha_inicio` (opcional): Fecha de inicio del rango (YYYY-MM-DD)
  - `fecha_fin` (opcional): Fecha de fin del rango (YYYY-MM-DD)
  - `turno` (opcional): Tipo de turno (MAÑANA, TARDE, NOCHE)
  - `sector_id` (opcional): ID del sector
  - `vehiculo_id` (opcional): ID del vehículo
  - `conductor_id` (opcional): ID del conductor
  - `estado_novedad` (opcional): Estado de la novedad
  - `prioridad` (opcional): Prioridad de la novedad
  - `page` (opcional): Número de página (default: 1)
  - `limit` (opcional): Límite de resultados (default: 50)
  - `sort` (opcional): Campo de ordenamiento
  - `order` (opcional): Dirección ASC/DESC

#### **GET /api/v1/reportes-operativos/vehiculares/resumen**
- **Descripción**: Resumen estadístico de operativos vehiculares
- **Parámetros**: Mismos filtros que el endpoint principal
- **Retorna**: Estadísticas agregadas por turno, sector, vehículo, etc.

#### **GET /api/v1/reportes-operativos/vehiculares/exportar**
- **Descripción**: Exportar datos a Excel/CSV
- **Parámetros**: Mismos filtros + `formato` (excel/csv)

---

### **2.2 Reportes de Operativos a Pie**

#### **GET /api/v1/reportes-operativos/pie**
- **Descripción**: Lista de novedades atendidas por patrullaje a pie
- **Parámetros**:
  - `fecha_inicio` (opcional): Fecha de inicio del rango
  - `fecha_fin` (opcional): Fecha de fin del rango
  - `turno` (opcional): Tipo de turno
  - `sector_id` (opcional): ID del sector
  - `personal_id` (opcional): ID del personal
  - `cuadrante_id` (opcional): ID del cuadrante
  - `estado_novedad` (opcional): Estado de la novedad
  - `prioridad` (opcional): Prioridad de la novedad
  - `page`, `limit`, `sort`, `order` (opcional)

#### **GET /api/v1/reportes-operativos/pie/resumen**
- **Descripción**: Resumen estadístico de operativos a pie
- **Parámetros**: Mismos filtros
- **Retorna**: Estadísticas agregadas

#### **GET /api/v1/reportes-operativos/pie/exportar**
- **Descripción**: Exportar datos a Excel/CSV

---

### **2.3 Reportes de Novedades No Atendidas**

#### **GET /api/v1/reportes-operativos/no-atendidas**
- **Descripción**: Lista de novedades no atendidas por ningún operativo
- **Parámetros**:
  - `fecha_inicio` (opcional): Fecha de inicio del rango
  - `fecha_fin` (opcional): Fecha de fin del rango
  - `tipo_novedad_id` (opcional): ID del tipo de novedad
  - `prioridad` (opcional): Prioridad de la novedad
  - `sector_id` (opcional): ID del sector
  - `page`, `limit`, `sort`, `order` (opcional)

#### **GET /api/v1/reportes-operativos/no-atendidas/estadisticas**
- **Descripción**: Estadísticas de novedades no atendidas
- **Retorna**: Conteo por tipo, prioridad, sector, etc.

---

### **2.4 Reportes Combinados**

#### **GET /api/v1/reportes-operativos/combinados**
- **Descripción**: Reporte combinado de ambos tipos de operativos
- **Parámetros**: Filtros combinados
- **Retorna**: Datos unificados con indicador de tipo de operativo

#### **GET /api/v1/reportes-operativos/dashboard**
- **Descripción**: Dashboard con métricas clave
- **Retorna**: KPIs, gráficos, resúmenes ejecutivos

---

## 3. Estructura de Datos

### **3.1 Campos Principales para Operativos Vehiculares**

#### **Información del Turno**
- `fecha`, `nro_orden`, `turno`, `turno_horario_inicio`, `turno_horario_fin`
- `fecha_hora_inicio`, `fecha_hora_fin`, `operador_id`, `Usuario_Operador_Sistema`
- `sector_id`, `sector_code`, `nombre_sector`, `supervisor_id`, `Supervisor_Sector`

#### **Información del Vehículo**
- `vehiculo_id`, `tipo_vehiculo`, `codigo_vehiculo`, `nombre_vehiculo`
- `placa_vehiculo`, `marca_vehiculo`, `soat_vehiculo`, `vencimiento_soat`
- `proximo_mantenimiento`, `conductor_id`, `Nombres_conductor`, `Cargo_Conductor`
- `copiloto_id`, `Nombres_copiloto`, `Cargo_Copiloto`, `tipo_copiloto`

#### **Información Operativa**
- `radio_tetra_id`, `radio_tetra_code`, `Descripcion_Radio_Tetra`
- `Estado_Operativo`, `kilometraje_inicio`, `hora_inicio`, `nivel_combustible_inicio`
- `kilometraje_fin`, `hora_fin`, `nivel_combustible_fin`, `kilometros_recorridos`

#### **Información de Cuadrantes**
- `cuadrante_id`, `cuadrante_code`, `nombre`, `zona_code`
- `hora_ingreso`, `hora_salida`, `tiempo_minutos`, `incidentes_reportados`

#### **Información de Novedades**
- `novedad_id`, `novedad_code`, `fecha_hora_ocurrencia`
- `tipo_novedad_nombre`, `subtipo_novedad`, `prioridad`, `descripcion`
- `direccion`, `localizacion`, `latitud`, `longitud`
- `tiempo_respuesta_min`, `acciones_tomadas`

### **3.2 Campos Principales para Operativos a Pie**

#### **Información del Turno** (similar a vehicular)

#### **Información del Personal**
- `Personal_asignado`, `Cargo_Personal_Asignado`, `doc_tipo`, `doc_numero`
- `Personal_Auxiliar`, `Cargo_Personal_Auxiliar`, `nacionalidad`, `regimen`

#### **Equipamiento**
- `tipo_patrullaje`, `chaleco_balistico`, `porra_policial`, `esposas`
- `linterna`, `kit_primeros_auxilios`

#### **Resto de campos** (similares a vehicular)

---

## 4. Implementación Técnica

### **4.1 Servicios de Base de Datos**

#### **reportesOperativosService.js**
```javascript
// Queries optimizados basados en los SQL proporcionados
class ReportesOperativosService {
  static async getOperativosVehiculares(filtros) {
    // Implementación del query 1
  }
  
  static async getOperativosPie(filtros) {
    // Implementación del query 2
  }
  
  static async getNovedadesNoAtendidas(filtros) {
    // Implementación del query 3
  }
  
  static async getResumenVehicular(filtros) {
    // Query de agregación para resumen
  }
  
  static async getResumenPie(filtros) {
    // Query de agregación para resumen
  }
}
```

### **4.2 Controller Principal**

#### **reportesOperativosController.js**
```javascript
export const getOperativosVehiculares = async (req, res) => {
  try {
    const filtros = buildFilters(req.query);
    const { data, pagination } = await ReportesOperativosService.getOperativosVehiculares(filtros);
    
    res.json({
      success: true,
      message: "Operativos vehiculares obtenidos exitosamente",
      data,
      pagination
    });
  } catch (error) {
    handleError(res, error);
  }
};
```

### **4.3 Validadores**

#### **reportesOperativos.validator.js**
```javascript
export const validateReportesOperativos = [
  query("fecha_inicio").optional().isISO8601().withMessage("Fecha inválida"),
  query("fecha_fin").optional().isISO8601().withMessage("Fecha inválida"),
  query("turno").optional().isIn(["MAÑANA", "TARDE", "NOCHE"]),
  query("sector_id").optional().isInt({ min: 1 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 1000 }),
  handleValidationErrors
];
```

---

## 5. Optimizaciones y Mejores Prácticas

### **5.1 Optimización de Queries**
- **Índices**: Asegurar índices en campos de filtrado
- **Paginación**: Implementar cursor-based pagination para grandes datasets
- **Caching**: Cache para reportes frecuentes
- **Query Builder**: Usar Sequelize con includes optimizados

### **5.2 Performance**
- **Lazy Loading**: Cargar relaciones solo cuando se necesiten
- **Field Selection**: Permitir selección de campos específicos
- **Streaming**: Para exportaciones grandes
- **Background Jobs**: Para reportes pesados

### **5.3 Seguridad**
- **Validación estricta** de todos los parámetros
- **Rate limiting** para endpoints de exportación
- **Auditoría** de consultas de reportes
- **Permisos granulares** por tipo de reporte

---

## 6. Integración con Frontend

### **6.1 Respuesta Estandarizada**
```javascript
{
  "success": true,
  "message": "Datos obtenidos exitosamente",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25
  },
  "filters_applied": {...},
  "generated_at": "2026-04-23T14:30:00.000Z"
}
```

### **6.2 Endpoints de Exportación**
- **Excel**: Usar librería como `exceljs`
- **CSV**: Streaming directo
- **PDF**: Opcional con `puppeteer` o `jsPDF`

---

## 7. Plan de Implementación (Fases)

### **Fase 1: Fundamentos (1-2 días)**
1. Crear estructura de archivos
2. Implementar servicio base con queries SQL
3. Crear endpoints principales vehiculares
4. Implementar validadores básicos

### **Fase 2: Operativos a Pie (1 día)**
1. Adaptar queries para operativos a pie
2. Implementar endpoints correspondientes
3. Unificar lógica compartida

### **Fase 3: Novedades No Atendidas (0.5 día)**
1. Implementar queries de novedades no atendidas
2. Crear endpoint específico
3. Agregar estadísticas

### **Fase 4: Resúmenes y Estadísticas (1 día)**
1. Implementar endpoints de resumen
2. Crear agregaciones y KPIs
3. Optimizar performance

### **Fase 5: Exportación y Dashboard (1 día)**
1. Implementar exportación Excel/CSV
2. Crear endpoint de dashboard
3. Integrar con frontend existente

### **Fase 6: Optimización y Testing (0.5 día)**
1. Optimizar queries
2. Testing de carga
3. Documentación final

---

## 8. Dependencias y Librerías

### **Nuevas Dependencias**
```json
{
  "exceljs": "^4.4.0",
  "csv-writer": "^1.6.0",
  "moment": "^2.29.4"
}
```

### **Dependencias Existentes**
- Sequelize (ya disponible)
- express-validator (ya disponible)
- winston (para logging)

---

## 9. Consideraciones Adicionales

### **9.1 Timezone**
- Todos los timestamps deben manejarse en timezone de Perú (America/Lima)
- Usar funciones helper existentes para manejo de fechas

### **9.2 Soft Delete**
- Considerar `deleted_at` en todos los queries
- Filtrar registros activos por defecto

### **9.3 Auditoría**
- Registrar consultas de reportes importantes
- Log de accesos y filtros aplicados

### **9.4 Escalabilidad**
- Diseñar para manejar miles de registros
- Considerar particionamiento por fechas

---

## 10. Métricas de Éxito

### **10.1 Performance**
- Tiempo de respuesta < 2 segundos para reportes estándar
- < 5 segundos para reportes complejos con agregaciones

### **10.2 Funcionalidad**
- 100% de los campos del query original disponibles
- Todos los filtros funcionando correctamente
- Exportación funcionando para datasets grandes

### **10.3 Calidad**
- 0 errores de validación
- Logs completos y estructurados
- Documentación completa y actualizada

---

## **Próximos Pasos**

1. **Aprobar este plan** con el supervisor
2. **Comenzar Fase 1** con la estructura base
3. **Implementar incrementalmente** según las fases
4. **Testing continuo** con datos reales
5. **Integración** con frontend existente

**Este plan proporciona una guía completa para implementar todos los endpoints necesarios para el sistema de reportes de operativos de patrullaje CitySecure.**
