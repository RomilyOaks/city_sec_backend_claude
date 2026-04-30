# 🔄 Guía de Migración Frontend - Permisos Reportes Operativos

## 🎯 **Migración desde Permisos Antiguos a Nuevos**

---

## 📋 **Tabla Comparativa de Permisos**

### **🔄 Cambios Realizados**

| **Antiguo Permiso** | **Nuevo Permiso** | **Estado** | **Acción Requerida** |
|-------------------|------------------|-----------|-------------------|
| `operativos.reportes.read` | `reportes.operativos_dashboard.read` | ❌ **Reemplazado** | Actualizar código |
| `operativos.vehiculares.read` | `reportes.operativos_vehiculares.read` | ❌ **Reemplazado** | Actualizar código |
| `operativos.personal.read` | `reportes.operativos_personales.read` | ❌ **Reemplazado** | Actualizar código |
| `novedades.read` | `reportes.novedades_no_atendidas.read` | ❌ **Reemplazado** | Actualizar código |
| `operativos.reportes.export` | `reportes.operativos_dashboard.export` | ❌ **Reemplazado** | Actualizar código |

### **✅ Nuevos Permisos Agregados**

| **Nuevo Permiso** | **Funcionalidad** | **Uso** |
|------------------|------------------|---------|
| `reportes.operativos_vehiculares.export` | Exportar datos vehiculares | Nuevo |
| `reportes.operativos_personales.export` | Exportar datos operativos a pie | Nuevo |
| `reportes.novedades_no_atendidas.export` | Exportar novedades no atendidas | Nuevo |

---

## 🚨 **Acciones Inmediatas Requeridas**

### **1. 🔄 Actualizar Validaciones de Permisos**

#### **ANTES (Código Obsoleto):**
```javascript
// ❌ ESTE CÓDIGO YA NO FUNCIONA
const canViewVehiculares = user.permisos.some(p => 
  p.slug === 'operativos.vehiculares.read'
);

const canExportReportes = user.permisos.some(p => 
  p.slug === 'operativos.reportes.export'
);
```

#### **AHORA (Código Correcto):**
```javascript
// ✅ CÓDIGO ACTUALIZADO
const canViewVehiculares = user.permisos.some(p => 
  p.slug === 'reportes.operativos_vehiculares.read'
);

const canExportVehiculares = user.permisos.some(p => 
  p.slug === 'reportes.operativos_vehiculares.export'
);

const canViewDashboard = user.permisos.some(p => 
  p.slug === 'reportes.operativos_dashboard.read'
);

const canExportDashboard = user.permisos.some(p => 
  p.slug === 'reportes.operativos_dashboard.export'
);
```

### **2. 🔄 Actualizar Nombres de Componentes**

#### **Renombrar Archivos (si aplica):**
```
src/components/OperativosVehiculares.jsx     → ✅ Mantener
src/components/OperativosPersonales.jsx      → ✅ Mantener  
src/components/NovedadesNoAtendidas.jsx       → ✅ Mantener
src/components/DashboardOperativos.jsx       → ✅ Mantener
```

#### **Actualizar Importaciones:**
```javascript
// ANTES
import { OPERATIVOS_PERMISSIONS } from '../constants/permissions';

// AHORA  
import { REPORTES_PERMISSIONS } from '../constants/permissions';
```

---

## 🛠️ **Pasos Detallados de Migración**

### **Paso 1: Actualizar Constantes de Permisos**

#### **Archivo: `src/constants/permissions.js`**
```javascript
// ❌ ELIMINAR ESTAS CONSTANTES
export const OLD_PERMISSIONS = {
  OPERATIVOS_READ: 'operativos.reportes.read',
  VEHICULARES_READ: 'operativos.vehiculares.read',
  PERSONAL_READ: 'operativos.personal.read',
  NOVEDADES_READ: 'novedades.read',
  OPERATIVOS_EXPORT: 'operativos.reportes.export'
};

// ✅ AGREGAR ESTAS NUEVAS CONSTANTES
export const REPORTES_PERMISSIONS = {
  DASHBOARD_READ: 'reportes.operativos_dashboard.read',
  DASHBOARD_EXPORT: 'reportes.operativos_dashboard.export',
  VEHICULARES_READ: 'reportes.operativos_vehiculares.read',
  VEHICULARES_EXPORT: 'reportes.operativos_vehiculares.export',
  OPERATIVOS_PIE_READ: 'reportes.operativos_personales.read',
  OPERATIVOS_PIE_EXPORT: 'reportes.operativos_personales.export',
  NO_ATENDIDAS_READ: 'reportes.novedades_no_atendidas.read',
  NO_ATENDIDAS_EXPORT: 'reportes.novedades_no_atendidas.export'
};
```

### **Paso 2: Actualizar Hooks de Permisos**

#### **Archivo: `src/hooks/usePermissions.js`**
```javascript
// ❌ CÓDIGO ANTIGUO
export const useOperativosPermissions = () => {
  const { user } = useAuth();
  
  return {
    canReadOperativos: user?.permisos?.some(p => 
      p.slug === 'operativos.reportes.read'
    ),
    canReadVehiculares: user?.permisos?.some(p => 
      p.slug === 'operativos.vehiculares.read'
    ),
    canExportOperativos: user?.permisos?.some(p => 
      p.slug === 'operativos.reportes.export'
    )
  };
};

// ✅ CÓDIGO NUEVO
export const useReportesPermissions = () => {
  const { user } = useAuth();
  
  return {
    dashboard: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.read'),
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.export')
    },
    vehiculares: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.read'),
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.export')
    },
    operativosPie: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.read'),
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.export')
    },
    noAtendidas: {
      read: user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.read'),
      export: user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.export')
    }
  };
};
```

### **Paso 3: Actualizar Componentes de UI**

#### **Ejemplo: Componente de Navegación**
```javascript
// ❌ COMPONENTE ANTIGUO
const OperativosNavigation = () => {
  const { canReadOperativos, canReadVehiculares } = useOperativosPermissions();
  
  return (
    <nav>
      {canReadOperativos && <NavLink to="/operativos">Operativos</NavLink>}
      {canReadVehiculares && <NavLink to="/vehiculares">Vehiculares</NavLink>}
    </nav>
  );
};

// ✅ COMPONENTE ACTUALIZADO
const ReportesNavigation = () => {
  const permissions = useReportesPermissions();
  
  return (
    <nav>
      {permissions.dashboard.read && (
        <NavLink to="/reportes/dashboard">📊 Dashboard</NavLink>
      )}
      {permissions.vehiculares.read && (
        <NavLink to="/reportes/vehiculares">🚗 Vehiculares</NavLink>
      )}
      {permissions.operativosPie.read && (
        <NavLink to="/reportes/operativos-pie">🚶 Operativos a Pie</NavLink>
      )}
      {permissions.noAtendidas.read && (
        <NavLink to="/reportes/no-atendidas">⚠️ No Atendidas</NavLink>
      )}
    </nav>
  );
};
```

### **Paso 4: Actualizar Protección de Rutas**

#### **Archivo: `src/router/AppRouter.jsx`**
```javascript
// ❌ RUTAS ANTIGUAS
<Route 
  path="/operativos/*" 
  element={
    <ProtectedRoute permission="operativos.reportes.read">
      <OperativosModule />
    </ProtectedRoute>
  } 
/>

// ✅ RUTAS NUEVAS
<Route 
  path="/reportes/dashboard" 
  element={
    <ProtectedRoute permission="reportes.operativos_dashboard.read">
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/reportes/vehiculares/*" 
  element={
    <ProtectedRoute permission="reportes.operativos_vehiculares.read">
      <VehicularesModule />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/reportes/operativos-pie/*" 
  element={
    <ProtectedRoute permission="reportes.operativos_personales.read">
      <OperativosPieModule />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/reportes/no-atendidas/*" 
  element={
    <ProtectedRoute permission="reportes.novedades_no_atendidas.read">
      <NoAtendidasModule />
    </ProtectedRoute>
  } 
/>
```

---

## 🔧 **Script de Migración Automática**

### **Opción 1: Buscar y Reemplazar (VSCode)**
```json
// .vscode/tasks.json
{
  "label": "Migrate Reportes Permissions",
  "type": "shell",
  "command": "find src -name '*.js' -o -name '*.jsx' | xargs sed -i 's/operativos\\.reportes\\.read/reportes.operativos_dashboard.read/g'",
  "group": "build"
}
```

### **Opción 2: Script Node.js**
```javascript
// scripts/migrate-permissions.js
const fs = require('fs');
const path = require('path');

const permissionMappings = [
  { from: 'operativos.reportes.read', to: 'reportes.operativos_dashboard.read' },
  { from: 'operativos.vehiculares.read', to: 'reportes.operativos_vehiculares.read' },
  { from: 'operativos.personal.read', to: 'reportes.operativos_personales.read' },
  { from: 'novedades.read', to: 'reportes.novedades_no_atendidas.read' },
  { from: 'operativos.reportes.export', to: 'reportes.operativos_dashboard.export' }
];

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  permissionMappings.forEach(({ from, to }) => {
    const regex = new RegExp(from.replace('.', '\\.'), 'g');
    if (content.includes(from)) {
      content = content.replace(regex, to);
      changed = true;
      console.log(`✅ Updated ${filePath}: ${from} → ${to}`);
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
  }
}

function migrateDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      migrateDirectory(filePath);
    } else if (file.match(/\.(js|jsx)$/)) {
      migrateFile(filePath);
    }
  });
}

// Ejecutar migración
migrateDirectory('src');
console.log('🎉 Migration completed!');
```

---

## 🧪 **Testing de Migración**

### **Test Unitario - Permisos**
```javascript
// tests/permissions/migration.test.js
import { useReportesPermissions } from '../../hooks/usePermissions';

describe('Permissions Migration', () => {
  test('Old permissions should not work', () => {
    const mockUser = {
      permisos: [
        { slug: 'operativos.reportes.read' }, // Antiguo permiso
        { slug: 'operativos.vehiculares.read' } // Antiguo permiso
      ]
    };
    
    const permissions = useReportesPermissions();
    // Simular usuario con permisos antiguos
    const result = permissions(mockUser);
    
    // Ningún permiso nuevo debería estar disponible
    expect(result.dashboard.read).toBe(false);
    expect(result.vehiculares.read).toBe(false);
  });
  
  test('New permissions should work correctly', () => {
    const mockUser = {
      permisos: [
        { slug: 'reportes.operativos_dashboard.read' },
        { slug: 'reportes.operativos_vehiculares.read' }
      ]
    };
    
    const permissions = useReportesPermissions();
    const result = permissions(mockUser);
    
    expect(result.dashboard.read).toBe(true);
    expect(result.vehiculares.read).toBe(true);
    expect(result.operativosPie.read).toBe(false);
  });
});
```

### **Test de Integración - Endpoints**
```javascript
// tests/api/reportes.test.js
import { reportesApi } from '../../services/reportesApi';

describe('Reportes API - New Permissions', () => {
  test('Should access dashboard with new permission', async () => {
    // Mock user with new permission
    mockUserPermissions(['reportes.operativos_dashboard.read']);
    
    const response = await reportesApi.getDashboard();
    expect(response.status).toBe(200);
  });
  
  test('Should fail with old permission', async () => {
    // Mock user with old permission
    mockUserPermissions(['operativos.reportes.read']);
    
    try {
      await reportesApi.getDashboard();
      fail('Should have failed with old permission');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });
});
```

---

## 🚨 **Problemas Comunes y Soluciones**

### **Problema 1: Permisos no se actualizan**
```javascript
// ❌ PROBLEMA: Caché de permisos antiguo
const cachedPermissions = localStorage.getItem('user_permissions');

// ✅ SOLUCIÓN: Forzar recarga de permisos
const refreshPermissions = async () => {
  const response = await api.get('/auth/me');
  const freshPermissions = response.data.permisos;
  localStorage.setItem('user_permissions', JSON.stringify(freshPermissions));
  return freshPermissions;
};
```

### **Problema 2: Componentes no se re-renderizan**
```javascript
// ❌ PROBLEMA: No se actualiza el estado
const [permissions, setPermissions] = useState(user.permisos);

// ✅ SOLUCIÓN: Usar contexto o estado global
const { permissions, refreshPermissions } = usePermissions();

// En el login o cambio de rol
useEffect(() => {
  refreshPermissions();
}, [user?.id]);
```

### **Problema 3: Rutas protegidas con permisos antiguos**
```javascript
// ❌ PROBLEMA: Hardcode de permisos antiguos
const ProtectedRoute = ({ children, permission }) => {
  const oldPermission = permission.replace('reportes.', 'operativos.');
  // ...
};

// ✅ SOLUCIÓN: Validar permisos nuevos
const ProtectedRoute = ({ children, permission }) => {
  const { user } = useAuth();
  const hasPermission = user?.permisos?.some(p => p.slug === permission);
  
  if (!hasPermission) {
    return <PermissionDenied permission={permission} />;
  }
  
  return children;
};
```

---

## 📋 **Checklist de Migración**

### **✅ Pre-Migración**
- [ ] Backup del código actual
- [ ] Identificar todos los archivos que usan permisos antiguos
- [ ] Documentar componentes afectados
- [ ] Preparar ambiente de testing

### **✅ Migración**
- [ ] Actualizar constantes de permisos
- [ ] Modificar hooks de permisos
- [ ] Actualizar componentes de navegación
- [ ] Modificar protección de rutas
- [ ] Actualizar llamadas a API
- [ ] Corregir botones de exportación

### **✅ Post-Migración**
- [ ] Ejecutar suite de tests
- [ ] Probar manualmente cada funcionalidad
- [ ] Verificar permisos con diferentes roles
- [ ] Testear exportación de archivos
- [ ] Validar mensajes de error
- [ ] Limpiar código obsoleto

### **✅ Despliegue**
- [ ] Merge a rama principal
- [ ] Desplegar en staging
- [ ] Testing de integración
- [ ] Desplegar en producción
- [ ] Monitorear errores

---

## 🎯 **Timeline de Migración**

### **Fase 1: Preparación (1 día)**
- Backup y análisis de código
- Preparar scripts de migración
- Documentar cambios

### **Fase 2: Migración (2-3 días)**
- Actualizar permisos en backend
- Migrar código frontend
- Testing unitario

### **Fase 3: Integración (1 día)**
- Testing de integración
- Pruebas con usuarios reales
- Corrección de errores

### **Fase 4: Despliegue (1 día)**
- Despliegue gradual
- Monitoreo
- Documentación final

---

## 📞 **Soporte durante Migración**

### **Contacto para Problemas:**
1. **Backend:** Revisar logs de permisos en `/api/v1/auth/me`
2. **Frontend:** Usar console.log para verificar permisos cargados
3. **Testing:** Probar con diferentes roles de usuario
4. **Documentación:** Referirse a `docs/Frontend-Permisos-Reportes-Operativos.md`

### **Herramientas Útiles:**
- **React DevTools:** Inspeccionar contexto de permisos
- **Network Tab:** Ver respuestas de API
- **Console:** Logs de errores de permisos
- **Local Storage:** Ver caché de permisos

---

## 🎊 **Resumen Final**

### **✅ Beneficios de la Migración:**
- **Mayor seguridad** con permisos granulares
- **Mejor UX** con acceso específico por funcionalidad
- **Escalabilidad** para futuros módulos
- **Claridad** en la estructura de permisos

### **🎯 Impacto en Usuarios:**
- **Sin interrupción** del servicio
- **Mejor control** de acceso
- **Experiencia más personalizada**
- **Mensajes claros** de permisos denegados

---

*Última actualización: 27 de abril de 2026*
*Versión: 1.0.0 - Migración Permisos v2.3.0*
