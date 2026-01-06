# Test: Verificación de Campo `observaciones` en UPDATE

## Estado del Backend

### ✅ Configuración Actual

1. **Modelo Novedad.js (línea 117-120)**
   ```javascript
   observaciones: {
     type: DataTypes.TEXT,
     allowNull: true,
   }
   ```

2. **Validador (novedad.validator.js:297-304)**
   ```javascript
   export const validarObservaciones = () =>
     body("observaciones")
       .optional()
       .trim()
       .isLength({ max: LIMITES_TEXTO.OBSERVACIONES_MAX })
       .withMessage(`Las observaciones no pueden exceder ${LIMITES_TEXTO.OBSERVACIONES_MAX} caracteres`);
   ```

3. **Validación en UPDATE (línea 441-451)**
   ```javascript
   export const validateUpdateNovedad = [
     validarNovedadId(),
     validarTipoNovedad(true),
     validarSubtipoNovedad(true),
     validarEstadoNovedad(),
     validarFechaHoraOcurrencia(true),
     validarFechaLlegada(),
     validarFechaCierre(),
     validarDescripcion(true),
     validarObservaciones(), // ✅ INCLUIDO
     validarObservacionesCambioEstado(),
     // ...
   ];
   ```

4. **Controlador updateNovedad (línea 456-461)**
   ```javascript
   await novedad.update(
     {
       ...datosActualizacion, // ✅ Incluye todos los campos del body
       updated_by: req.user.id,
     },
     { transaction }
   );
   ```

5. **Ruta PUT /:id (línea 200)**
   ```javascript
   router.put(
     "/:id",
     verificarToken,
     verificarRoles(["supervisor", "super_admin"]),
     requireAnyPermission(["novedades.incidentes.update"]),
     validateUpdateNovedad, // ✅ Usa el validador correcto
     registrarAuditoria({...}),
     (req, res, next) => {
       return novedadesController.updateNovedad(req, res, next);
     }
   );
   ```

## ✅ Conclusión

El campo `observaciones` **SÍ se está guardando correctamente** en el endpoint de actualización.

### Configuración Completa:
- ✅ Campo existe en el modelo
- ✅ Validador configurado (opcional, máx 1000 caracteres)
- ✅ Incluido en validateUpdateNovedad
- ✅ Spread operator incluye el campo en el update
- ✅ Ruta usa el validador correcto

## 🧪 Cómo Probar

### Request de Prueba
```bash
PUT /api/v1/novedades/19
Authorization: Bearer {token}
Content-Type: application/json

{
  "observaciones": "Esta es una observación de prueba actualizada"
}
```

### Respuesta Esperada
```json
{
  "success": true,
  "message": "Novedad actualizada exitosamente",
  "data": {
    "id": 19,
    "observaciones": "Esta es una observación de prueba actualizada",
    "updated_by": 5,
    "updated_at": "2026-01-04T22:00:00.000Z",
    ...
  }
}
```

## 🔍 Posibles Causas de Problemas

Si el campo NO se está guardando, verificar:

1. **El frontend está enviando el campo:**
   ```javascript
   // Verificar en Network tab del navegador
   {
     "observaciones": "texto aquí" // ✅ Debe estar presente
   }
   ```

2. **El campo no está siendo filtrado por algún middleware**
   - Revisar si hay algún middleware que sanitice el body

3. **El trigger de BD no está sobrescribiendo el valor**
   - Revisar triggers en la tabla novedades_incidentes

4. **Verificación en Base de Datos:**
   ```sql
   SELECT id, observaciones, updated_at, updated_by
   FROM novedades_incidentes
   WHERE id = 19;
   ```

## 📋 Recomendación

Si el problema persiste después de verificar lo anterior:
1. Agregar un `console.log` temporal en el controlador para debuguear
2. Verificar que no haya triggers de BD que sobrescriban el campo
3. Confirmar que el request desde el frontend incluye el campo
