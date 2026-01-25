# 🔍 Instrucciones para Debuguear Duplicados en Historial

## 📊 Problema Identificado

Según la imagen, la novedad_id `34` tiene **registros duplicados** en `historial_estado_novedades`:
- ID 55 y 56 tienen el mismo `fecha_cambio`: `2026-01-05 00:33:46`
- Esto indica duplicación

## 🎯 Plan de Diagnóstico

### **Paso 1: Analizar los Duplicados**

Ejecuta el script de análisis:

```bash
mysql -u tu_usuario -p railway < migrations/DEBUG_duplicados_historial.sql
```

O desde MySQL Workbench/phpMyAdmin, ejecuta las consultas del archivo.

**Esto te mostrará:**
1. Todos los registros de la novedad 34
2. Grupos de duplicados exactos
3. Diferencia en microsegundos entre registros
4. Triggers activos en la tabla

---

### **Paso 2: Eliminar TODOS los Triggers**

⚠️ **IMPORTANTE:** Hay DOS triggers creando historial (por eso se duplica):
1. `trg_novedades_incidentes_after_update`
2. `trg_historial_cambio_estado` ← **Este estaba oculto y causa duplicados**

**Ejecutar script para eliminar AMBOS:**

```bash
mysql -u tu_usuario -p railway < migrations/DROP_ALL_triggers_historial.sql
```

**Verificar que fueron eliminados:**
```sql
SELECT TRIGGER_NAME
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'railway'
  AND EVENT_OBJECT_TABLE = 'novedades_incidentes';
```
→ Debe retornar 0 resultados (no debe haber ningún trigger)

---

### **Paso 3: Hacer Prueba desde Frontend**

1. **Crea una nueva novedad de prueba** (o usa una existente)
2. **Asigna recursos** desde el frontend (esto cambia el estado a DESPACHADO)
3. **Verifica el historial:**

```sql
SELECT *
FROM historial_estado_novedades
WHERE novedad_id = 35  -- ID de tu novedad de prueba
ORDER BY id DESC;
```

**Resultados esperados:**

- ✅ **Si NO se duplica** → El problema era el TRIGGER
- ❌ **Si SÍ se duplica** → El problema está en el BACKEND o hay doble llamada

---

### **Paso 4A: Si NO se duplicó (era el trigger)**

El trigger estaba duplicando. Solución:

1. **Verificar que el trigger actual NO esté creando duplicados**
   - Revisar el código del trigger en `migrations/fix_trigger_historial_auditoria.sql`
   - El trigger solo debe ejecutarse si `NEW.estado_novedad_id <> OLD.estado_novedad_id`

2. **Restaurar el trigger corregido:**
```bash
mysql -u tu_usuario -p railway < migrations/fix_trigger_historial_auditoria.sql
```

3. **Hacer otra prueba** para confirmar que ya no duplica

---

### **Paso 4B: Si SÍ se duplicó (es el backend o doble llamada)**

Hay varias posibilidades:

#### **Opción 1: Frontend hace doble llamada**

**Verificar en el frontend:**
- Abre Chrome DevTools → Network
- Asigna recursos a una novedad
- Verifica cuántas veces se llama al endpoint `POST /api/v1/novedades/:id/asignar`

Si hay **2 llamadas** → El problema está en el frontend (posible doble click o useEffect duplicado)

---

#### **Opción 2: Backend crea registro manualmente**

**Verificar en el código:**

Buscar si hay algún lugar que cree historial manualmente:

```bash
grep -r "HistorialEstadoNovedad.create" src/controllers/
```

Debería mostrar solo:
- `createNovedad` (línea 374) - ✅ Correcto, es el registro inicial
- `historialEstadoNovedadController.js` (línea 122) - ✅ Correcto, es endpoint dedicado

**Si encuentra más lugares** → Eliminarlos

---

#### **Opción 3: Trigger + Backend creando al mismo tiempo**

Si el trigger está activo Y algún endpoint crea manualmente → Duplicación

**Solución:**
1. Mantener trigger eliminado
2. O asegurarse de que el backend NO cree registros manualmente (excepto en createNovedad)

---

### **Paso 5: Agregar Logs Temporales (Debug Avanzado)**

Si aún no identificas la causa, agrega logs en `asignarRecursos`:

**Editar:** `src/controllers/novedadesController.js`

```javascript
// Línea 548 - DESPUÉS de obtener estadoAnteriorId
const estadoAnteriorId = novedad.estado_novedad_id;
console.log('🔍 [ASIGNAR RECURSOS] Estado anterior:', estadoAnteriorId);

// Línea 582 - ANTES del update
console.log('🔍 [ASIGNAR RECURSOS] Nuevo estado:', datosActualizacion.estado_novedad_id);
console.log('🔍 [ASIGNAR RECURSOS] Actualizando novedad ID:', id);

await novedad.update(datosActualizacion, { transaction });

console.log('✅ [ASIGNAR RECURSOS] Novedad actualizada');
```

**Reinicia el servidor y revisa los logs** cuando asignes recursos.

---

### **Paso 6: Limpiar Duplicados Existentes**

Después de identificar y corregir la causa, limpia los duplicados:

**⚠️ HACER BACKUP ANTES**

```sql
-- Ver duplicados antes de eliminar
SELECT
    novedad_id,
    estado_anterior_id,
    estado_nuevo_id,
    fecha_cambio,
    COUNT(*) as cantidad
FROM historial_estado_novedades
GROUP BY novedad_id, estado_anterior_id, estado_nuevo_id, fecha_cambio
HAVING COUNT(*) > 1;

-- Eliminar duplicados (mantener solo el primero)
DELETE h1 FROM historial_estado_novedades h1
INNER JOIN historial_estado_novedades h2
WHERE h1.estado_anterior_id = h2.estado_anterior_id
  AND h1.estado_nuevo_id = h2.estado_nuevo_id
  AND h1.novedad_id = h2.novedad_id
  AND h1.fecha_cambio = h2.fecha_cambio
  AND h1.id > h2.id;  -- Mantener el de menor ID

-- Verificar resultados
SELECT COUNT(*) as registros_restantes
FROM historial_estado_novedades;
```

---

## 🎯 Checklist de Diagnóstico

- [ ] Ejecutar `DEBUG_duplicados_historial.sql`
- [ ] Eliminar trigger con `DROP_trigger_historial_para_pruebas.sql`
- [ ] Hacer prueba asignando recursos
- [ ] Verificar si duplica sin trigger
- [ ] Si duplica: revisar Network tab del frontend
- [ ] Si duplica: buscar `HistorialEstadoNovedad.create` en backend
- [ ] Si duplica: agregar logs temporales
- [ ] Identificar causa raíz
- [ ] Corregir problema
- [ ] Restaurar trigger (si era necesario)
- [ ] Limpiar duplicados existentes
- [ ] Hacer prueba final

---

## 📋 Archivos Creados

1. `migrations/DROP_trigger_historial_para_pruebas.sql` - Elimina el trigger
2. `migrations/DEBUG_duplicados_historial.sql` - Analiza duplicados
3. `INSTRUCCIONES_DEBUG_DUPLICADOS.md` - Este documento

---

## 🆘 Si Necesitas Ayuda

Comparte los resultados de:
1. La consulta de duplicados (paso 1)
2. El resultado de la prueba sin trigger (paso 3)
3. Screenshot del Network tab mostrando las llamadas al endpoint

Con esa información podré identificar exactamente dónde está el problema.
