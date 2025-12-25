# 🏗️ CITY SEC BACKEND - ÁRBOL DE PROYECTO (INVENTARIO COMPLETO)

> **Última actualización:** 23 de Diciembre 2025  
> **Versión:** Backend API Node.js + Express + Sequelize + MySQL

---

```
city_sec_backend_claude/
│
├── 📄 .env                                    # Variables de entorno (NO en git)
├── 📄 .gitignore                              # Archivos ignorados por git
├── 📄 package.json                            # Dependencias y scripts
├── 📄 package-lock.json                       # Lock de dependencias
├── 📄 jest.config.js                          # ✅ Configuración de Jest
├── 📄 swagger.js                              # ✅ Configuración Swagger
├── 📄 swagger_output.json                     # ✅ Output generado de Swagger
├── 📄 test-associations.js                    # ✅ Test de asociaciones de modelos
│
├── 📄 README.md                               # ✅ Documentación principal
├── 📄 README copy.md                          # Copia de README
├── 📄 API_DOCUMENTATION.md                    # ✅ Documentación de API
├── 📄 QUICK_START.md                          # ✅ Guía rápida de inicio
├── 📄 MANUAL_RAILWAY_MYSQL_BACKEND.md         # ✅ Manual de despliegue Railway
├── 📄 MANUAL_RAILWAY_MYSQL_BACKEND.pdf        # ✅ Manual en PDF
├── 📄 PROJECT_TREE.md                         # Árbol de proyecto anterior
├── 📄 PROJECT_TREE.pdf                        # Árbol en PDF
├── 📄 CITIZEN_SECURITY_DB_v2b.sql             # ✅ Script SQL principal v2b
│
├── 📂 src/                                    # ⭐ CÓDIGO FUENTE PRINCIPAL
│   ├── 📄 app.js                              # ✅ Configuración Express
│   │
│   ├── 📂 config/                             # Configuraciones
│   │   ├── 📄 auth.js                         # ✅ Configuración JWT/Auth
│   │   └── 📄 database.js                     # ✅ Conexión Sequelize/MySQL
│   │
│   ├── 📂 constants/                          # Constantes
│   │   └── 📄 validations.js                  # ✅ Constantes de validación
│   │
│   ├── 📂 models/                             # ⭐ Modelos Sequelize (31 archivos)
│   │   ├── 📄 index.js                        # ✅ Exportador + relaciones
│   │   │
│   │   ├── 🔐 AUTENTICACIÓN Y USUARIOS
│   │   ├── 📄 Usuario.js                      # ✅
│   │   ├── 📄 Rol.js                          # ✅
│   │   ├── 📄 Permiso.js                      # ✅
│   │   ├── 📄 UsuarioRoles.js                 # ✅
│   │   ├── 📄 UsuarioPermiso.js               # ✅
│   │   ├── 📄 RolPermiso.js                   # ✅
│   │   ├── 📄 PasswordHistorial.js            # ✅
│   │   ├── 📄 PasswordReset.js                # ✅
│   │   ├── 📄 EmailVerification.js            # ✅
│   │   ├── 📄 HistorialUsuario.js             # ✅
│   │   │
│   │   ├── 👥 PERSONAL
│   │   ├── 📄 PersonalSeguridad.js            # ✅
│   │   ├── 📄 Cargo.js                        # ✅
│   │   │
│   │   ├── 🚗 VEHÍCULOS
│   │   ├── 📄 Vehiculo.js                     # ✅
│   │   ├── 📄 TipoVehiculo.js                 # ✅
│   │   ├── 📄 AbastecimientoCombustible.js    # ✅
│   │   ├── 📄 MantenimientoVehiculo.js        # ✅
│   │   ├── 📄 Taller.js                       # ✅
│   │   │
│   │   ├── 📋 NOVEDADES
│   │   ├── 📄 Novedad.js                      # ✅
│   │   ├── 📄 TipoNovedad.js                  # ✅
│   │   ├── 📄 SubtipoNovedad.js               # ✅
│   │   ├── 📄 EstadoNovedad.js                # ✅
│   │   ├── 📄 HistorialEstadoNovedad.js       # ✅
│   │   │
│   │   ├── 🗺️ SECTORES Y UBICACIÓN
│   │   ├── 📄 Sector.js                       # ✅
│   │   ├── 📄 Cuadrante.js                    # ✅
│   │   ├── 📄 Ubigeo.js                       # ✅
│   │   │
│   │   ├── 🏢 UNIDADES Y OFICINAS
│   │   ├── 📄 UnidadOficina.js                # ✅
│   │   │
│   │   └── 📊 AUDITORÍA Y SESIONES
│   │       ├── 📄 AuditoriaAccion.js          # ✅
│   │       ├── 📄 LoginIntento.js             # ✅
│   │       ├── 📄 Sesion.js                   # ✅
│   │       └── 📄 TokenAcceso.js              # ✅
│   │
│   ├── 📂 controllers/                        # ⭐ Controladores (23 archivos)
│   │   │
│   │   ├── 🔐 AUTENTICACIÓN
│   │   ├── 📄 authController.js               # ✅
│   │   ├── 📄 usuariosController.js           # ✅
│   │   ├── 📄 rolesController.js              # ✅
│   │   ├── 📄 permisosController.js           # ✅
│   │   │
│   │   ├── 👥 PERSONAL
│   │   ├── 📄 personalController.js           # ✅
│   │   ├── 📄 cargosController.js             # ✅
│   │   │
│   │   ├── 🚗 VEHÍCULOS
│   │   ├── 📄 vehiculosController.js          # ✅
│   │   ├── 📄 abastecimientosController.js    # ✅
│   │   ├── 📄 mantenimientosController.js     # ✅
│   │   ├── 📄 talleresController.js           # ✅
│   │   │
│   │   ├── 📋 NOVEDADES
│   │   ├── 📄 novedadesController.js          # ✅
│   │   ├── 📄 tipoNovedadController.js        # ✅
│   │   ├── 📄 subtipoNovedadController.js     # ✅
│   │   ├── 📄 estadoNovedadController.js      # ✅
│   │   ├── 📄 historialEstadoNovedadController.js # ✅
│   │   │
│   │   ├── 🗺️ SECTORES Y UBICACIÓN
│   │   ├── 📄 sectoresController.js           # ✅
│   │   ├── 📄 cuadrantesController.js         # ✅
│   │   ├── 📄 ubigeoController.js             # ✅
│   │   │
│   │   ├── 🏢 UNIDADES
│   │   ├── 📄 unidadOficinaController.js      # ✅
│   │   │
│   │   ├── 📚 CATÁLOGOS
│   │   ├── 📄 catalogosController.js          # ✅
│   │   │
│   │   ├── 📊 AUDITORÍA
│   │   ├── 📄 auditoriaController.js          # ✅
│   │   ├── 📄 auditoriaAccionController.js    # ✅
│   │   │
│   │   └── 📈 REPORTES
│   │       └── 📄 reportesController.js       # ✅
│   │
│   ├── 📂 routes/                             # ⭐ Rutas (23 archivos)
│   │   ├── 📄 index.routes.js                 # ✅ Enrutador principal
│   │   │
│   │   ├── 🔐 AUTENTICACIÓN
│   │   ├── 📄 auth.routes.js                  # ✅
│   │   ├── 📄 usuarios.routes.js              # ✅
│   │   ├── 📄 roles.routes.js                 # ✅
│   │   ├── 📄 permisos.routes.js              # ✅
│   │   │
│   │   ├── 👥 PERSONAL
│   │   ├── 📄 personal.routes.js              # ✅
│   │   ├── 📄 cargos.routes.js                # ✅
│   │   │
│   │   ├── 🚗 VEHÍCULOS
│   │   ├── 📄 vehiculos.routes.js             # ✅
│   │   ├── 📄 abastecimientos.routes.js       # ✅
│   │   ├── 📄 mantenimientos.routes.js        # ✅
│   │   ├── 📄 talleres.routes.js              # ✅
│   │   │
│   │   ├── 📋 NOVEDADES
│   │   ├── 📄 novedades.routes.js             # ✅
│   │   ├── 📄 tipo-novedad.routes.js          # ✅
│   │   ├── 📄 subtipo-novedad.routes.js       # ✅
│   │   ├── 📄 estado-novedad.routes.js        # ✅
│   │   │
│   │   ├── 🗺️ SECTORES Y UBICACIÓN
│   │   ├── 📄 sectores.routes.js              # ✅
│   │   ├── 📄 cuadrantes.routes.js            # ✅
│   │   ├── 📄 ubigeoRoutes.js                 # ✅
│   │   │
│   │   ├── 🏢 UNIDADES
│   │   ├── 📄 unidad-oficina.routes.js        # ✅
│   │   │
│   │   ├── 📚 CATÁLOGOS
│   │   ├── 📄 catalogos.routes.js             # ✅
│   │   │
│   │   ├── 📊 AUDITORÍA
│   │   ├── 📄 auditoria.routes.js             # ✅
│   │   ├── 📄 auditoriaAcciones.routes.js     # ✅
│   │   │
│   │   └── 📈 REPORTES
│   │       └── 📄 reportes.routes.js          # ✅
│   │
│   ├── 📂 middlewares/                        # Middlewares (2 archivos)
│   │   ├── 📄 authMiddleware.js               # ✅ Autenticación JWT
│   │   └── 📄 auditoriaAccionMiddleware.js    # ✅ Registro de acciones
│   │
│   ├── 📂 validators/                         # ⭐ Validadores (13 archivos)
│   │   ├── 📄 abastecimiento.validator.js     # ✅
│   │   ├── 📄 cuadrante.validator.js          # ✅
│   │   ├── 📄 estado-novedad.validator.js     # ✅
│   │   ├── 📄 mantenimiento.validator.js      # ✅
│   │   ├── 📄 novedad.validator.js            # ✅
│   │   ├── 📄 personal.validator.js           # ✅
│   │   ├── 📄 reportes.validator.js           # ✅
│   │   ├── 📄 sector.validator.js             # ✅
│   │   ├── 📄 subtipo-novedad.validator.js    # ✅
│   │   ├── 📄 talleres.validator.js           # ✅
│   │   ├── 📄 tipo-novedad.validator.js       # ✅
│   │   ├── 📄 unidad-oficina.validator.js     # ✅
│   │   └── 📄 vehiculo.validator.js           # ✅
│   │
│   ├── 📂 seeders/                            # Seeders (3 archivos)
│   │   ├── 📄 seedRBAC.js                     # ✅ Seed roles/permisos
│   │   ├── 📄 seedEstadosNovedad.js           # ✅ Seed estados novedad
│   │   └── 📄 runSeedEstados.js               # ✅ Runner de seeds
│   │
│   └── 📂 utils/                              # Utilidades (7 archivos)
│       ├── 📄 logger.js                       # ✅ Winston logger
│       ├── 📄 resolveEntidadPolimorfica.js    # ✅ Resolver entidades
│       ├── 📄 convert-to-esm.js               # Herramienta migración ESM
│       ├── 📄 fix-double-extension.js         # Herramienta fix extensiones
│       ├── 📄 fix-import-paths.js             # Herramienta fix imports
│       ├── 📄 fix-imports.js                  # Herramienta fix imports
│       └── 📄 fix-routes-imports.js           # Herramienta fix rutas
│
├── 📂 postman/                                # ⭐ Colecciones Postman (10 archivos)
│   ├── 📄 CitySec_Abastecimientos.postman_collection.json      # ✅
│   ├── 📄 CitySec_Auth_Login.postman_collection.json           # ✅
│   ├── 📄 CitySec_Mantenimientos.postman_collection.json       # ✅
│   ├── 📄 CitySec_NovedadesIncidentes.postman_collection.json  # ✅
│   ├── 📄 CitySec_PersonalSeguridad.postman_collection.json    # ✅
│   ├── 📄 CitySec_Reportes.postman_collection.json             # ✅
│   ├── 📄 CitySec_Seguridad.postman_collection.json            # ✅
│   ├── 📄 CitySec_Talleres.postman_collection.json             # ✅
│   ├── 📄 CitySec_UnidadesOficina.postman_collection.json      # ✅
│   └── 📄 CitySec_Vehiculos.postman_collection.json            # ✅
│
├── 📂 scripts/                                # Scripts SQL y JS (4 archivos)
│   ├── 📄 seedUbigeo.js                       # ✅ Seed ubigeo JS
│   ├── 📄 seed_catalogos_railway.sql          # ✅ Seed catálogos Railway
│   ├── 📄 seed_ubigeo.sql                     # ✅ Seed ubigeo SQL
│   └── 📄 seed_ubigeo_railway.sql             # ✅ Seed ubigeo Railway
│
├── 📂 sql/                                    # Scripts SQL adicionales
│   └── 📄 create_index_reportante_doc.sql     # ✅ Índice reportante
│
├── 📂 tools/                                  # Herramientas de desarrollo (3 archivos)
│   ├── 📄 db_describe_tables.cjs              # ✅ Describe tablas BD
│   ├── 📄 db_tree_audit.cjs                   # ✅ Auditoría árbol BD
│   └── 📄 rbac_audit.cjs                      # ✅ Auditoría RBAC
│
├── 📂 docs/                                   # Documentación
│   └── 📂 img/                                # Imágenes documentación
│       ├── 📄 01_railway_architecture.png     # ✅
│       ├── 📄 02_mysql_variables.png          # ✅
│       ├── 📄 03_backend_variables.png        # ✅
│       ├── 📄 04_backend_swagger_docs.png     # ✅
│       ├── 📄 07_deployment_ok.png            # ✅
│       └── 📄 08_checkendpoint_health.png     # ✅
│
├── 📂 tests/                                  # ⭐ Tests
│   ├── 📄 jest.setup.js                       # ✅ Setup Jest ESM
│   ├── 📄 jest.setup.cjs                      # ✅ Setup Jest CJS
│   │
│   ├── 📂 integration/                        # Tests de integración
│   │   ├── 📄 seguridad_rbac.test.js          # ✅ Test RBAC
│   │   └── 📄 smoke.test.js                   # ✅ Smoke test
│   │
│   └── 📂 unit/                               # Tests unitarios (vacío)
│
├── 📂 coverage/                               # Reportes de cobertura Jest
│   ├── 📄 clover.xml                          # ✅
│   ├── 📄 coverage-final.json                 # ✅
│   └── 📂 lcov-report/                        # ✅ Reporte HTML
│
├── 📂 logs/                                   # Logs de aplicación (vacío)
│
└── 📂 previous-versions/                      # Backups/versiones anteriores
    ├── 📄 Novedad.-copy.js
    ├── 📄 PersonalSeguridad-copy.js
    ├── 📄 authMiddleware-copy.js
    ├── 📄 index.js.backup
    ├── 📄 index.routes-copy.js
    ├── 📄 index.routes.js.backup
    ├── 📄 novedadValidation-para-eliminar.js
    ├── 📄 personal.routes-copy.js
    ├── 📄 personal.routes-copy2.js
    ├── 📄 personalController-copy.js
    └── 📄 personalController-copy2.js
```

---

## 📊 RESUMEN DE INVENTARIO

| Categoría         | Cantidad | Estado |
|-------------------|----------|--------|
| **Modelos**       | 31 | ✅ Completo |
| **Controladores** | 23 | ✅ Completo |
| **Rutas**         | 23 | ✅ Completo |
| **Validadores**   | 13 | ✅ Completo |
| **Middlewares**   | 2 | ✅ Completo |
| **Seeders**             | 3 | ✅ Completo |
| **Utils**               | 7 | ✅ Completo |
| **Colecciones Postman** | 10 | ✅ Completo |
| **Tests**               | 4 | ✅ Básico |
| **Scripts**             | 4 | ✅ Completo |
| **Tools** | 3 | ✅ Completo |

---

## 🔗 MÓDULOS POR DOMINIO

### 🔐 Autenticación y Seguridad
- **Modelos:** Usuario, Rol, Permiso, UsuarioRoles, UsuarioPermiso, RolPermiso, PasswordHistorial, PasswordReset, EmailVerification, HistorialUsuario
- **Controladores:** authController, usuariosController, rolesController, permisosController
- **Rutas:** auth.routes, usuarios.routes, roles.routes, permisos.routes

### 👥 Personal
- **Modelos:** PersonalSeguridad, Cargo
- **Controladores:** personalController, cargosController
- **Rutas:** personal.routes, cargos.routes
- **Validadores:** personal.validator

### 🚗 Vehículos
- **Modelos:** Vehiculo, TipoVehiculo, AbastecimientoCombustible, MantenimientoVehiculo, Taller
- **Controladores:** vehiculosController, abastecimientosController, mantenimientosController, talleresController
- **Rutas:** vehiculos.routes, abastecimientos.routes, mantenimientos.routes, talleres.routes
- **Validadores:** vehiculo.validator, abastecimiento.validator, mantenimiento.validator, talleres.validator

### 📋 Novedades
- **Modelos:** Novedad, TipoNovedad, SubtipoNovedad, EstadoNovedad, HistorialEstadoNovedad
- **Controladores:** novedadesController, tipoNovedadController, subtipoNovedadController, estadoNovedadController, historialEstadoNovedadController
- **Rutas:** novedades.routes, tipo-novedad.routes, subtipo-novedad.routes, estado-novedad.routes
- **Validadores:** novedad.validator, tipo-novedad.validator, subtipo-novedad.validator, estado-novedad.validator

### 🗺️ Sectores y Ubicación
- **Modelos:** Sector, Cuadrante, Ubigeo
- **Controladores:** sectoresController, cuadrantesController, ubigeoController
- **Rutas:** sectores.routes, cuadrantes.routes, ubigeoRoutes
- **Validadores:** sector.validator, cuadrante.validator

### 🏢 Unidades y Oficinas
- **Modelos:** UnidadOficina
- **Controladores:** unidadOficinaController
- **Rutas:** unidad-oficina.routes
- **Validadores:** unidad-oficina.validator

### 📊 Auditoría y Sesiones
- **Modelos:** AuditoriaAccion, LoginIntento, Sesion, TokenAcceso
- **Controladores:** auditoriaController, auditoriaAccionController
- **Rutas:** auditoria.routes, auditoriaAcciones.routes
- **Middlewares:** auditoriaAccionMiddleware

### 📈 Reportes
- **Controladores:** reportesController
- **Rutas:** reportes.routes
- **Validadores:** reportes.validator

---

## 🛠️ TECNOLOGÍAS

- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Sequelize
- **Base de Datos:** MySQL
- **Autenticación:** JWT (jsonwebtoken)
- **Validación:** express-validator
- **Documentación:** Swagger (swagger-autogen)
- **Testing:** Jest
- **Logging:** Winston
- **Despliegue:** Railway

---

*Generado automáticamente - City Sec Backend v2*
