# 🎯 Guía de Implementación Frontend - Permisos Reportes Operativos

## 📋 Resumen para Desarrolladores Frontend

### **🔐 Permisos Disponibles para Reportes Operativos**

El backend ahora implementa un sistema de permisos granular para el módulo de reportes operativos. Cada funcionalidad tiene su permiso específico de lectura y exportación.

---

## 🎪 **Mapeo de Permisos Frontend**

### **1. 📊 Dashboard Reportes**
```javascript
// Ver dashboard principal
const canViewDashboard = user.permisos.some(p => p.slug === 'reportes.operativos_dashboard.read');

// Exportar datos del dashboard
const canExportDashboard = user.permisos.some(p => p.slug === 'reportes.operativos_dashboard.export');
```

**Endpoints Backend:**
- `GET /api/v1/reportes-operativos/dashboard`
- `GET /api/v1/reportes-operativos/combinados`

---

### **2. 🚗 Operativos Vehiculares**
```javascript
// Ver listado y resumen vehicular
const canViewVehiculares = user.permisos.some(p => p.slug === 'reportes.operativos_vehiculares.read');

// Exportar datos vehiculares
const canExportVehiculares = user.permisos.some(p => p.slug === 'reportes.operativos_vehiculares.export');
```

**Endpoints Backend:**
- `GET /api/v1/reportes-operativos/vehiculares`
- `GET /api/v1/reportes-operativos/vehiculares/resumen`
- `GET /api/v1/reportes-operativos/vehiculares/estadisticas`
- `GET /api/v1/reportes-operativos/vehiculares/exportar`

---

### **3. 🚶 Operativos a Pie**
```javascript
// Ver listado y resumen de operativos a pie
const canViewOperativosPie = user.permisos.some(p => p.slug === 'reportes.operativos_personales.read');

// Exportar datos de operativos a pie
const canExportOperativosPie = user.permisos.some(p => p.slug === 'reportes.operativos_personales.export');
```

**Endpoints Backend:**
- `GET /api/v1/reportes-operativos/pie`
- `GET /api/v1/reportes-operativos/pie/resumen`
- `GET /api/v1/reportes-operativos/pie/exportar`

---

### **4. ⚠️ Novedades no Atendidas**
```javascript
// Ver análisis de novedades no atendidas
const canViewNoAtendidas = user.permisos.some(p => p.slug === 'reportes.novedades_no_atendidas.read');

// Exportar datos de novedades no atendidas
const canExportNoAtendidas = user.permisos.some(p => p.slug === 'reportes.novedades_no_atendidas.export');
```

**Endpoints Backend:**
- `GET /api/v1/reportes-operativos/no-atendidas`
- `GET /api/v1/reportes-operativos/no-atendidas/resumen`
- `GET /api/v1/reportes-operativos/no-atendidas/exportar`

---

## 🛠️ **Implementación Práctica en Frontend**

### **📦 Hook de Permisos Reutilizable**
```javascript
// hooks/useReportesPermissions.js
export const useReportesPermissions = () => {
  const { user } = useAuth();
  
  const permissions = {
    dashboard: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.export') || false,
    },
    vehiculares: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.export') || false,
    },
    operativosPie: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.export') || false,
    },
    noAtendidas: {
      read: user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.export') || false,
    }
  };
  
  return permissions;
};
```

### **🎨 Componente de Navegación Condicional**
```javascript
// components/ReportesNavigation.jsx
import { useReportesPermissions } from '../hooks/useReportesPermissions';

const ReportesNavigation = () => {
  const permissions = useReportesPermissions();
  
  return (
    <nav className="reportes-nav">
      {permissions.dashboard.read && (
        <NavLink to="/reportes/dashboard">
          📊 Dashboard
        </NavLink>
      )}
      
      {permissions.vehiculares.read && (
        <NavLink to="/reportes/vehiculares">
          🚗 Operativos Vehiculares
        </NavLink>
      )}
      
      {permissions.operativosPie.read && (
        <NavLink to="/reportes/operativos-pie">
          🚶 Operativos a Pie
        </NavLink>
      )}
      
      {permissions.noAtendidas.read && (
        <NavLink to="/reportes/no-atendidas">
          ⚠️ Novedades no Atendidas
        </NavLink>
      )}
    </nav>
  );
};
```

### **🔒 Protección de Rutas**
```javascript
// components/ProtectedRoute.jsx
const ProtectedReporteRoute = ({ 
  children, 
  requiredPermission, 
  fallback = <div>No tienes permisos para acceder a esta sección</div> 
}) => {
  const { user } = useAuth();
  
  const hasPermission = user?.permisos?.some(p => p.slug === requiredPermission);
  
  if (!hasPermission) {
    return fallback;
  }
  
  return children;
};

// Uso en rutas:
<Route 
  path="/reportes/dashboard" 
  element={
    <ProtectedReporteRoute requiredPermission="reportes.operativos_dashboard.read">
      <DashboardReportes />
    </ProtectedReporteRoute>
  } 
/>
```

### **📤 Botones de Exportación Condicional**
```javascript
// components/ExportButton.jsx
const ExportButton = ({ 
  reportType, 
  onExport, 
  loading = false 
}) => {
  const permissions = useReportesPermissions();
  
  const getExportPermission = (type) => {
    switch (type) {
      case 'dashboard': return permissions.dashboard.export;
      case 'vehiculares': return permissions.vehiculares.export;
      case 'operativosPie': return permissions.operativosPie.export;
      case 'noAtendidas': return permissions.noAtendidas.export;
      default: return false;
    }
  };
  
  const canExport = getExportPermission(reportType);
  
  if (!canExport) return null;
  
  return (
    <button 
      onClick={onExport}
      disabled={loading}
      className="btn-export"
    >
      {loading ? 'Exportando...' : '📥 Exportar (XLS/CSV)'}
    </button>
  );
};
```

---

## 🎯 **Estructura de Componentes Sugerida**

```
src/
├── components/
│   ├── reportes/
│   │   ├── DashboardReportes.jsx
│   │   ├── OperativosVehiculares.jsx
│   │   ├── OperativosPie.jsx
│   │   ├── NovedadesNoAtendidas.jsx
│   │   ├── ReportesNavigation.jsx
│   │   └── ExportButton.jsx
│   └── common/
│       ├── ProtectedRoute.jsx
│       └── PermissionGuard.jsx
├── hooks/
│   └── useReportesPermissions.js
├── services/
│   └── reportesApi.js
└── pages/
    └── Reportes/
        ├── DashboardPage.jsx
        ├── VehicularesPage.jsx
        ├── OperativosPiePage.jsx
        └── NoAtendidasPage.jsx
```

---

## 🔄 **Migración desde Permisos Antiguos**

### **Permisos que ya NO existen:**
- ❌ `operativos.reportes.read`
- ❌ `operativos.vehiculares.read`
- ❌ `operativos.personal.read`
- ❌ `novedades.read`
- ❌ `operativos.reportes.export`

### **Nuevos permisos que SÍ existen:**
- ✅ `reportes.operativos_dashboard.read`
- ✅ `reportes.operativos_dashboard.export`
- ✅ `reportes.operativos_vehiculares.read`
- ✅ `reportes.operativos_vehiculares.export`
- ✅ `reportes.operativos_personales.read`
- ✅ `reportes.operativos_personales.export`
- ✅ `reportes.novedades_no_atendidas.read`
- ✅ `reportes.novedades_no_atendidas.export`

---

## 🚨 **Consideraciones Importantes**

### **1. 🔄 Actualización de Usuario**
```javascript
// Al cargar la aplicación, asegúrate de obtener los permisos actualizados
const { data: userData } = await api.get('/auth/me');
// userData.permisos contendrá los nuevos slugs
```

### **2. 🎯 Validación en Tiempo Real**
```javascript
// Para acciones críticas, valida permisos antes de enviar peticiones
const handleExport = async (reportType) => {
  const permission = `reportes.${reportType}.export`;
  const hasPermission = user.permisos.some(p => p.slug === permission);
  
  if (!hasPermission) {
    toast.error('No tienes permisos para exportar este reporte');
    return;
  }
  
  // Proceed with export
};
```

### **3. 📱 UX para Permisos Denegados**
```javascript
// Muestra mensajes claros cuando faltan permisos
const PermissionDeniedMessage = ({ permission }) => (
  <div className="permission-denied">
    <h3>🔒 Acceso Restringido</h3>
    <p>No tienes los permisos necesarios para acceder a esta funcionalidad.</p>
    <small>Permiso requerido: {permission}</small>
  </div>
);
```

---

## 🧪 **Testing de Permisos**

### **Casos de Test:**
```javascript
// tests/permissions.test.js
describe('Reportes Permissions', () => {
  test('Usuario con permiso dashboard.read puede ver dashboard', () => {
    const mockUser = { permisos: [{ slug: 'reportes.operativos_dashboard.read' }] };
    expect(canAccessDashboard(mockUser)).toBe(true);
  });
  
  test('Usuario sin permisos no puede acceder a reportes', () => {
    const mockUser = { permisos: [] };
    expect(canAccessAnyReport(mockUser)).toBe(false);
  });
});
```

---

## 📞 **Soporte y Contacto**

### **Para problemas con permisos:**
1. **Verifica** que el usuario tenga los permisos asignados en el backend
2. **Confirma** que los slugs coincidan exactamente
3. **Revisa** la respuesta del endpoint `/auth/me` para validar permisos
4. **Contacta** al administrador del sistema para asignar permisos faltantes

### **Endpoints útiles para debugging:**
- `GET /api/v1/auth/me` - Ver permisos del usuario actual
- `GET /api/v1/roles` - Ver roles disponibles
- `GET /api/v1/permisos` - Ver todos los permisos del sistema

---

## 🎊 **Resumen Final**

### **✅ Checklist de Implementación:**
- [ ] Crear hook `useReportesPermissions`
- [ ] Actualizar componentes de navegación
- [ ] Proteger rutas con `ProtectedReporteRoute`
- [ ] Implementar botones de exportación condicional
- [ ] Actualizar llamadas a la API con nuevos endpoints
- [ ] Agregar manejo de errores de permisos
- [ ] Testear con diferentes roles de usuario
- [ ] Documentar cambios en el código frontend

### **🎯 Beneficios:**
- **Seguridad granular** por funcionalidad
- **Separación clara** entre lectura y exportación
- **Escalabilidad** para futuros módulos
- **Mantenibilidad** con permisos descriptivos

---

*Última actualización: 27 de abril de 2026*
*Versión: 1.0.0 - Compatible con Backend v2.3.0*
