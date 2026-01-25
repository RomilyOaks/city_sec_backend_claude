# Árbol del proyecto (excluye `.gitignore`)

Fuente: `git ls-files --cached --others --exclude-standard`

```
city_sec_backend_claude/
│
├── .env.example
├── .gitignore
├── API_DOCUMENTATION.md
├── MANUAL_RAILWAY_MYSQL_BACKEND.md
├── QUICK_START.md
├── README.md
├── README copy.md
├── jest.config.js
├── package.json
├── package-lock.json
├── swagger.js
├── swagger_output.json
├── test-associations.js
│
├── docs/
│   └── img/
│       ├── 01_railway_architecture.png
│       ├── 02_mysql_variables.png
│       ├── 03_backend_variables.png
│       ├── 04_backend_swagger_docs.png
│       ├── 07_deployment_ok.png
│       └── 08_checkendpoint_health.png
│
├── postman/
│   ├── CitySec_Abastecimientos.postman_collection.json
│   ├── CitySec_Mantenimientos.postman_collection.json
│   ├── CitySec_NovedadesIncidentes.postman_collection.json
│   ├── CitySec_PersonalSeguridad.postman_collection.json
│   ├── CitySec_Reportes.postman_collection.json
│   ├── CitySec_Seguridad.postman_collection.json
│   ├── CitySec_Talleres.postman_collection.json
│   ├── CitySec_UnidadesOficina.postman_collection.json
│   └── CitySec_Vehiculos.postman_collection.json
│
├── src/
│   ├── app.js
│   ├── project_structure_src.txt
│   │
│   ├── config/
│   │   ├── auth.js
│   │   └── database.js
│   │
│   ├── constants/
│   │   └── validations.js
│   │
│   ├── controllers/
│   │   ├── abastecimientosController.js
│   │   ├── auditoriaAccionController.js
│   │   ├── auditoriaController.js
│   │   ├── authController.js
│   │   ├── cargosController.js
│   │   ├── catalogosController.js
│   │   ├── cuadrantesController.js
│   │   ├── estadoNovedadController.js
│   │   ├── mantenimientosController.js
│   │   ├── novedadesController.js
│   │   ├── permisosController.js
│   │   ├── personalController.js
│   │   ├── reportesController.js
│   │   ├── rolesController.js
│   │   ├── sectoresController.js
│   │   ├── subtipoNovedadController.js
│   │   ├── talleresController.js
│   │   ├── tipoNovedadController.js
│   │   ├── unidadOficinaController.js
│   │   ├── usuariosController.js
│   │   └── vehiculosController.js
│   │
│   ├── middlewares/
│   │   ├── auditoriaAccionMiddleware.js
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── AbastecimientoCombustible.js
│   │   ├── AuditoriaAccion.js
│   │   ├── Cargo.js
│   │   ├── Cuadrante.js
│   │   ├── EmailVerification.js
│   │   ├── EstadoNovedad.js
│   │   ├── HistorialEstadoNovedad.js
│   │   ├── HistorialUsuario.js
│   │   ├── LoginIntento.js
│   │   ├── MantenimientoVehiculo.js
│   │   ├── Novedad.js
│   │   ├── PasswordHistorial.js
│   │   ├── PasswordReset.js
│   │   ├── Permiso.js
│   │   ├── PersonalSeguridad.js
│   │   ├── Rol.js
│   │   ├── RolPermiso.js
│   │   ├── Sector.js
│   │   ├── Sesion.js
│   │   ├── SubtipoNovedad.js
│   │   ├── Taller.js
│   │   ├── TipoNovedad.js
│   │   ├── TipoVehiculo.js
│   │   ├── TokenAcceso.js
│   │   ├── Ubigeo.js
│   │   ├── UnidadOficina.js
│   │   ├── Usuario.js
│   │   ├── UsuarioPermiso.js
│   │   ├── UsuarioRoles.js
│   │   ├── Vehiculo.js
│   │   └── index.js
│   │
│   ├── routes/
│   │   ├── abastecimientos.routes.js
│   │   ├── auditoria.routes.js
│   │   ├── auditoriaAcciones.routes.js
│   │   ├── auth.routes.js
│   │   ├── cargos.routes.js
│   │   ├── catalogos.routes.js
│   │   ├── cuadrantes.routes.js
│   │   ├── estado-novedad.routes.js
│   │   ├── index.routes.js
│   │   ├── mantenimientos.routes.js
│   │   ├── novedades.routes.js
│   │   ├── permisos.routes.js
│   │   ├── personal.routes.js
│   │   ├── reportes.routes.js
│   │   ├── roles.routes.js
│   │   ├── sectores.routes.js
│   │   ├── subtipo-novedad.routes.js
│   │   ├── talleres.routes.js
│   │   ├── tipo-novedad.routes.js
│   │   ├── unidad-oficina.routes.js
│   │   ├── usuarios.routes.js
│   │   └── vehiculos.routes.js
│   │
│   ├── seeders/
│   │   └── seedRBAC.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   └── resolveEntidadPolimorfica.js
│   │
│   └── validators/
│       ├── abastecimiento.validator.js
│       ├── cuadrante.validator.js
│       ├── estado-novedad.validator.js
│       ├── mantenimiento.validator.js
│       ├── novedad.validator.js
│       ├── personal.validator.js
│       ├── reportes.validator.js
│       ├── sector.validator.js
│       ├── subtipo-novedad.validator.js
│       ├── talleres.validator.js
│       ├── tipo-novedad.validator.js
│       ├── unidad-oficina.validator.js
│       └── vehiculo.validator.js
│
├── tests/
│   ├── jest.setup.cjs
│   ├── jest.setup.js
│   └── integration/
│       ├── seguridad_rbac.test.js
│       └── smoke.test.js
│
└── tools/
    ├── db_describe_tables.cjs
    ├── db_tree_audit.cjs
    └── rbac_audit.cjs
```
