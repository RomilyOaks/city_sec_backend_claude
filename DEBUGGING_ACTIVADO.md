# 🔥 DEBUGGING AGRESIVO ACTIVADO

## Endpoints con Debugging Agregado

Se ha agregado logging detallado con timestamps a los siguientes endpoints que se ejecutan al presionar "Asignar Vehículo":

### 1. **Operativos Vehículos**
- `getAllVehiculosByTurno` - GET /:turnoId/vehiculos
- `createVehiculoInTurno` - POST /:turnoId/vehiculos

### 2. **Catálogos**
- `getVehiculosDisponibles` - GET /vehiculos/disponibles
- `getAllPersonal` - GET /personal
- `getRadiosDisponibles` - GET /radios-tetra/disponibles  
- `getEstadosActivos` - GET /estados-operativo-recurso/activos

## Información Logueada

Cada endpoint ahora registra:
- 🕐 **Timestamp** exacto de inicio
- 🌐 **Request URL** completa
- 📋 **Query params** completos
- 🔐 **Headers** (incluyendo Authorization)
- 📊 **Resultados** de consultas a BD
- ✅ **Estado final** de la respuesta
- ❌ **Errores completos** con stack trace

## Formato de Logs

```
🔥 [2026-01-15T23:30:45.123Z] DEBUG: NOMBRE_ENDPOINT INICIO
🔥 [2026-01-15T23:30:45.124Z] DEBUG: Query params: {"page": "1", "limit": "20"}
🔥 [2026-01-15T23:30:45.125Z] DEBUG: Headers: {"authorization": "Bearer eyJ..."}
🔥 [2026-01-15T23:30:45.126Z] DEBUG: Request URL: /api/v1/operativos/6/vehiculos
🔥 [2026-01-15T23:30:45.130Z] DEBUG: Consultando vehículos...
🔥 [2026-01-15T23:30:45.145Z] DEBUG: Vehículos encontrados: 3
🔥 [2026-01-15T23:30:45.146Z] DEBUG: Enviando respuesta 200
```

## Cómo Identificar el Bucle

1. **Presiona "Asignar Vehículo"** en el frontend
2. **Observa la consola del backend** 
3. **Busca patrones repetitivos** como:
   - Mismo endpoint ejecutándose múltiples veces
   - Timestamps muy cercanos (< 1 segundo)
   - Secuencias repetitivas de logs

## Comandos Útiles

### Ver logs en tiempo real:
```bash
npm run dev
# O si usas PM2
pm2 logs city-sec-backend
```

### Filtrar logs específicos:
```bash
npm run dev | grep "🔥.*DEBUG"
```

### Contar llamadas por endpoint:
```bash
npm run dev | grep "getAllVehiculosByTurno INICIO" | wc -l
```

## Posibles Causas del Bucle

Si detectas llamadas repetitivas, las causas más probables son:

### Frontend:
- **useEffect con dependencias incorrectas**
- **Event handlers sin debounce**
- **Component updates en loop**
- **Multiple API calls simultáneas**

### Backend:
- **Middleware ejecutándose múltiples veces**
- **Redirects internos**
- **Error handling que retrae la misma llamada**

## Próximos Pasos

1. **Identifica qué endpoint se repite**
2. **Cuenta las repeticiones por minuto**
3. **Anota el patrón de tiempo**
4. **Reporta los hallazgos para corregir el frontend**

---

**El debugging está activo. Presiona "Asignar Vehículo" y observa la consola del backend.**
