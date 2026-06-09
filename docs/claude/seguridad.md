# Restricciones Importantes

- **No usar `require()`** — este proyecto es 100% ES Modules.
- **No hardcodear** valores de configuración; todo desde `.env`.
- **No modificar** los permisos del sistema (`es_sistema: true`).
- **No commitear** credenciales ni el archivo `.env`.
- **No hacer push** sin preguntar al usuario primero.
- Cuando se agregue un nuevo módulo, registrar su ruta en `src/routes/index.routes.js`.
- Regenerar Swagger con `npm run swagger` si se modifican endpoints.

---

## Seguridad — Guía para Desarrollo Futuro

> Detalle completo en [`docs/historial.md`](../historial.md) sección "Seguridad".

Reglas rápidas:
- Nunca hardcodear contraseñas — usar `process.env.VAR || "fallback"`.
- `.env.example` solo con placeholders descriptivos, nunca valores reales.
- En docs/swagger: usar `<ACCESS_TOKEN>`, nunca el prefijo base64 de JWT.
- `npm audit` antes de commitear nuevas dependencias.
- Dockerfile: `USER node` siempre, nunca root.
- Commitear cambios ANTES de ejecutar `git filter-repo`.

---

## Credenciales Iniciales (post seed:rbac)

```
Username: admin
Email:    admin@citysec.com
Password: Admin123!
```

⚠️ Cambiar inmediatamente después del primer login en producción.
