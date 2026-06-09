# Sistema RBAC

### Roles predefinidos

| Rol | Slug | Tipo | Nivel |
|---|---|---|---|
| Super Administrador | `super_admin` | Sistema | 0 |
| Administrador | `admin` | Sistema | 1 |
| Supervisor | `supervisor` | Sistema | 2 |
| Operador | `operador` | Sistema | 3 |
| Consulta | `consulta` | Sistema | 4 |
| Radio Operador | `radio_operador` | Operativo | — |
| Sereno | `sereno` | Operativo | — |
| Telefonista | `telefonista` | Operativo | — |
| Invitado | `invitado` | Operativo | — |
| Usuario Básico | `usuario_basico` | Operativo | — |

**Roles del sistema** (`super_admin`, `admin`, `supervisor`, `operador`, `consulta`): van hardcodeados en el primer argumento de `verificarRolesOPermisos`.
**Roles operativos** (`radio_operador`, `sereno`, `telefonista`, etc.): acceden exclusivamente vía permisos asignados en la DB (segundo argumento).

### Formato de permisos

`modulo.recurso.accion`

```
usuarios.usuarios.read
novedades.incidentes.create
vehiculos.combustible.read
```

### Middlewares de autorización

```js
import {
  verificarToken,
  verificarRolesOPermisos,
  requireAnyPermission,
} from '../middlewares/authMiddleware.js';
```

#### Patrón principal: `verificarRolesOPermisos(rolesDelSistema, permisosDB)`

Este middleware implementa lógica OR en dos capas:

```js
router.get(
  '/ruta',
  verificarToken,
  verificarRolesOPermisos(
    ['super_admin', 'admin', 'supervisor', 'operador', 'consulta'], // ← capa 1
    ['modulo.recurso.read']                                          // ← capa 2
  ),
  controller
);
```

**Capa 1 — Roles del sistema (hardcodeados):**
- Son los roles de gestión/operación que SIEMPRE tienen acceso al endpoint.
- Se hardcodean porque son roles que el sistema define como "roles de turno" con acceso garantizado.
- `super_admin` y `admin` siempre pasan, incluso si no aparecen en la lista — el middleware los eleva automáticamente.
- Los roles secundarios como `radio_operador`, `sereno`, `telefonista` **NO van aquí**.

**Capa 2 — Permisos dinámicos (desde la DB):**
- Se verifican contra `req.user.permisos`, que se carga en cada request desde la tabla `permisos` vía `rol_permisos`.
- Permiten que roles secundarios (`radio_operador`, `sereno`, etc.) accedan dinámicamente según lo que el administrador les haya asignado en la DB.
- Los slugs deben usar **dot notation**: `modulo.recurso.accion` (nunca underscore entre partes).
- Si un rol secundario debe tener acceso, se le asigna el permiso en la DB — no se toca el código de la ruta.

**Regla clave:** nunca agregar `radio_operador`, `sereno`, `telefonista` u otros roles operativos al array de la capa 1. Esos roles se manejan exclusivamente por la capa 2.

#### Slugs de permisos — dot notation obligatoria

```
✅ catalogos.tipos.novedad.read
✅ calles.calles.cuadrantes.read
✅ reportes.operativos.dashboard.read

❌ catalogos.tipos_novedad.read      ← underscore entre partes = incorrecto
❌ calles.calles_cuadrantes.read     ← idem
```

Si se crea un permiso nuevo en `seedRBAC.js`, el slug debe usar dot notation desde el inicio.

#### Migraciones de slugs en MySQL Railway

Los slugs en MySQL Railway deben mantenerse sincronizados con Supabase (fuente de verdad).
Scripts de migración en `src/scripts/` y SQL en `database/migrations/`.

Para ejecutar un script de migración desde local contra Railway MySQL usar la URL pública:
```bash
railway run --service citizen_security_db node src/scripts/<script>.js
# El script debe leer process.env.MYSQL_PUBLIC_URL (no DB_HOST, que es interno)
```

> Los permisos con `es_sistema: true` **no se pueden editar ni eliminar**.
