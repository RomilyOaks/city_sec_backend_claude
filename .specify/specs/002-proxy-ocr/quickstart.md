# Quickstart — TD-P-002: Proxy OCR de Comprobantes de Combustible

**Cómo verificar que el feature funciona end-to-end en local**

---

## Prerrequisitos

- Backend local corriendo: `npm run dev` en `city_sec_backend_claude` (:3000)
- Variable `ANTHROPIC_API_KEY` en `.env` del backend (solicitar al lead técnico)
- `city_sec_patrol` disponible en la misma máquina o con `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`
- Usuario con rol `operador` o superior en la BD local (o usar seed admin)

---

## Verificación rápida con curl

### 1. Obtener JWT

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@citysec.com","password":"Admin123!"}'
# Copiar el accessToken de la respuesta
```

### 2. Llamar al proxy con una imagen de prueba

```bash
# Convertir imagen a base64
IMG_B64=$(base64 -i /ruta/a/comprobante.jpg | tr -d '\n')

curl -X POST http://localhost:3000/api/v1/vision/analizar \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\":\"$IMG_B64\",\"mediaType\":\"image/jpeg\"}"
```

Respuesta esperada (campos según visibilidad en el comprobante):
```json
{
  "success": true,
  "message": "Comprobante analizado correctamente",
  "data": {
    "fecha": "2026-05-15",
    "hora": "14:30",
    "proveedor": "Grifo ...",
    "tipo_combustible": "gasohol_95",
    "galones": 10.5,
    "precio_por_galon": 17.50,
    "monto_total": 183.75,
    "numero_comprobante": "E001-001234",
    "placa_vehiculo": null
  }
}
```

### 3. Verificar 401 sin token

```bash
curl -X POST http://localhost:3000/api/v1/vision/analizar \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"dGVzdA==","mediaType":"image/jpeg"}'
# Debe responder HTTP 401
```

---

## Verificar que el permiso está en BD

```sql
-- Supabase SQL Editor o via mcp__supabase__execute_sql
SELECT p.slug, r.slug AS rol
FROM citysecure.permisos p
JOIN citysecure.rol_permisos rp ON rp.permiso_id = p.id
JOIN citysecure.roles r ON r.id = rp.rol_id
WHERE p.slug = 'vehiculos.combustible.ocr'
ORDER BY r.slug;
```

Resultado esperado:
```
slug                      | rol
vehiculos.combustible.ocr | admin
vehiculos.combustible.ocr | operador
vehiculos.combustible.ocr | supervisor
```

---

## Verificar que la API key no está en el APK

```bash
# Desde la raíz del monorepo
grep -r "CLAUDE_API_KEY\|ANTHROPIC" /d/robles/project/city_sec_patrol/src/
# → debe retornar vacío
grep -r "EXPO_PUBLIC_CLAUDE_API_KEY" /d/robles/project/city_sec_patrol/
# → debe retornar vacío
```

---

## Verificar el flujo completo en el APK

1. Levantar backend local: `npm run dev` (city_sec_backend_claude)
2. En `city_sec_patrol/.env`: asegurar `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`
3. Iniciar el APK: `npx expo start` en `city_sec_patrol/`
4. Login como `operador` o superior
5. Tab Combustible → botón "Tomar foto del comprobante"
6. Tomar foto o usar imagen de galería
7. Verificar que el formulario se prellena con los datos extraídos
8. En los logs del backend: debe verse `POST /api/v1/vision/analizar 200`

---

## Rollback rápido

Si el endpoint falla en producción y el APK queda sin funcionalidad OCR:
1. Revertir `visionService.js` al commit anterior (restaura llamada directa temporal)
2. Restaurar `EXPO_PUBLIC_CLAUDE_API_KEY` en EAS Dashboard
3. Generar nuevo build de emergencia
4. Investigar la causa del fallo en Railway logs

> El rollback es reversible — el APK anterior ya compilado sigue funcionando hasta que se distribuya uno nuevo.
