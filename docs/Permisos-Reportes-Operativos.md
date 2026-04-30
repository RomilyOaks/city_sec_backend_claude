# 🔐 Permisos Reportes Operativos - Documentación

## 📋 Permisos Específicos para Módulo de Reportes Operativos

### **🎯 Dashboard Reportes**
- **Permiso:** `reportes.operativos_dashboard.read`
- **Descripción:** Dashboard Reportes - Ver KPIs y métricas operativas
- **Endpoint:** `/api/v1/reportes-operativos/dashboard`
- **Funcionalidad:** Acceso completo al dashboard con KPIs, análisis y tendencias

- **Permiso:** `reportes.operativos_dashboard.export`
- **Descripción:** Dashboard Reportes - Exportar datos (XLS/CSV)
- **Endpoint:** `/api/v1/reportes-operativos/combinados/exportar`
- **Funcionalidad:** Exportación completa de datos del dashboard

---

### **🚗 Operativos Vehiculares**
- **Permiso:** `reportes.operativos_vehiculares.read`
- **Descripción:** Operativos Vehiculares - Ver listado y detalles
- **Endpoints:** 
  - `/api/v1/reportes-operativos/vehiculares`
  - `/api/v1/reportes-operativos/vehiculares/resumen`
- **Funcionalidad:** Acceso a listado completo y resumen estadístico

- **Permiso:** `reportes.operativos_vehiculares.export`
- **Descripción:** Operativos Vehiculares - Exportar datos (XLS/CSV)
- **Endpoint:** `/api/v1/reportes-operativos/vehiculares/exportar`
- **Funcionalidad:** Exportación de datos vehiculares con filtros

---

### **🚶 Operativos a Pie**
- **Permiso:** `reportes.operativos_personales.read`
- **Descripción:** Operativos a Pie - Ver listado y detalles
- **Endpoints:**
  - `/api/v1/reportes-operativos/pie`
  - `/api/v1/reportes-operativos/pie/resumen`
- **Funcionalidad:** Acceso a listado completo y resumen estadístico

- **Permiso:** `reportes.operativos_personales.export`
- **Descripción:** Operativos a Pie - Exportar datos (XLS/CSV)
- **Endpoint:** `/api/v1/reportes-operativos/pie/exportar`
- **Funcionalidad:** Exportación de datos de operativos a pie con filtros

---

### **⚠️ Novedades no Atendidas**
- **Permiso:** `reportes.novedades_no_atendidas.read`
- **Descripción:** Novedades no Atendidas - Ver listado y análisis
- **Endpoints:**
  - `/api/v1/reportes-operativos/no-atendidas`
  - `/api/v1/reportes-operativos/no-atendidas/resumen`
- **Funcionalidad:** Acceso a análisis de novedades sin atención

- **Permiso:** `reportes.novedades_no_atendidas.export`
- **Descripción:** Novedades no Atendidas - Exportar datos (XLS/CSV)
- **Endpoint:** `/api/v1/reportes-operativos/no-atendidas/exportar`
- **Funcionalidad:** Exportación de datos de novedades no atendidas

---

## 🔄 Estructura de Permisos

### **Formato de Slug:**
```
{modulo}.{recurso}.{accion}
```

### **Módulo:** `reportes`
### **Recursos:**
- `operativos_dashboard` - Dashboard principal
- `operativos_vehiculares` - Operativos vehiculares
- `operativos_personales` - Operativos a pie
- `novedades_no_atendidas` - Novedades no atendidas

### **Acciones:**
- `read` - Acceso de lectura/visualización
- `export` - Exportación de datos (XLS/CSV)

---

## 🎯 Implementación Frontend

### **Verificación de Permisos:**
```javascript
// Verificar acceso a dashboard
const canReadDashboard = user.permisos.some(p => p.slug === 'reportes.operativos_dashboard.read');

// Verificar acceso a exportación vehicular
const canExportVehiculares = user.permisos.some(p => p.slug === 'reportes.operativos_vehiculares.export');

// Verificar acceso a operativos a pie
const canReadOperativosPie = user.permisos.some(p => p.slug === 'reportes.operativos_personales.read');

// Verificar acceso a novedades no atendidas
const canReadNoAtendidas = user.permisos.some(p => p.slug === 'reportes.novedades_no_atendidas.read');
```

### **Configuración de Rutas Protegidas:**
```javascript
// Configuración de permisos por ruta
const routePermissions = {
  '/reportes/dashboard': 'reportes.operativos_dashboard.read',
  '/reportes/vehiculares': 'reportes.operativos_vehiculares.read',
  '/reportes/pie': 'reportes.operativos_personales.read',
  '/reportes/no-atendidas': 'reportes.novedades_no_atendidas.read',
  '/reportes/exportar': 'reportes.operativos_dashboard.export'
};
```

---

## 📊 Actualización del Seeder

### **Archivo Modificado:**
- `src/seeders/seedRBAC.js` - Versión 2.3.0

### **Cambios Realizados:**
1. **Reemplazo** de 5 permisos genéricos de reportes
2. **Adición** de 8 permisos específicos para operativos
3. **Mantenimiento** de compatibilidad con sistema RBAC existente

### **Ejecución:**
```bash
npm run seed:rbac
```

---

## 🔄 Migración desde Permisos Antiguos

### **Permisos Removidos:**
- `reportes.novedades.read` → Reemplazado por permisos específicos
- `reportes.personal.read` → Reemplazado por `operativos_personales.read`
- `reportes.vehiculos.read` → Reemplazado por `operativos_vehiculares.read`
- `reportes.mantenimientos.read` → Ya no aplica a operativos
- `reportes.exportar.execute` → Reemplazado por permisos específicos de exportación

### **Permisos Nuevos:**
- 8 permisos específicos con granularidad fina
- Separación clara entre lectura y exportación
- Nomenclatura consistente y descriptiva

---

## 🎯 Notas Importantes

1. **Super Admin** tiene acceso automático a todos los permisos
2. **Roles personalizados** deben asignar estos permisos manualmente
3. **Frontend** debe actualizar las validaciones de permisos
4. **Seeder** debe ejecutarse para crear los nuevos permisos en BD

---

*Última actualización: 27 de abril de 2026*
*Versión: 2.3.0*
