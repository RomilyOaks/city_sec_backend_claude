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

## Notas Importantes

1. **Backup:** Siempre realiza un backup de la base de datos antes de ejecutar migraciones en producción
2. **Orden:** Ejecuta las migraciones en orden cronológico según su fecha
3. **Verificación:** Después de ejecutar una migración, verifica que los cambios se aplicaron correctamente

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
