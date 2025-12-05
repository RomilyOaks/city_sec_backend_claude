/**
 * Ruta: src/models/index.js
 * Descripción: Archivo central de modelos que importa todos los modelos
 * y define las asociaciones entre ellos para Sequelize ORM
 * Gestiona las relaciones many-to-many, one-to-many y referencias entre tablas
 */

import sequelize from "../config/database.js";

// Importar todos los modelos existentes
import TipoVehiculo from "./TipoVehiculo.js";
import Vehiculo from "./Vehiculo.js";
import TipoNovedad from "./TipoNovedad.js";
import SubtipoNovedad from "./SubtipoNovedad.js";
import EstadoNovedad from "./EstadoNovedad.js";
import Ubigeo from "./Ubigeo.js";
import Sector from "./Sector.js";
import Cuadrante from "./Cuadrante.js";
import UnidadOficina from "./UnidadOficina.js";
import Cargo from "./Cargo.js";
import PersonalSeguridad from "./PersonalSeguridad.js";

// Importar nuevos modelos de autenticación y permisos
import Usuario from "./Usuario.js";
import Rol from "./Rol.js";
import Permiso from "./Permiso.js";

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

  // Modelos de autenticación y autorización
  Usuario,
  Rol,
  Permiso,
};

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
};
