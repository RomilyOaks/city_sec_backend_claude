/**
 * Ruta: src/models/index.js
 * Descripción: Archivo central de modelos que importa todos los modelos
 * y define las asociaciones entre ellos para Sequelize ORM
 * Gestiona las relaciones many-to-many, one-to-many y referencias entre tablas
 *
 * IMPORTANTE: Este archivo debe ser importado después de que todos los modelos
 * individuales estén definidos para que las asociaciones funcionen correctamente
 */

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

// Modelos de auditoría
import HistorialUsuario from "./HistorialUsuario.js";
import IntentoLogin from "./IntentoLogin.js";

/**
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
  as: "tipo",
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
  as: "tipo",
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

// Relación: Usuario -> Usuario (self-reference para auditoría)
// created_by
Usuario.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creador",
});

// updated_by
Usuario.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizador",
});

// deleted_by
Usuario.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminador",
});

// ============================================
// ASOCIACIONES MANY-TO-MANY: Usuario <-> Rol
// ============================================

// Tabla intermedia: usuario_roles
Usuario.belongsToMany(Rol, {
  through: "usuario_roles",
  foreignKey: "usuario_id",
  otherKey: "rol_id",
  as: "roles",
  timestamps: true,
});

Rol.belongsToMany(Usuario, {
  through: "usuario_roles",
  foreignKey: "rol_id",
  otherKey: "usuario_id",
  as: "usuarios",
  timestamps: true,
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

// Usuario -> IntentoLogin
Usuario.hasMany(IntentoLogin, {
  foreignKey: "usuario_id",
  as: "intentosLogin",
});

IntentoLogin.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
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

  // Modelos de auditoría
  HistorialUsuario,
  IntentoLogin,
};

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
  Novedad,
  HistorialEstadoNovedad,
  HistorialUsuario,
  IntentoLogin,
};
