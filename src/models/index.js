//=============================================
// Ruta: src/models/index.js
//=============================================
// Descripción: Archivo central de modelos que importa todos los modelos
// y define las asociaciones entre ellos para Sequelize ORM

// Importar la instancia de Sequelize configurada
import sequelize from "../config/database.js";

// ============================================
// IMPORTAR TODOS LOS MODELOS
// ============================================

// Modelos de catálogos base
import Cargo from "./Cargo.js";
import TipoVehiculo from "./TipoVehiculo.js";
import Ubigeo from "./Ubigeo.js";

// Modelos de ubicación y territorio
import Sector from "./Sector.js";
import Cuadrante from "./Cuadrante.js";

// Modelos de recursos operativos
import Vehiculo from "./Vehiculo.js";
import PersonalSeguridad from "./PersonalSeguridad.js";
import UnidadOficina from "./UnidadOficina.js";

// Modelos de novedades/incidentes
import TipoNovedad from "./TipoNovedad.js";
import SubtipoNovedad from "./SubtipoNovedad.js";
import EstadoNovedad from "./EstadoNovedad.js";
import Novedad from "./Novedad.js";
import HistorialEstadoNovedad from "./HistorialEstadoNovedad.js";

// Modelos de autenticación y autorización
import Usuario from "./Usuario.js";
import Rol from "./Rol.js";
import Permiso from "./Permiso.js";
import UsuarioRol from "./UsuarioRoles.js"; // Tabla intermedia Usuario-Rol

// Modelos de auditoría
import HistorialUsuario from "./HistorialUsuario.js";
import LoginIntento from "./LoginIntento.js";
import AuditoriaAccion from "./AuditoriaAccion.js";

/*
 * DEFINICIÓN DE ASOCIACIONES
 * Aquí se definen todas las relaciones entre modelos
 */

// ============================================
// ASOCIACIONES DE VEHÍCULOS
// ============================================

// Relación: TipoVehiculo -> Vehiculo (One-to-Many)
TipoVehiculo.hasMany(Vehiculo, {
  foreignKey: "tipo_id",
  as: "vehiculos",
});

Vehiculo.belongsTo(TipoVehiculo, {
  foreignKey: "tipo_id",
  as: "tipoVehiculo",
});

// ============================================
// ASOCIACIONES DE NOVEDADES
// ============================================

// Relación: TipoNovedad -> SubtipoNovedad (One-to-Many)
TipoNovedad.hasMany(SubtipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "subtipos",
});

SubtipoNovedad.belongsTo(TipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "subTipoNovedad",
});

// Relación: Novedad -> TipoNovedad
Novedad.belongsTo(TipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "tipoNovedad",
});

TipoNovedad.hasMany(Novedad, {
  foreignKey: "tipo_novedad_id",
  as: "novedades",
});

// Relación: Novedad -> SubtipoNovedad
Novedad.belongsTo(SubtipoNovedad, {
  foreignKey: "subtipo_novedad_id",
  as: "subtipoNovedad",
});

SubtipoNovedad.hasMany(Novedad, {
  foreignKey: "subtipo_novedad_id",
  as: "novedades",
});

// Relación: Novedad -> EstadoNovedad
Novedad.belongsTo(EstadoNovedad, {
  foreignKey: "estado_id",
  as: "estado",
});

EstadoNovedad.hasMany(Novedad, {
  foreignKey: "estado_id",
  as: "novedades",
});

// Relación: Novedad -> Usuario (reportado por)
Novedad.belongsTo(Usuario, {
  foreignKey: "reportado_por",
  as: "reportadoPor",
});

Usuario.hasMany(Novedad, {
  foreignKey: "reportado_por",
  as: "novedadesReportadas",
});

// Relación: Novedad -> Sector
Novedad.belongsTo(Sector, {
  foreignKey: "sector_id",
  as: "sector",
});

Sector.hasMany(Novedad, {
  foreignKey: "sector_id",
  as: "novedades",
});

// Relación: Novedad -> Cuadrante
Novedad.belongsTo(Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "cuadrante",
});

Cuadrante.hasMany(Novedad, {
  foreignKey: "cuadrante_id",
  as: "novedades",
});

// Relación: Novedad -> UnidadOficina
Novedad.belongsTo(UnidadOficina, {
  foreignKey: "unidad_asignada_id",
  as: "unidadAsignada",
});

UnidadOficina.hasMany(Novedad, {
  foreignKey: "unidad_asignada_id",
  as: "novedadesAsignadas",
});

// Relación: Novedad -> Vehiculo
Novedad.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_asignado_id",
  as: "vehiculoAsignado",
});

Vehiculo.hasMany(Novedad, {
  foreignKey: "vehiculo_asignado_id",
  as: "novedadesAsignadas",
});

// Relación: Novedad -> HistorialEstadoNovedad
Novedad.hasMany(HistorialEstadoNovedad, {
  foreignKey: "novedad_id",
  as: "historialEstados",
});

HistorialEstadoNovedad.belongsTo(Novedad, {
  foreignKey: "novedad_id",
  as: "novedad",
});

// Relación: HistorialEstadoNovedad -> EstadoNovedad (estado anterior)
HistorialEstadoNovedad.belongsTo(EstadoNovedad, {
  foreignKey: "estado_anterior_id",
  as: "estadoAnterior",
});

// Relación: HistorialEstadoNovedad -> EstadoNovedad (estado nuevo)
HistorialEstadoNovedad.belongsTo(EstadoNovedad, {
  foreignKey: "estado_nuevo_id",
  as: "estadoNuevo",
});

// Relación: HistorialEstadoNovedad -> Usuario (quien cambió)
HistorialEstadoNovedad.belongsTo(Usuario, {
  foreignKey: "cambiado_por",
  as: "cambiadoPor",
});

// ============================================
// ASOCIACIONES DE UBICACIÓN
// ============================================

// Relación: Sector -> Cuadrante (One-to-Many)
Sector.hasMany(Cuadrante, {
  foreignKey: "sector_id",
  as: "cuadrantes",
});

Cuadrante.belongsTo(Sector, {
  foreignKey: "sector_id",
  as: "sector",
});

// Relación: Ubigeo -> Sector (One-to-Many)
Ubigeo.hasMany(Sector, {
  foreignKey: "ubigeo",
  sourceKey: "ubigeo_code",
  as: "sectores",
});

Sector.belongsTo(Ubigeo, {
  foreignKey: "ubigeo",
  targetKey: "ubigeo_code",
  as: "ubicacion",
});

// Relación: Ubigeo -> UnidadOficina (One-to-Many)
Ubigeo.hasMany(UnidadOficina, {
  foreignKey: "ubigeo",
  sourceKey: "ubigeo_code",
  as: "unidades",
});

UnidadOficina.belongsTo(Ubigeo, {
  foreignKey: "ubigeo",
  targetKey: "ubigeo_code",
  as: "ubicacion",
});

// Relación: Ubigeo -> Novedad
Ubigeo.hasMany(Novedad, {
  foreignKey: "ubigeo_code",
  sourceKey: "ubigeo_code",
  as: "novedades",
});

Novedad.belongsTo(Ubigeo, {
  foreignKey: "ubigeo_code",
  targetKey: "ubigeo_code",
  as: "ubicacion",
});

// ============================================
// ASOCIACIONES DE PERSONAL
// ============================================

// Relación: Cargo -> PersonalSeguridad (One-to-Many)
Cargo.hasMany(PersonalSeguridad, {
  foreignKey: "cargo_id",
  as: "personal",
});

PersonalSeguridad.belongsTo(Cargo, {
  foreignKey: "cargo_id",
  as: "cargo",
});

// Relación: Ubigeo -> PersonalSeguridad (One-to-Many)
Ubigeo.hasMany(PersonalSeguridad, {
  foreignKey: "ubigeo_code",
  sourceKey: "ubigeo_code",
  as: "personal",
});

PersonalSeguridad.belongsTo(Ubigeo, {
  foreignKey: "ubigeo_code",
  targetKey: "ubigeo_code",
  as: "ubicacion",
});

// Relación: Vehiculo -> PersonalSeguridad (One-to-Many)
// Un vehículo puede estar asignado a varios personal en diferentes momentos
Vehiculo.hasMany(PersonalSeguridad, {
  foreignKey: "vehiculo_id",
  as: "personalAsignado",
});

PersonalSeguridad.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculoAsignado",
});

// ============================================
// ASOCIACIONES DE USUARIOS Y RBAC
// ============================================

// Relación: PersonalSeguridad -> Usuario (One-to-One)
PersonalSeguridad.hasOne(Usuario, {
  foreignKey: "personal_seguridad_id",
  as: "usuario",
});

Usuario.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_seguridad_id",
  as: "personalSeguridad",
});

// Relación: Usuario -> Usuario (self-reference para auditoría de la tabla Usuario)
// created_by
Usuario.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "usuarioCreador",
});

// updated_by
Usuario.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "usuarioActualizador",
});

// deleted_by
Usuario.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "usuarioEliminador",
});

// ============================================
// ASOCIACIONES MANY-TO-MANY: Usuario <-> Rol
// ============================================

// 1. Relación Many-to-Many entre Usuario y Rol
// Se usa el modelo explícito UsuarioRol para manejar campos adicionales como fecha_expiracion
// Tabla intermedia: usuario_roles
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

// 2. Relaciones One-to-Many para el modelo intermedio (facilitan la inclusión)
// UsuarioRol tiene un Usuario asociado (el usuario al que pertenece el rol)
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

// UsuarioRol tiene un Rol asociado
UsuarioRol.belongsTo(Rol, {
  foreignKey: "rol_id",
  as: "rol",
});

// 3. Relación de Auditoría para el campo 'asignado_por'
// Un Usuario asigna (asignado_por) muchos registros UsuarioRol
Usuario.hasMany(UsuarioRol, {
  foreignKey: "asignado_por",
  as: "rolesAsignadosPorMi",
});

UsuarioRol.belongsTo(Usuario, {
  foreignKey: "asignado_por",
  as: "asignador",
});

// ============================================
// ASOCIACIONES MANY-TO-MANY: Rol <-> Permiso
// ============================================

// Tabla intermedia: rol_permisos
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

// ============================================
// ASOCIACIONES MANY-TO-MANY: Usuario <-> Permiso (directo)
// ============================================

// Tabla intermedia: usuario_permisos
// Para permisos directos asignados a usuarios específicos
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

// ============================================
// ASOCIACIONES DE AUDITORÍA
// ============================================

// Usuario -> HistorialUsuario
Usuario.hasMany(HistorialUsuario, {
  foreignKey: "usuario_id",
  as: "historial",
});

HistorialUsuario.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

// Usuario que realizó el cambio
HistorialUsuario.belongsTo(Usuario, {
  foreignKey: "realizado_por",
  as: "realizadoPor",
});

// Usuario -> LoginIntento
Usuario.hasMany(LoginIntento, {
  foreignKey: "usuario_id",
  as: "intentosLogin",
});

LoginIntento.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

// ============================================
// ASOCIACIONES DE AUDITORÍA (AuditoriaAccion)
// ============================================

// Usuario -> AuditoriaAccion (1:N)
Usuario.hasMany(AuditoriaAccion, {
  foreignKey: "usuario_id",
  as: "auditorias",
});

// AuditoriaAccion -> Usuario (N:1)
AuditoriaAccion.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// ============================================
// ASOCIACIONES DE AUDITORÍA GLOBAL (created_by, updated_by, deleted_by)
// ============================================

//--------------------------------------------------------------------------
// Relación: Novedad -> Usuario
//--------------------------------------------------------------------------
Novedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorNovedad",
});

// Relación: Novedad -> Usuario (actualizador)
Novedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorNovedad",
});

// Relación: Novedad -> Usuario (eliminador - si usas soft-delete)
Novedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorNovedad",
});

//--------------------------------------------------------------------------
// Relación: Vehiculo -> Usuario
//--------------------------------------------------------------------------
Vehiculo.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorVehiculo",
});
// Relación: Vehiculo -> Usuario (actualizador)
Vehiculo.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorVehiculo",
});

// Relación: Vehiculo -> Usuario (eliminador - si usas soft-delete)
Vehiculo.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorVehiculo",
});

//--------------------------------------------------------------------------
// Relación: PersonalSeguridad -> Usuario
//--------------------------------------------------------------------------
PersonalSeguridad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorPersonalSeguridad",
});

// Relación: PersonalSeguridad -> Usuario (actualizador)
PersonalSeguridad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorPersonalSeguridad",
});

// Relación: PersonalSeguridad -> Usuario (eliminador - si usas soft-delete)
PersonalSeguridad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorPersonalSeguridad",
});

//--------------------------------------------------------------------------
// Relación: Cargo -> Usuario
//--------------------------------------------------------------------------
Cargo.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorCargo",
});

// Relación: Cargo -> Usuario (actualizador)
Cargo.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorCargo",
});

// Relación: Cargo -> Usuario (eliminador - si usas soft-delete)
Cargo.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorCargo",
});

//--------------------------------------------------------------------------
// Relación: Cuadrante -> Usuario
//--------------------------------------------------------------------------
Cuadrante.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorCuadrante",
});

// Relación: Cuadrante -> Usuario (actualizador)
Cuadrante.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorCuadrante",
});

// Relación: Cuadrante -> Usuario (eliminador - si usas soft-delete)
Cuadrante.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorCuadrante",
});

//--------------------------------------------------------------------------
// Relación: EstadoNovedad -> Usuario
//--------------------------------------------------------------------------
EstadoNovedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorEstadoNovedad",
});

// Relación: EstadoNovedad -> Usuario (actualizador)
EstadoNovedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorEstadoNovedad",
});

// Relación: EstadoNovedad -> Usuario (eliminador - si usas soft-delete)
EstadoNovedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorEstadoNovedad",
});

//--------------------------------------------------------------------------
// Relación: UsuarioRol -> Usuario
//--------------------------------------------------------------------------
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorUsuarioRol",
});

// Relación: UsuarioRol -> Usuario (actualizador)
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorUsuarioRol",
});

// Relación: UsuarioRol -> Usuario (eliminador - si usas soft-delete)
UsuarioRol.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorUsuarioRol",
});

//--------------------------------------------------------------------------
// Relación: Rol -> Usuario
//--------------------------------------------------------------------------
Rol.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorRol",
});

// Relación: Rol -> Usuario (actualizador)
Rol.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorRol",
});

// Relación: Rol -> Usuario (eliminador - si usas soft-delete)
Rol.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorRol",
});

//--------------------------------------------------------------------------
// Relación: Sector -> Usuario
//--------------------------------------------------------------------------
Sector.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorSector",
});

// Relación: Sector -> Usuario (actualizador)
Sector.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorSector",
});

// Relación: Sector -> Usuario (eliminador - si usas soft-delete)
Sector.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorSector",
});

//--------------------------------------------------------------------------
// Relación: SubtipoNovedad -> Usuario
//--------------------------------------------------------------------------
SubtipoNovedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorSubtipoNovedad",
});

// Relación: SubtipoNovedad -> Usuario (actualizador)
SubtipoNovedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorSubtipoNovedad",
});

// Relación: SubtipoNovedad -> Usuario (eliminador - si usas soft-delete)
SubtipoNovedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorSubtipoNovedad",
});

//--------------------------------------------------------------------------
// Relación: TipoNovedad -> Usuario
//--------------------------------------------------------------------------
TipoNovedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorTipoNovedad",
});

// Relación: TipoNovedad -> Usuario (actualizador)
TipoNovedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorTipoNovedad",
});

// Relación: TipoNovedad -> Usuario (eliminador - si usas soft-delete)
TipoNovedad.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorTipoNovedad",
});

//--------------------------------------------------------------------------
// Relación: TipoVehiculo -> Usuario
//--------------------------------------------------------------------------
TipoVehiculo.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorTipoVehiculo",
});

// Relación: TipoVehiculo -> Usuario (actualizador)
TipoVehiculo.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorTipoVehiculo",
});

// Relación: TipoVehiculo -> Usuario (eliminador - si usas soft-delete)
TipoVehiculo.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorTipoVehiculo",
});

//--------------------------------------------------------------------------
// Relación: UnidadOficina -> Usuario
//--------------------------------------------------------------------------
UnidadOficina.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorUnidadOficina",
});

// Relación: UnidadOficina -> Usuario (actualizador)
UnidadOficina.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorUnidadOficina",
});

// Relación: UnidadOficina -> Usuario (eliminador - si usas soft-delete)
UnidadOficina.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorUnidadOficina",
});

/**
 * EXPORTAR TODOS LOS MODELOS Y LA INSTANCIA DE SEQUELIZE
 */
const models = {
  // Instancia de Sequelize para poder hacer transacciones
  sequelize,
  // Modelos de catálogos
  TipoVehiculo,
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
  Cargo,
  Ubigeo,
  // Modelos operativos
  Vehiculo,
  Sector,
  Cuadrante,
  UnidadOficina,
  PersonalSeguridad,
  // Modelos de novedades
  Novedad,
  HistorialEstadoNovedad,
  // Modelos de autenticación y autorización
  Usuario,
  Rol,
  Permiso,
  UsuarioRol,
  // Modelos de auditoría
  HistorialUsuario,
  LoginIntento,
  AuditoriaAccion,
};

// Configurar asociaciones
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Exportación por defecto del objeto models
export default models;

// También exportar individualmente por si se necesita
export {
  sequelize,
  TipoVehiculo,
  Vehiculo,
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
  Ubigeo,
  Sector,
  Cuadrante,
  UnidadOficina,
  Cargo,
  PersonalSeguridad,
  Usuario,
  Rol,
  Permiso,
  UsuarioRol,
  Novedad,
  HistorialEstadoNovedad,
  HistorialUsuario,
  LoginIntento,
  AuditoriaAccion,
};
