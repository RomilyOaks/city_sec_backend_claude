// src/utils/resolveEntidadPolimorfica.js

import models from "../models/index.js";

/**
 * Mapea el nombre almacenado en entidad_tipo con el modelo Sequelize real
 * Ajusta estos nombres según tus valores reales en la BD
 */
const ENTITY_MODEL_MAP = {
  // ── Usuarios / Auth ───────────────────────────────────────
  USUARIO: "Usuario",

  // ── Novedades ─────────────────────────────────────────────
  NOVEDAD: "Novedad",

  // ── Personal / Vehículos / Territorio ─────────────────────
  VEHICULO: "Vehiculo",
  PERSONAL: "PersonalSeguridad",
  SECTOR: "Sector",
  CUADRANTE: "Cuadrante",
  CALLECUADRANTE: "CallesCuadrantes",

  // ── Operativos — Turnos ───────────────────────────────────
  OPERATIVOTURNO: "OperativosTurno",
  OPERATIVOSTURNO: "OperativosTurno",

  // ── Operativos — Vehículos ────────────────────────────────
  OPERATIVOVEHICULO: "OperativosVehiculos",
  OPERATIVOSVEHICULOS: "OperativosVehiculos",
  OPERATIVOVEHICULOCUADRANTE: "OperativosVehiculosCuadrantes",
  OPERATIVOSVEHICULOSCUADRANTES: "OperativosVehiculosCuadrantes",
  OPERATIVOVEHICULONOVEDAD: "OperativosVehiculosNovedades",
  OPERATIVOSVEHICULOSNOVEDADES: "OperativosVehiculosNovedades",

  // ── Operativos — Personal ─────────────────────────────────
  OPERATIVOPERSONAL: "OperativosPersonal",
  OPERATIVOSPERSONAL: "OperativosPersonal",
  OPERATIVOPERSONALCUADRANTE: "OperativosPersonalCuadrantes",
  OPERATIVOSPERSONALCUADRANTES: "OperativosPersonalCuadrantes",
  OPERATIVOPERSONALNOVEDAD: "OperativosPersonalNovedades",
  OPERATIVOSPERSONALNOVEDADES: "OperativosPersonalNovedades",
};

/**
 * Resuelve dinámicamente la entidad relacionada de un log de auditoría
 * @param {Object} auditoria - instancia de AuditoriaAccion
 * @returns {Object|null}
 */
export const resolveEntidad = async (auditoria) => {
  const { entidad_tipo, entidad_id } = auditoria;

  if (!entidad_tipo || !entidad_id) return null;

  const modelName = ENTITY_MODEL_MAP[entidad_tipo?.toUpperCase()];

  if (!modelName) return null;

  const Model = models[modelName];

  if (!Model) return null;

  return await Model.findByPk(entidad_id);
};
