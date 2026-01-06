# Migraciones de Base de Datos

Este directorio contiene las migraciones SQL para el proyecto City Sec Backend.

## Cómo ejecutar las migraciones

### Opción 1: Usando MySQL CLI

```bash
mysql -u tu_usuario -p nombre_base_datos < migrations/add_direccion_id_to_novedades.sql
```

### Opción 2: Usando MySQL Workbench

1. Abre MySQL Workbench
2. Conecta a tu servidor
3. Abre el archivo `add_direccion_id_to_novedades.sql`
4. Ejecuta el script completo

### Opción 3: Desde phpMyAdmin

1. Accede a phpMyAdmin
2. Selecciona la base de datos
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido del archivo de migración
5. Ejecuta

## Migraciones Disponibles

### `fix_trigger_historial_auditoria.sql`

**Fecha:** 2026-01-04

**Descripción:** Actualiza el trigger `trg_novedades_incidentes_after_update` para incluir los campos de auditoría `created_by` y `updated_by` al crear registros en `historial_estado_novedades`.

**Cambios:**
- Elimina y recrea el trigger existente
- Agrega `created_by` y `updated_by` en el INSERT del trigger
- Usa el mismo `usuario_historial` calculado para todos los campos de auditoría

**Seguridad:**
- Usa `DROP TRIGGER IF EXISTS` para evitar errores
- Verifica la creación del trigger consultando `information_schema.TRIGGERS`
- Es seguro ejecutarlo múltiples veces

**Impacto:**
- ✅ No destructivo - solo actualiza el trigger
- ✅ No afecta datos existentes
- ✅ Los registros futuros incluirán los campos de auditoría

**Orden de ejecución:** Ejecutar ANTES de usar la aplicación para que todos los registros nuevos tengan auditoría completa.

---

### `add_direccion_id_to_novedades.sql`

**Fecha:** 2026-01-04

**Descripción:** Agrega la columna `direccion_id` a la tabla `novedades_incidentes` para permitir la relación con la tabla `direcciones`.

**Cambios:**
- Agrega columna `direccion_id INT NULL` después de `cuadrante_id`
- Crea índice `idx_novedades_direccion` para mejorar rendimiento
- Agrega foreign key constraint `fk_novedades_direccion` que referencia a `direcciones(id)`

**Seguridad:**
- El script verifica si la columna ya existe antes de intentar agregarla
- El script verifica si la foreign key ya existe antes de intentar agregarla
- Es seguro ejecutarlo múltiples veces (idempotente)

**Impacto:**
- ✅ No destructivo - solo agrega una columna opcional (NULL)
- ✅ No afecta datos existentes
- ✅ Compatible con versión anterior del código

### `migrate_direccion_codes_to_sequential.sql`

**Fecha:** 2026-01-06

**Descripción:** Migra los códigos de direcciones del formato antiguo `DIR-TIMESTAMP-RANDOM` al nuevo formato secuencial `D-XXXXXX`.

**Formato Anterior:** `DIR-20240105120000-123`
**Formato Nuevo:** `D-000001`, `D-000002`, ..., `D-999999`

**Cambios:**
1. Agrega campo temporal `direccion_code_legacy` para backup
2. Guarda códigos antiguos en el campo legacy
3. Actualiza códigos a formato secuencial basado en `created_at`
4. Incluye queries de verificación de integridad

**Capacidad:** Hasta 999,999 direcciones

**Seguridad:**
- Incluye campo de backup para posible rollback
- Queries de verificación de formato y duplicados
- Script de rollback comentado

**Impacto:**
- ⚠️ **REQUIERE BACKUP COMPLETO** antes de ejecutar
- ⚠️ Ejecutar en horario de bajo tráfico
- ✅ Mantiene códigos antiguos en campo legacy
- ✅ Soporta rollback si es necesario

**Pasos Post-Migración:**
1. Verificar que todos los códigos tienen formato `D-XXXXXX`
2. Verificar que no hay duplicados
3. Probar creación de nuevas direcciones
4. Actualizar frontend para mostrar nuevos códigos
5. (Opcional) Eliminar campo legacy después de validar

**Orden de ejecución:** Ejecutar DESPUÉS de asegurar que el código backend ha sido actualizado para usar el nuevo formato.

---

## Notas Importantes

1. **Backup:** Siempre realiza un backup de la base de datos antes de ejecutar migraciones en producción
2. **Orden:** Ejecuta las migraciones en orden cronológico según su fecha
3. **Verificación:** Después de ejecutar una migración, verifica que los cambios se aplicaron correctamente
4. **Horario:** Ejecuta migraciones importantes en horarios de bajo tráfico

## Verificar si una migración ya fue aplicada

Para verificar si la columna `direccion_id` ya existe:

```sql
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'nombre_de_tu_bd'
  AND TABLE_NAME = 'novedades_incidentes'
  AND COLUMN_NAME = 'direccion_id';
```
