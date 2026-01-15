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
 * v2.1.2 (2026-01-11):
 *  - ✅ Agregado modelo RadioTetra para gestionar radios Tetra asignados a personal
 *  - ✅ Agregado modelo VehiculoCuadrantesAsignados para gestionar
 *    la asignación de vehículos a cuadrantes en operativos específicos.
 *  - ✅ Agregado Operativos de Patrullaje por Turnos
 *  - ✅ Agregado Vehiculos que realizan los Operativos por turnos
 *
 * v2.1.1 (2025-12-23):
 * 1. RELACIONES CLAVE DEL MÓDULO CALLES:
 *    - TipoVia (1) -> (N) Calle
 *    - Calle (M) <-> (N) Cuadrante (a través de CallesCuadrantes)
 *    - Calle (1) -> (N) Direccion
 *    - Cuadrante (1) -> (N) Direccion
 *    - Sector (1) -> (N) Direccion
 *    - Direccion (1) -> (N) Novedad
 *
 * 2. AUTO-ASIGNACIÓN:
 *    - CallesCuadrantes se usa para auto-asignar cuadrante_id en Direccion
 *    - El cuadrante_id define automáticamente el sector_id
 *
 * 3. INTEGRIDAD REFERENCIAL:
 *    - Todas las FK tienen onDelete: 'RESTRICT' por defecto
 *    - Soft deletes habilitados en Calle, CallesCuadrantes, Direccion
 *
 * 4. CONSULTAS COMUNES:
 *    - Incluir 'tipoVia' al consultar Calle
 *    - Incluir 'cuadrante' y 'sector' al consultar Direccion
 *    - Usar 'relacionesCuadrantes' para detalles de rangos
 * -----------------------------------------------------------------------
 * v2.1.0 (2025-12-12):
 *   - ✅ Agregado modelo Cargo con relaciones completas
 *   - ✅ Mejorada documentación de todas las asociaciones
 *   - ✅ Agregado sistema de versionado
 *   - ✅ Documentación JSDoc completa
 * -----------------------------------------------------------------------
 * v2.0.0 (2025-12-10):
 *   -npm run dev ✅ Agregado modelo PersonalSeguridad
 *   - ✅ Refactorización de asociaciones de auditoría
 *
 * v1.0.0 (2025-11-01):
 *   - 🎉 Versión inicial con modelos base
 *
 * MODELOS INCLUIDOS:
 * ==================
 * 📚 Catálogos Base:
 *    - Cargo
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

/**
 * Modelo RadioTetra
 * Catálogo de Radios Tetra utilizados en la flota
 * @type {Model}
 */

import RadioTetra from "./RadioTetra.js";

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
 * Modelo VehiculoCuadrantesAsignados
 * Registro de vehículos asignados a cuadrantes en operativos
 * Autor: RRG
 * @type {Model}
 */
import VehiculoCuadrantesAsignados from "./VehiculoCuadrantesAsignados.js";

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

/**
 * Modelo OperativosVehiculosCuadrantes
 * Registro de vehículos asignados a cuadrantes en operativos
 * @type {Model}
 */
import OperativosVehiculosCuadrantes from "./OperativosVehiculosCuadrantes.js";

/**
 * Modelo OperativosVehiculosNovedades
 * Registro de novedades asociadas a vehículos en operativos
 * @type {Model}
 */
import OperativosVehiculosNovedades from "./OperativosVehiculosNovedades.js";

/**
 * Modelo OperativosTurno
 * Gestión de turnos para el personal de seguridad
 * @type {Model}
 */
import OperativosTurno from "./OperativosTurno.js";
import OperativosVehiculos from "./operativos-vehiculos.js";

/**
 * Modelo EstadoOperativoRecurso
 * Catálogo de estados operativos para recursos (vehículos, personal)
 * @type {Model}
 */
import EstadoOperativoRecurso from "./EstadoOperativoRecurso.js";

/**
 * Modelo TipoCopiloto
 * Catálogo de tipos de copiloto para operativos
 * @type {Model}
 */
import TipoCopiloto from "./TipoCopiloto.js";

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

// ============================================================================
// IMPORTAR MODELOS DEL MÓDULO CALLES Y DIRECCIONES (v2.2.1)
// ============================================================================

import TipoVia from "./TipoVia.js";
import Calle from "./Calle.js";
import CallesCuadrantes from "./CallesCuadrantes.js";
import Direccion from "./Direccion.js";

//=============================================================================
// DEFINICIÓN DE ASOCIACIONES (RELACIONES ENTRE MODELOS)
//=============================================================================

console.log("📌 Configurando asociaciones de modelos...");

//=============================================
// ASOCIACIONES: OPERATIVOS
//=============================================

/**
 * Relación: PersonalSeguridad -> OperativosTurno (One-to-Many)
 * Un personal de seguridad puede tener muchos turnos como operador.
 */
// PersonalSeguridad.hasMany(OperativosTurno, {
//   foreignKey: "operador_id",
//   as: "turnosComoOperador",
// });

OperativosTurno.belongsTo(PersonalSeguridad, {
  foreignKey: "operador_id",
  as: "operador",
});

/**
 * Relación: PersonalSeguridad -> OperativosTurno (One-to-Many)
 * Un personal de seguridad puede supervisar muchos turnos.
 */
// PersonalSeguridad.hasMany(OperativosTurno, {
//   foreignKey: "supervisor_id",
//   as: "turnosComoSupervisor",
// });

OperativosTurno.belongsTo(PersonalSeguridad, {
  foreignKey: "supervisor_id",
  as: "supervisor",
});

/**
 * Relación: Sector -> OperativosTurno (One-to-Many)
 * Un sector puede tener muchos turnos operativos.
 */
// Sector.hasMany(OperativosTurno, {
//   foreignKey: "sector_id",
//   as: "turnosSector",
// });

OperativosTurno.belongsTo(Sector, {
  foreignKey: "sector_id",
  as: "sector",
});

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
// ASOCIACIONES: OPERATIVOS DE VEHÍCULOS
//=============================================

/**
 * Relación: Cuadrante -> OperativosVehiculosCuadrantes (One-to-Many)
 */
Cuadrante.hasMany(OperativosVehiculosCuadrantes, {
  foreignKey: "cuadrante_id",
  as: "operativosVehiculos",
});

OperativosVehiculosCuadrantes.belongsTo(Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "cuadrante",
});

/**
 * Relación: OperativosVehiculos -> OperativosVehiculosCuadrantes (One-to-Many)
 * NOTA: operativos_vehiculos_cuadrantes tiene operativo_vehiculo_id, NO vehiculo_id
 */
OperativosVehiculos.hasMany(OperativosVehiculosCuadrantes, {
  foreignKey: "operativo_vehiculo_id",
  as: "cuadrantes",
});

/**
 * Relación: OperativosVehiculosCuadrantes -> OperativosVehiculosNovedades (One-to-Many)
 * NOTA: La relación belongsTo se define en el método associate() del modelo OperativosVehiculosNovedades
 */
OperativosVehiculosCuadrantes.hasMany(OperativosVehiculosNovedades, {
  foreignKey: "operativo_vehiculo_cuadrante_id",
  as: "novedades",
});

/**
 * Relación: Novedad -> OperativosVehiculosNovedades (One-to-Many)
 * NOTA: La relación belongsTo se define en el método associate() del modelo OperativosVehiculosNovedades
 */
Novedad.hasMany(OperativosVehiculosNovedades, {
  foreignKey: "novedad_id",
  as: "operativosVehiculosNovedades",
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
 * Relación: Novedad -> PersonalSeguridad (Personal a Cargo)
 */
Novedad.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_cargo_id",
  as: "novedadPersonalCargo",
});

/**
 * Relación: Novedad -> PersonalSeguridad (Personal #2)
 */
Novedad.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_seguridad2_id",
  as: "novedadPersonal2",
});

/**
 * Relación: Novedad -> PersonalSeguridad (Personal #3)
 */
Novedad.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_seguridad3_id",
  as: "novedadPersonal3",
});

/**
 * Relación: Novedad -> PersonalSeguridad (Personal #4)
 */
Novedad.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_seguridad4_id",
  as: "novedadPersonal4",
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
 * Relación: Sector -> PersonalSeguridad (Many-to-One)
 * Un sector pertenece a un supervisor
 */
Sector.belongsTo(PersonalSeguridad, {
  foreignKey: "supervisor_id",
  as: "supervisor",
});

PersonalSeguridad.hasMany(Sector, {
  foreignKey: "supervisor_id",
  as: "sectoresSupervisa",
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
// ASOCIACIONES: PERSONAL
//=============================================

/**
 * Relación: Cargo -> PersonalSeguridad (One-to-Many)
 * Un cargo puede tener muchos personales de seguridad.
 */
// Cargo.hasMany(PersonalSeguridad, {
//   foreignKey: "cargo_id",
//   as: "personal",
// });

PersonalSeguridad.belongsTo(Cargo, {
  foreignKey: "cargo_id",
  as: "PersonalSeguridadCargo",
});

/**
 * Relación: Ubigeo -> PersonalSeguridad (One-to-Many)
 * Un ubigeo puede tener muchos personales de seguridad.
 */
// Ubigeo.hasMany(PersonalSeguridad, {
//   foreignKey: "ubigeo_code",
//   as: "personal",
// });

PersonalSeguridad.belongsTo(Ubigeo, {
  foreignKey: "ubigeo_code",
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

// Cargo
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

// OperativosVehiculosCuadrantes
OperativosVehiculosCuadrantes.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorOperativosVehiculosCuadrantes",
});
OperativosVehiculosCuadrantes.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorOperativosVehiculosCuadrantes",
});
OperativosVehiculosCuadrantes.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorOperativosVehiculosCuadrantes",
});

// OperativosVehiculosNovedades
OperativosVehiculosNovedades.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorOperativosVehiculosNovedades",
});
OperativosVehiculosNovedades.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorOperativosVehiculosNovedades",
});
OperativosVehiculosNovedades.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorOperativosVehiculosNovedades",
});

// ============================================================================
// DEFINIR RELACIONES DEL MÓDULO CALLES Y DIRECCIONES (✅ 2.2.1)
// ============================================================================

// --- RELACIONES DE CALLES ---

// TipoVia -> Calle (1:N)
TipoVia.hasMany(Calle, {
  foreignKey: "tipo_via_id",
  as: "calles",
});

Calle.belongsTo(TipoVia, {
  foreignKey: "tipo_via_id",
  as: "tipoVia",
});

// Ubigeo -> Calle (1:N)
Ubigeo.hasMany(Calle, {
  foreignKey: "ubigeo_code",
  as: "calles",
});

Calle.belongsTo(Ubigeo, {
  foreignKey: "ubigeo_code",
  as: "ubigeo",
});

// --- RELACIONES DE CALLES-CUADRANTES (M:N) ---

// Calle <-> Cuadrante (M:N a través de CallesCuadrantes)
Calle.belongsToMany(Cuadrante, {
  through: CallesCuadrantes,
  foreignKey: "calle_id",
  otherKey: "cuadrante_id",
  as: "cuadrantes",
});

Cuadrante.belongsToMany(Calle, {
  through: CallesCuadrantes,
  foreignKey: "cuadrante_id",
  otherKey: "calle_id",
  as: "calles",
});

// Relaciones directas con CallesCuadrantes para acceso detallado
Calle.hasMany(CallesCuadrantes, {
  foreignKey: "calle_id",
  as: "relacionesCuadrantes",
});

CallesCuadrantes.belongsTo(Calle, {
  foreignKey: "calle_id",
  as: "calle",
});

Cuadrante.hasMany(CallesCuadrantes, {
  foreignKey: "cuadrante_id",
  as: "relacionesCalles",
});

CallesCuadrantes.belongsTo(Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "cuadrante",
});

// --- RELACIONES DE DIRECCIONES ---

// Calle -> Direccion (1:N)
Calle.hasMany(Direccion, {
  foreignKey: "calle_id",
  as: "direcciones",
});

Direccion.belongsTo(Calle, {
  foreignKey: "calle_id",
  as: "calle",
});

// Cuadrante -> Direccion (1:N)
Cuadrante.hasMany(Direccion, {
  foreignKey: "cuadrante_id",
  as: "direcciones",
});

Direccion.belongsTo(Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "cuadrante",
});

// Sector -> Direccion (1:N)
Sector.hasMany(Direccion, {
  foreignKey: "sector_id",
  as: "direcciones",
});

Direccion.belongsTo(Sector, {
  foreignKey: "sector_id",
  as: "sector",
});

// Ubigeo -> Direccion (1:N)
Ubigeo.hasMany(Direccion, {
  foreignKey: "ubigeo_code",
  as: "direcciones",
});

Direccion.belongsTo(Ubigeo, {
  foreignKey: "ubigeo_code",
  as: "ubigeo",
});

// --- INTEGRACIÓN CON NOVEDADES ---

// Direccion -> Novedad (1:N)
// Esta relación permite vincular novedades a direcciones específicas
Direccion.hasMany(Novedad, {
  foreignKey: "direccion_id",
  as: "novedades",
});

Novedad.belongsTo(Direccion, {
  foreignKey: "direccion_id",
  as: "direccion",
});

// --- RELACIONES DE AUDITORÍA DEL MÓDULO CALLES ---

// TipoVia - Ahora con soft delete completo
TipoVia.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorTipoVia",
});
TipoVia.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorTipoVia",
});
TipoVia.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorTipoVia",
});

// Calle
Calle.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorCalle",
});
Calle.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorCalle",
});
Calle.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorCalle",
});

// CallesCuadrantes
CallesCuadrantes.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorCallesCuadrantes",
});
CallesCuadrantes.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorCallesCuadrantes",
});
CallesCuadrantes.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorCallesCuadrantes",
});

// Direccion
Direccion.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorDireccion",
});
Direccion.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorDireccion",
});
Direccion.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorDireccion",
});

// OperativosTurno
OperativosTurno.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "usuarioRegistro",
});
OperativosTurno.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorTurno",
});
OperativosTurno.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorTurno",
});

// --- RELACIONES DE AUDITORÍA DE OTROS MÓDULOS ---

// Permiso (ahora con updated_by)
Permiso.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorPermiso",
});

// HistorialEstadoNovedad (ahora con created_by y updated_by)
HistorialEstadoNovedad.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorHistorialEstado",
});
HistorialEstadoNovedad.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorHistorialEstado",
});

// NOTA: SubtipoNovedad, TipoVehiculo y UnidadOficina ya tienen sus relaciones
// de auditoría definidas anteriormente en este archivo (líneas 1030-1080)

Vehiculo.hasMany(VehiculoCuadrantesAsignados, {
  foreignKey: "vehiculo_id",
  as: "cuadrantesAsignados",
});

VehiculoCuadrantesAsignados.belongsTo(Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculo",
});

Cuadrante.hasMany(VehiculoCuadrantesAsignados, {
  foreignKey: "cuadrante_id",
  as: "vehiculosAsignados",
});

VehiculoCuadrantesAsignados.belongsTo(Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "cuadrante",
});

// ============================================================================
// ASOCIACIONES DEL MODELO RADIO TETRA
// ============================================================================

// Relación: PersonalSeguridad -> RadioTetra (One-to-Many)
PersonalSeguridad.hasMany(RadioTetra, {
  foreignKey: "personal_seguridad_id",
  as: "radiosTetraAsignados",
});

// Relación: RadioTetra -> PersonalSeguridad (Many-to-One)
RadioTetra.belongsTo(PersonalSeguridad, {
  foreignKey: "personal_seguridad_id",
  as: "personalAsignado", // Este es el alias que usa el controlador
});

// Relaciones de auditoría para RadioTetra
RadioTetra.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creadorRadioTetra",
});

RadioTetra.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizadorRadioTetra",
});

RadioTetra.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminadorRadioTetra",
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
  Cargo,
  Ubigeo,
  EstadoOperativoRecurso,
  TipoCopiloto,
  RadioTetra, // ✅ NEW 2.1.2

  // Operativos
  Vehiculo,
  AbastecimientoCombustible,
  Taller,
  MantenimientoVehiculo,
  OperativosVehiculosCuadrantes,
  OperativosVehiculosNovedades,
  Sector,
  Cuadrante,
  UnidadOficina,
  PersonalSeguridad,
  OperativosTurno,
  OperativosVehiculos,

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

  // Calles y Direcciones
  TipoVia,
  Calle,
  CallesCuadrantes,
  Direccion,
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
  Cargo,
  Ubigeo,
  EstadoOperativoRecurso,
  TipoCopiloto,
  RadioTetra,
  // Operativos
  Vehiculo,
  AbastecimientoCombustible,
  Taller,
  MantenimientoVehiculo,
  OperativosVehiculosCuadrantes,
  OperativosVehiculosNovedades,
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
  // Calles y Direcciones (✅ v2.1.1)
  TipoVia,
  Calle,
  CallesCuadrantes,
  Direccion,
  VehiculoCuadrantesAsignados,
};
