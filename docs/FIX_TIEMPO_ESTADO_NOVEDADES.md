# Solución: Cálculo Correcto de tiempo_en_estado_min

## Resumen del Problema

Cuando se registraba un cambio de estado en una novedad ("Atender Novedad"), el campo `tiempo_en_estado_min` en la tabla `historial_estado_novedades` se calculaba incorrectamente.

### Ejemplo del CSV de evidencias:

```csv
id | novedad_id | estado_anterior_id | estado_nuevo_id | tiempo_en_estado_min | observaciones | fecha_cambio
378 | 168 | NULL | 1 | NULL | Novedad creada | 2026-03-11 18:52:33
379 | 168 | 1 | 2 | 300 | Unidad despachada al lugar | 2026-03-11 18:53:20    (debería ser ~1 min, no 300)
380 | 168 | 2 | 6 | 301 | Cambio de estado a: RESUELTO | 2026-03-11 18:55:12    (debería ser ~2 min, no 301)
```

La diferencia entre 18:52:33 y 18:53:20 es de 47 segundos (~0.78 minutos), pero se registraba como 300.

---

## Solución Implementada

### 1. Trigger BEFORE INSERT

Se creó un trigger `tr_historial_estado_novedades_calcular_tiempo` que se ejecuta **antes** de insertar un nuevo registro en `historial_estado_novedades`:

```sql
CREATE TRIGGER tr_historial_estado_novedades_calcular_tiempo
BEFORE INSERT ON historial_estado_novedades
FOR EACH ROW
BEGIN
  DECLARE fecha_anterior DATETIME;
  DECLARE tiempo_diferencia INT;
  
  -- Buscar la fecha_cambio del registro anterior más reciente
  SELECT fecha_cambio INTO fecha_anterior
  FROM historial_estado_novedades
  WHERE novedad_id = NEW.novedad_id
  ORDER BY fecha_cambio DESC, id DESC
  LIMIT 1;
  
  -- Calcular diferencia en minutos
  IF fecha_anterior IS NOT NULL THEN
    SET tiempo_diferencia = ROUND(
      TIMESTAMPDIFF(SECOND, fecha_anterior, NEW.fecha_cambio) / 60
    );
    SET NEW.tiempo_en_estado_min = tiempo_diferencia;
  ELSE
    SET NEW.tiempo_en_estado_min = NULL;
  END IF;
END
```

### 2. Cálculo de Datos Históricos

Se ejecutó una corrección de todos los valores existentes, creando una tabla temporal para evitar el error "You can't specify target table in FROM clause":

```sql
CREATE TEMPORARY TABLE temp_tiempo_correcciones AS
SELECT 
  h1.id,
  ROUND(
    TIMESTAMPDIFF(SECOND, 
      (SELECT fecha_cambio FROM historial_estado_novedades h2 
       WHERE h2.novedad_id = h1.novedad_id 
       AND h2.fecha_cambio < h1.fecha_cambio
       ORDER BY h2.fecha_cambio DESC, h2.id DESC
       LIMIT 1),
      h1.fecha_cambio
    ) / 60
  ) as new_tiempo
FROM historial_estado_novedades h1
WHERE EXISTS (...);

UPDATE historial_estado_novedades h1
INNER JOIN temp_tiempo_correcciones t ON h1.id = t.id
SET h1.tiempo_en_estado_min = t.new_tiempo;
```

---

## Resultados de la Verificación

Después de aplicar el trigger y las correcciones, se verificó con la novedad 167:

```
Registro 1: ID 375
  Tiempo en Estado: NULL (primer cambio de estado)
  Fecha Cambio: 2026-03-11 18:13:21

Registro 2: ID 376
  Tiempo en Estado: 1 min ✓ (diferencia real: 32 seg)
  Fecha Cambio: 2026-03-11 18:13:53

Registro 3: ID 377
  Tiempo en Estado: 1 min ✓ (diferencia real: 68 seg)
  Fecha Cambio: 2026-03-11 18:15:01
```

Los valores ahora son **correctos y consistentes** con los tiempos reales entre cambios de estado.

---

## Cómo Funciona

### Para Nuevas Novedades (Forward)
Cada vez que se registra un cambio de estado:
1. Se ejecuta el trigger BEFORE INSERT
2. Busca el registro anterior del mismo novedad_id
3. Calcula `TIMESTAMPDIFF(SECOND, fecha_anterior, fecha_nueva) / 60`
4. Asigna al`tiempo_en_estado_min` del nuevo registro

### Para el Primer Estado
El primer cambio de estado de una novedad siempre tendrá `tiempo_en_estado_min = NULL` (no hay tiempo anterior).

---

## Archivos Modificados

- **Migration:** `migrations/2026-03-11-fix-tiempo-estado-trigger.sql`
- **Verificación:** `verify-corrections.js` (script de prueba - puede eliminarse)

---

## Historial de Cambios

- ✅ **2026-03-11:** Implementación del trigger y corrección de datos históricos
- ✅ **2026-03-11:** Verificación de correcciones en novedad 167
- ✅ **2026-03-11:** Push a GitHub

---

## Próximos Pasos Recomendados

1. Ejecutar la migración en base de datos de staging
2. Ejecutar la migración en base de datos de producción
3. Monitorear nuevos cambios de estado para verificar que el trigger funciona
4. Opcionalmente, eliminar el script de verificación `verify-corrections.js`
