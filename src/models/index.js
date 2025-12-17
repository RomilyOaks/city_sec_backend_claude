/**
 * ===================================================
 * ARCHIVO CENTRAL DE MODELOS SEQUELIZE
 * ===================================================
 *
 * Ruta: src/models/index.js
 *
 * Descripción:
 * Archivo central que importa todos los modelos Sequelize y define
 * las asociaciones (relaciones) entre ellos para el ORM.
 *
 * VERSIÓN: 2.1.0
 * ÚLTIMA ACTUALIZACIÓN: 2025-12-12
 *
 * HISTORIAL DE CAMBIOS:
 * =====================
 * v2.1.0 (2025-12-12):
 *   - ✅ Agregado modelo Cargo con relaciones completas
 *   - ✅ Mejorada documentación de todas las asociaciones
 *   - ✅ Agregado sistema de versionado
 *   - ✅ Documentación JSDoc completa
 *
 * v2.0.0 (2025-12-10):
 *   - ✅ Agregado modelo PersonalSeguridad
 *   - ✅ Refactorización de asociaciones de auditoría
 *
 * v1.0.0 (2025-11-01):
 *   - 🎉 Versión inicial con modelos base
 *
 * MODELOS INCLUIDOS:
 * ==================
 * 📚 Catálogos Base:
 *    - Cargo ✅ NEW
 *    - TipoVehiculo
 *    - Ubigeo
 *    - TipoNovedad
 *    - SubtipoNovedad
 *    - EstadoNovedad
 *
 * 🗺️ Ubicación y Territorio:
 *    - Sector
 *    - Cuadrante
 *
 * 🚗 Recursos Operativos:
 *    - Vehiculo
 *    - PersonalSeguridad
 *    - UnidadOficina
 *
 * 📋 Novedades/Incidentes:
 *    - Novedad
 *    - HistorialEstadoNovedad
 *
 * 👥 Autenticación y Autorización:
 *    - Usuario
 *    - Rol
 *    - Permiso
 *    - UsuarioRol
 *
 * 📊 Auditoría:
 *    - HistorialUsuario
 *    - LoginIntento
 *    - AuditoriaAccion
 *
 * @module models/index
 * @requires sequelize
 * @author Sistema de Seguridad Ciudadana
 * @version 2.1.0
 * @date 2025-12-12
 */

//=============================================
// IMPORTAR INSTANCIA DE SEQUELIZE
//=============================================

import sequelize from "../config/database.js";

//=============================================
// IMPORTAR MODELOS - CATÁLOGOS BASE
//=============================================

/**
 * Modelo Cargo
 * Define los diferentes puestos/cargos de trabajo del personal
 * @type {Model}
 */
import Cargo from "./Cargo.js";

/**
 * Modelo TipoVehiculo
 * Categorización de tipos de vehículos (patrullero, moto, camioneta, etc.)
 * @type {Model}
 */
import TipoVehiculo from "./TipoVehiculo.js";

/**
 * Modelo Ubigeo
 * Catálogo de ubicaciones geográficas (departamento, provincia, distrito)
 * @type {Model}
 */
import Ubigeo from "./Ubigeo.js";

//=============================================
// IMPORTAR MODELOS - UBICACIÓN Y TERRITORIO
//=============================================

/**
 * Modelo Sector
 * Define las zonas/sectores de vigilancia
 * @type {Model}
 */
import Sector from "./Sector.js";

/**
 * Modelo Cuadrante
 * Subdivisiones de sectores para patrullaje
 * @type {Model}
 */
import Cuadrante from "./Cuadrante.js";

//=============================================
// IMPORTAR MODELOS - RECURSOS OPERATIVOS
//=============================================

/**
 * Modelo Vehiculo
 * Gestión de la flota vehicular
 * @type {Model}
 */
import Vehiculo from "./Vehiculo.js";

/**
 * Modelo PersonalSeguridad
 * Gestión del personal de seguridad ciudadana
 * @type {Model}
 */
import PersonalSeguridad from "./PersonalSeguridad.js";

/**
 * Modelo UnidadOficina
 * Unidades administrativas y operativas
 * @type {Model}
 */
import UnidadOficina from "./UnidadOficina.js";

/**
 * Modelo AbastecimientoCombustible
 * Registro de abastecimiento de combustible de vehículos
 * @type {Model}
 */
import AbastecimientoCombustible from "./AbastecimientoCombustible.js";

/**
 * Modelo Taller
 * Catálogo de talleres para mantenimiento vehicular
 * @type {Model}
 */
import Taller from "./Taller.js";

/**
 * Modelo MantenimientoVehiculo
 * Registro de mantenimientos por vehículo
 * @type {Model}
 */
import MantenimientoVehiculo from "./MantenimientoVehiculo.js";

//=============================================
// IMPORTAR MODELOS - NOVEDADES/INCIDENTES
//=============================================

/**
 * Modelo TipoNovedad
 * Categorías principales de novedades
 * @type {Model}
 */
import TipoNovedad from "./TipoNovedad.js";

/**
 * Modelo SubtipoNovedad
 * Subcategorías de novedades
 * @type {Model}
 */
import SubtipoNovedad from "./SubtipoNovedad.js";

/**
 * Modelo EstadoNovedad
 * Estados del workflow de novedades
 * @type {Model}
 */
import EstadoNovedad from "./EstadoNovedad.js";

/**
 * Modelo Novedad
 * Registro de incidentes y novedades
 * @type {Model}
 */
import Novedad from "./Novedad.js";

/**
 * Modelo HistorialEstadoNovedad
 * Trazabilidad de cambios de estado en novedades
 * @type {Model}
 */
import HistorialEstadoNovedad from "./HistorialEstadoNovedad.js";

//=============================================
// IMPORTAR MODELOS - AUTENTICACIÓN Y RBAC
//=============================================

/**
 * Modelo Usuario
 * Usuarios del sistema
 * @type {Model}
 */
import Usuario from "./Usuario.js";

/**
 * Modelo Rol
 * Roles del sistema (admin, operador, etc.)
 * @type {Model}
 */
import Rol from "./Rol.js";

/**
 * Modelo Permiso
 * Permisos granulares del sistema
 * @type {Model}
 */
import Permiso from "./Permiso.js";

/**
 * Modelo UsuarioRol
 * Tabla intermedia para relación Many-to-Many Usuario <-> Rol
 * @type {Model}
 */
import UsuarioRol from "./UsuarioRoles.js";

import EmailVerification from "./EmailVerification.js";
import PasswordReset from "./PasswordReset.js";
import PasswordHistorial from "./PasswordHistorial.js";
import Sesion from "./Sesion.js";
import TokenAcceso from "./TokenAcceso.js";
import UsuarioPermiso from "./UsuarioPermiso.js";
import RolPermiso from "./RolPermiso.js";

//=============================================
// IMPORTAR MODELOS - AUDITORÍA
//=============================================

/**
 * Modelo HistorialUsuario
 * Historial de cambios en usuarios
 * @type {Model}
 */
import HistorialUsuario from "./HistorialUsuario.js";

/**
 * Modelo LoginIntento
 * Registro de intentos de login (exitosos y fallidos)
 * @type {Model}
 */
import LoginIntento from "./LoginIntento.js";

/**
 * Modelo AuditoriaAccion
 * Registro de todas las acciones del sistema
 * @type {Model}
 */
import AuditoriaAccion from "./AuditoriaAccion.js";

//=============================================================================
// DEFINICIÓN DE ASOCIACIONES (RELACIONES ENTRE MODELOS)
//=============================================================================

console.log("📌 Configurando asociaciones de modelos...");

//=============================================
// ASOCIACIONES: VEHÍCULOS
//=============================================

/**
 * Relación: TipoVehiculo -> Vehiculo (One-to-Many)
 * Un tipo de vehículo puede tener muchos vehículos
 */
TipoVehiculo.hasMany(Vehiculo, {
  foreignKey: "tipo_id",
  as: "vehiculos",
});

Vehiculo.belongsTo(TipoVehiculo, {
  foreignKey: "tipo_id",
  as: "tipoVehiculo",
});

/**
 * Relación: Vehiculo -> AbastecimientoCombustible (One-to-Many)
 * Un vehículo puede tener múltiples abastecimientos.
 */
Vehiculo.hasMany(AbastecimientoCombustible, {
  foreignKey: "vehiculo_id",
  as: "abastecimientos",
});

AbastecimientoCombustible.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculo",
});

/**
 * Relación: PersonalSeguridad -> AbastecimientoCombustible (One-to-Many)
 * Un personal puede registrar múltiples abastecimientos.
 */
PersonalSeguridad.hasMany(AbastecimientoCombustible, {
  foreignKey: "personal_id",
  as: "abastecimientos",
});

AbastecimientoCombustible.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_id",
  as: "personal",
});

/**
 * Relación: Vehiculo -> MantenimientoVehiculo (One-to-Many)
 * Un vehículo puede tener múltiples mantenimientos.
 */
Vehiculo.hasMany(MantenimientoVehiculo, {
  foreignKey: "vehiculo_id",
  as: "mantenimientos",
});

MantenimientoVehiculo.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculo",
});

/**
 * Relación: Taller -> MantenimientoVehiculo (One-to-Many)
 */
Taller.hasMany(MantenimientoVehiculo, {
  foreignKey: "taller_id",
  as: "mantenimientos",
});

MantenimientoVehiculo.belongsTo(Taller, {
  foreignKey: "taller_id",
  as: "taller",
});

/**
 * Relación: UnidadOficina -> MantenimientoVehiculo (One-to-Many)
 */
UnidadOficina.hasMany(MantenimientoVehiculo, {
  foreignKey: "unidad_oficina_id",
  as: "mantenimientos",
});

MantenimientoVehiculo.belongsTo(UnidadOficina, {
  foreignKey: "unidad_oficina_id",
  as: "unidadOficina",
});

//=============================================
// ASOCIACIONES: NOVEDADES
//=============================================

/**
 * Relación: TipoNovedad -> SubtipoNovedad (One-to-Many)
 * Un tipo de novedad puede tener varios subtipos
 */
TipoNovedad.hasMany(SubtipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "tipoNovedadSubtipoNovedad",
});

SubtipoNovedad.belongsTo(TipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "subtipoNovedadTipoNovedad",
});

/**
 * Relación: Novedad -> TipoNovedad (Many-to-One)
 */
Novedad.belongsTo(TipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "novedadTipoNovedad",
});

TipoNovedad.hasMany(Novedad, {
  foreignKey: "tipo_novedad_id",
  as: "tipoNovedadNovedad",
});

/**
 * Relación: Novedad -> SubtipoNovedad (Many-to-One)
 */
Novedad.belongsTo(SubtipoNovedad, {
  foreignKey: "subtipo_novedad_id",
  as: "novedadSubtipoNovedad",
});

SubtipoNovedad.hasMany(Novedad, {
  foreignKey: "subtipo_novedad_id",
  as: "subtipoNovedadNovedad",
});

/**
 * Relación: Novedad -> EstadoNovedad (Many-to-One)
 */
Novedad.belongsTo(EstadoNovedad, {
  foreignKey: "estado_novedad_id",
  as: "novedadEstado",
});

EstadoNovedad.hasMany(Novedad, {
  foreignKey: "estado_novedad_id",
  as: "estadoNovedad",
});

/**
 * Relación: Novedad -> Usuario (reportado por)
 */
Novedad.belongsTo(Usuario, {
  foreignKey: "usuario_registro",
  as: "novedadUsuarioRegistro",
});

Usuario.hasMany(Novedad, {
  foreignKey: "usuario_registro",
  as: "usuarioNovedad",
});

/**
 * Relación: Novedad -> Sector
 */
Novedad.belongsTo(Sector, {
  foreignKey: "sector_id",
  as: "novedadSector",
});

Sector.hasMany(Novedad, {
  foreignKey: "sector_id",
  as: "sectorNovedad",
});

/**
 * Relación: Novedad -> Cuadrante
 */
Novedad.belongsTo(Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "novedadCuadrante",
});

Cuadrante.hasMany(Novedad, {
  foreignKey: "cuadrante_id",
  as: "cuadranteNovedad",
});

/**
 * Relación: Novedad -> UnidadOficina
 */
Novedad.belongsTo(UnidadOficina, {
  foreignKey: "unidad_oficina_id",
  as: "novedadUnidadOficina",
});

UnidadOficina.hasMany(Novedad, {
  foreignKey: "unidad_oficina_id",
  as: "unidadOficinaNovedad",
});

/**
 * Relación: Novedad -> Vehiculo
 */
Novedad.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "novedadVehiculo",
});

Vehiculo.hasMany(Novedad, {
  foreignKey: "vehiculo_id",
  as: "vehiculoNovedad",
});

/**
 * Relación: Novedad -> HistorialEstadoNovedad (One-to-Many)
 */
Novedad.hasMany(HistorialEstadoNovedad, {
  foreignKey: "novedad_id",
  as: "novedadHistorialEstadoNovedad",
});

HistorialEstadoNovedad.belongsTo(Novedad, {
  foreignKey: "novedad_id",
  as: "historialEstadoNovedades",
});

/**
 * Relación: HistorialEstadoNovedad -> EstadoNovedad (estado anterior)
 */
HistorialEstadoNovedad.belongsTo(EstadoNovedad, {
  foreignKey: "estado_anterior_id",
  as: "estadoAnterior",
});

/**
 * Relación: HistorialEstadoNovedad -> EstadoNovedad (estado nuevo)
 */
HistorialEstadoNovedad.belongsTo(EstadoNovedad, {
  foreignKey: "estado_nuevo_id",
  as: "estadoNuevo",
});

/**
 * Relación: HistorialEstadoNovedad -> Usuario (quien cambió)
 */
HistorialEstadoNovedad.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "historialEstadoNovedadUsuario",
});

//=============================================
// ASOCIACIONES: UBICACIÓN
//=============================================

/**
 * Relación: Sector -> Cuadrante (One-to-Many)
 * Un sector puede tener varios cuadrantes
 */
Sector.hasMany(Cuadrante, {
  foreignKey: "sector_id",
  as: "cuadrantes",
});

Cuadrante.belongsTo(Sector, {
  foreignKey: "sector_id",
  as: "sector",
});

/**
 * Relación: Ubigeo -> Sector (One-to-Many)
 */
Ubigeo.hasMany(Sector, {
  foreignKey: "ubigeo",
  sourceKey: "ubigeo_code",
  as: "sectores",
});

Sector.belongsTo(Ubigeo, {
  foreignKey: "ubigeo",
  targetKey: "ubigeo_code",
  as: "ubigeo_rel",
});

/**
 * Relación: Ubigeo -> UnidadOficina (One-to-Many)
 */
Ubigeo.hasMany(UnidadOficina, {
  foreignKey: "ubigeo",
  sourceKey: "ubigeo_code",
  as: "ubigeoUnidadOficina",
});

UnidadOficina.belongsTo(Ubigeo, {
  foreignKey: "ubigeo",
  targetKey: "ubigeo_code",
  as: "unidadOficinaUbigeo",
});

/**
 * Relación: Ubigeo -> Novedad
 */
Ubigeo.hasMany(Novedad, {
  foreignKey: "ubigeo_code",
  sourceKey: "ubigeo_code",
  as: "ubigeoNovedad",
});

Novedad.belongsTo(Ubigeo, {
  foreignKey: "ubigeo_code",
  targetKey: "ubigeo_code",
  as: "novedadUbigeo",
});

//=============================================
// ASOCIACIONES: PERSONAL ✅ ACTUALIZADO
//=============================================

/**
 * Relación: Cargo -> PersonalSeguridad (One-to-Many) ✅ NEW
 * Un cargo puede ser asignado a varios miembros del personal
 * Ejemplo: El cargo "Sereno" puede tener 50 personas
 */
Cargo.hasMany(PersonalSeguridad, {
  foreignKey: "cargo_id",
  as: "cargoPersonalSeguridad",
});

PersonalSeguridad.belongsTo(Cargo, {
  foreignKey: "cargo_id",
  as: "PersonalSeguridadCargo",
});

/**
 * Relación: Ubigeo -> PersonalSeguridad (One-to-Many)
 */
Ubigeo.hasMany(PersonalSeguridad, {
  foreignKey: "ubigeo_code",
  sourceKey: "ubigeo_code",
  as: "ubigeoPersonalSeguridad",
});

PersonalSeguridad.belongsTo(Ubigeo, {
  foreignKey: "ubigeo_code",
  targetKey: "ubigeo_code",
  as: "PersonalSeguridadUbigeo",
});

/**
 * Relación: Vehiculo -> PersonalSeguridad (One-to-One)
 * Un vehículo puede estar asignado a un miembro del personal
 */
Vehiculo.hasOne(PersonalSeguridad, {
  foreignKey: "vehiculo_id",
  as: "vehiculoPersonalSeguridad",
});

PersonalSeguridad.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "PersonalSeguridadVehiculo",
});

//=============================================
// ASOCIACIONES: USUARIOS Y RBAC
//=============================================

/**
 * Relación: PersonalSeguridad -> Usuario (One-to-One)
 * Vincula un miembro del personal con su usuario del sistema
 */
PersonalSeguridad.hasOne(Usuario, {
  foreignKey: "personal_seguridad_id",
  as: "PersonalSeguridadUsuario",
});

Usuario.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_seguridad_id",
  as: "usuarioPersonalSeguridad",
});

/**
 * Relaciones de auditoría de Usuario (self-reference)
 */
Usuario.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "usuarioCreador",
});

Usuario.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "usuarioActualizador",
});

Usuario.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "usuarioEliminador",
});

//=============================================
// ASOCIACIONES MANY-TO-MANY: Usuario <-> Rol
//=============================================

/**
 * Relación Many-to-Many: Usuario <-> Rol
 * Tabla intermedia: usuario_roles (modelo UsuarioRol)
 */
Usuario.belongsToMany(Rol, {
  through: "UsuarioRol",
  foreignKey: "usuario_id",
  otherKey: "rol_id",
  as: "roles",
  timestamps: true,
});

Rol.belongsToMany(Usuario, {
  through: "UsuarioRol",
  foreignKey: "rol_id",
  otherKey: "usuario_id",
  as: "usuarios",
  timestamps: true,
});

/**
 * Relaciones directas con el modelo intermedio UsuarioRol
 */
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

UsuarioRol.belongsTo(Rol, {
  foreignKey: "rol_id",
  as: "rol",
});

/**
 * Auditoría de asignación de roles
 */
Usuario.hasMany(UsuarioRol, {
  foreignKey: "asignado_por",
  as: "rolesAsignadosPorMi",
});

UsuarioRol.belongsTo(Usuario, {
  foreignKey: "asignado_por",
  as: "asignador",
});

Usuario.hasMany(Sesion, {
  foreignKey: "usuario_id",
  as: "sesiones",
});

Sesion.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

Usuario.hasMany(TokenAcceso, {
  foreignKey: "usuario_id",
  as: "tokensAcceso",
});

TokenAcceso.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

Usuario.hasMany(EmailVerification, {
  foreignKey: "usuario_id",
  as: "verificacionesEmail",
});

EmailVerification.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

Usuario.hasMany(PasswordHistorial, {
  foreignKey: "usuario_id",
  as: "passwordHistorial",
});

PasswordHistorial.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

//=============================================
// ASOCIACIONES MANY-TO-MANY: Rol <-> Permiso
//=============================================

/**
 * Relación Many-to-Many: Rol <-> Permiso
 * Tabla intermedia: rol_permisos
 */
Rol.belongsToMany(Permiso, {
  through: "rol_permisos",
  foreignKey: "rol_id",
  otherKey: "permiso_id",
  as: "permisos",
  timestamps: true,
});

Permiso.belongsToMany(Rol, {
  through: "rol_permisos",
  foreignKey: "permiso_id",
  otherKey: "rol_id",
  as: "roles",
  timestamps: true,
});

//=============================================
// ASOCIACIONES MANY-TO-MANY: Usuario <-> Permiso
//=============================================

/**
 * Relación Many-to-Many: Usuario <-> Permiso (directo)
 * Para permisos específicos asignados directamente a usuarios
 * Tabla intermedia: usuario_permisos
 */
Usuario.belongsToMany(Permiso, {
  through: "usuario_permisos",
  foreignKey: "usuario_id",
  otherKey: "permiso_id",
  as: "permisosDirectos",
  timestamps: true,
});

Permiso.belongsToMany(Usuario, {
  through: "usuario_permisos",
  foreignKey: "permiso_id",
  otherKey: "usuario_id",
  as: "usuariosDirectos",
  timestamps: true,
});

//=============================================
// ASOCIACIONES: AUDITORÍA
//=============================================

/**
 * Usuario -> HistorialUsuario
 */
Usuario.hasMany(HistorialUsuario, {
  foreignKey: "usuario_id",
  as: "historial",
});

HistorialUsuario.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

HistorialUsuario.belongsTo(Usuario, {
  foreignKey: "realizado_por",
  as: "realizadoPor",
});

/**
 * Usuario -> LoginIntento
 */
Usuario.hasMany(LoginIntento, {
  foreignKey: "usuario_id",
  as: "intentosLogin",
});

LoginIntento.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

/**
 * Usuario -> AuditoriaAccion
 */
Usuario.hasMany(AuditoriaAccion, {
  foreignKey: "usuario_id",
  as: "auditorias",
});

AuditoriaAccion.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

//=============================================
// ASOCIACIONES DE AUDITORÍA GLOBAL
// (created_by, updated_by, deleted_by)
//=============================================

/**
 * NOTA: Todas las tablas principales tienen campos de auditoría
 * que rastrean qué usuario creó, actualizó o eliminó el registro
 */

// Cargo ✅ NEW
Cargo.belongsTo(Usuario, { foreignKey: "created_by", as: "creadorCargo" });
Cargo.belongsTo(Usuario, { foreignKey: "updated_by", as: "actualizadorCargo" });
Cargo.belongsTo(Usuario, { foreignKey: "deleted_by", as: "eliminadorCargo" });

// Novedad
Novedad.belongsTo(Usuario, { foreignKey: "created_by", as: "creadorNovedad" });
Novedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorNovedad",
});
Novedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorNovedad",
});

// Vehiculo
Vehiculo.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorVehiculo",
});
Vehiculo.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorVehiculo",
});
Vehiculo.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorVehiculo",
});

// PersonalSeguridad
PersonalSeguridad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorPersonalSeguridad",
});
PersonalSeguridad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorPersonalSeguridad",
});
PersonalSeguridad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorPersonalSeguridad",
});

// Cuadrante
Cuadrante.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorCuadrante",
});
Cuadrante.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorCuadrante",
});
Cuadrante.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorCuadrante",
});

// EstadoNovedad
EstadoNovedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorEstadoNovedad",
});
EstadoNovedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorEstadoNovedad",
});
EstadoNovedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorEstadoNovedad",
});

// UsuarioRol
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorUsuarioRol",
});
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorUsuarioRol",
});
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorUsuarioRol",
});

// Rol
Rol.belongsTo(Usuario, { foreignKey: "created_by", as: "creadorRol" });
Rol.belongsTo(Usuario, { foreignKey: "updated_by", as: "actualizadorRol" });
Rol.belongsTo(Usuario, { foreignKey: "deleted_by", as: "eliminadorRol" });

// Sector
Sector.belongsTo(Usuario, { foreignKey: "created_by", as: "creadorSector" });
Sector.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorSector",
});
Sector.belongsTo(Usuario, { foreignKey: "deleted_by", as: "eliminadorSector" });

// SubtipoNovedad
SubtipoNovedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorSubtipoNovedad",
});
SubtipoNovedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorSubtipoNovedad",
});
SubtipoNovedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorSubtipoNovedad",
});

// TipoNovedad
TipoNovedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorTipoNovedad",
});
TipoNovedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorTipoNovedad",
});
TipoNovedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorTipoNovedad",
});

// TipoVehiculo
TipoVehiculo.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorTipoVehiculo",
});
TipoVehiculo.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorTipoVehiculo",
});
TipoVehiculo.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorTipoVehiculo",
});

// UnidadOficina
UnidadOficina.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorUnidadOficina",
});
UnidadOficina.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorUnidadOficina",
});
UnidadOficina.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorUnidadOficina",
});

// Taller
Taller.belongsTo(Usuario, { foreignKey: "created_by", as: "creadorTaller" });
Taller.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorTaller",
});
Taller.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorTaller",
});

// MantenimientoVehiculo
MantenimientoVehiculo.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorMantenimientoVehiculo",
});
MantenimientoVehiculo.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorMantenimientoVehiculo",
});
MantenimientoVehiculo.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorMantenimientoVehiculo",
});

console.log("✅ Asociaciones configuradas exitosamente");

//=============================================
// EXPORTAR MODELOS
//=============================================

/**
 * Objeto que contiene todos los modelos del sistema
 * @type {Object}
 */
const models = {
  // Instancia de Sequelize
  sequelize,

  // Catálogos
  TipoVehiculo,
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
  Cargo, // ✅ NEW
  Ubigeo,

  // Operativos
  Vehiculo,
  AbastecimientoCombustible,
  Taller,
  MantenimientoVehiculo,
  Sector,
  Cuadrante,
  UnidadOficina,
  PersonalSeguridad,

  // Novedades
  Novedad,
  HistorialEstadoNovedad,

  // RBAC
  Usuario,
  Rol,
  Permiso,
  UsuarioRol,

  EmailVerification,
  PasswordReset,
  PasswordHistorial,
  Sesion,
  TokenAcceso,
  UsuarioPermiso,
  RolPermiso,

  // Auditoría
  HistorialUsuario,
  LoginIntento,
  AuditoriaAccion,
};

/**
 * Configurar asociaciones adicionales si los modelos tienen método associate
 */
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

//=============================================
// EXPORTACIONES
//=============================================

/**
 * Exportación por defecto del objeto models
 */
export default models;

/**
 * Exportaciones individuales para importación selectiva
 * @example
 * import { Usuario, Rol } from "./models/index.js";
 */
export {
  sequelize,
  // Catálogos
  TipoVehiculo,
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
  Cargo, // ✅ NEW
  Ubigeo,
  // Operativos
  Vehiculo,
  AbastecimientoCombustible,
  Taller,
  MantenimientoVehiculo,
  Sector,
  Cuadrante,
  UnidadOficina,
  PersonalSeguridad,
  // Novedades
  Novedad,
  HistorialEstadoNovedad,
  // RBAC
  Usuario,
  Rol,
  Permiso,
  UsuarioRol,

  EmailVerification,
  PasswordReset,
  PasswordHistorial,
  Sesion,
  TokenAcceso,
  UsuarioPermiso,
  RolPermiso,
  // Auditoría
  HistorialUsuario,
  LoginIntento,
  AuditoriaAccion,
};
