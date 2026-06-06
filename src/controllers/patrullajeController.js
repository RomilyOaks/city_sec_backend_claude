/**
 * CONTROLADOR: Patrullaje — Turno Activo del Sereno
 *
 * Endpoint: GET /api/v1/patrullaje/turno-activo
 *
 * Devuelve el turno activo del sereno autenticado (vía JWT) junto con
 * su asignación vehicular o de patrullaje a pie. Si no hay turno activo
 * o no hay asignación, responde { data: null } — el APK usa ese valor
 * para bloquear el switch GPS.
 *
 * Implementación: TD-P-005
 */

import { Op } from "sequelize";
import models from "../models/index.js";
import { formatResponse, formatErrorResponse } from "../utils/responseFormatter.js";
import logger from "../utils/logger.js";
import { getDateInTimezone } from "../utils/dateHelper.js";

const {
  Usuario,
  HorariosTurnos,
  OperativosTurno,
  OperativosVehiculos,
  OperativosPersonal,
  OperativosVehiculosCuadrantes,
  OperativosPersonalCuadrantes,
  Vehiculo,
  Cuadrante,
} = models;

// ─────────────────────────────────────────────────────────
// HELPERS PRIVADOS
// ─────────────────────────────────────────────────────────

/**
 * Detecta el horario de turno activo según la hora actual en Lima.
 * Replica la lógica de horariosTurnosController.getHorarioActivo
 * pero retorna el objeto directamente (sin res.json) para que
 * pueda ser consumido por otros controladores.
 *
 * @returns {Object|null} Instancia de HorariosTurnos o null
 */
const resolveHorarioActivo = async () => {
  const timezone = "America/Lima";
  const now = new Date();

  const horaString = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const horariosActivos = await HorariosTurnos.findAll({
    where: { estado: 1, deleted_at: null },
    attributes: ["turno", "hora_inicio", "hora_fin", "cruza_medianoche"],
  });

  for (const horario of horariosActivos) {
    const inicio = horario.hora_inicio;
    const fin = horario.hora_fin;

    if (horario.cruza_medianoche) {
      if (horaString >= inicio || horaString < fin) return horario;
    } else {
      if (horaString >= inicio && horaString < fin) return horario;
    }
  }

  return null;
};

/**
 * Construye el objeto turno para la respuesta.
 */
const buildTurnoShape = (horario, fecha) => ({
  nombre: horario.turno,
  hora_inicio: horario.hora_inicio,
  hora_fin: horario.hora_fin,
  fecha,
});

/**
 * Obtiene el cuadrante activo de un operativo vehicular.
 * "Activo" = sin hora_salida y sin soft-delete.
 *
 * @param {number} opVehiculoId - ID del operativo vehicular
 * @returns {Object|null} Datos del cuadrante o null
 */
const getCuadranteActivoVehiculo = async (opVehiculoId) => {
  const ovc = await OperativosVehiculosCuadrantes.findOne({
    where: {
      operativo_vehiculo_id: opVehiculoId,
      hora_salida: null,
      deleted_at: null,
    },
    include: [
      {
        model: Cuadrante,
        as: "cuadrante",
        attributes: ["id", "nombre"],
      },
    ],
  });
  return ovc?.cuadrante ?? null;
};

/**
 * Obtiene el cuadrante activo de un operativo de personal a pie.
 *
 * @param {number} opPersonalId - ID del operativo de personal
 * @returns {Object|null} Datos del cuadrante o null
 */
const getCuadranteActivoPersonal = async (opPersonalId) => {
  const opc = await OperativosPersonalCuadrantes.findOne({
    where: {
      operativo_personal_id: opPersonalId,
      hora_salida: null,
      deleted_at: null,
    },
    include: [
      {
        model: Cuadrante,
        as: "datosCuadrante",
        attributes: ["id", "nombre"],
      },
    ],
  });
  return opc?.datosCuadrante ?? null;
};

// ─────────────────────────────────────────────────────────
// ENDPOINT PRINCIPAL
// ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/patrullaje/turno-activo
 *
 * Devuelve el turno activo y la asignación operativa del sereno autenticado.
 * Siempre responde HTTP 200. data:null significa "sin turno" (GPS bloqueado en APK).
 *
 * Casos de respuesta:
 *   - turno activo + vehiculo asignado   → { turno, rol_operativo, vehiculo, tipo_patrullaje: 'VEHICULAR', cuadrante }
 *   - turno activo + patrullaje a pie    → { turno, rol_operativo, vehiculo: null, tipo_patrullaje: 'A_PIE', cuadrante }
 *   - turno activo sin asignación aún    → { turno, rol_operativo: null, vehiculo: null, tipo_patrullaje: null, cuadrante: null }
 *   - sin turno activo                   → data: null
 */
export const getTurnoActivo = async (req, res) => {
  try {
    // 1. Resolver personal_seguridad_id del usuario autenticado
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ["personal_seguridad_id"],
    });

    if (!usuario?.personal_seguridad_id) {
      return res.json(
        formatResponse(true, "Usuario sin personal de seguridad asignado", null)
      );
    }
    const psId = usuario.personal_seguridad_id;

    // 2. Obtener horario activo (hora Lima)
    const horarioActivo = await resolveHorarioActivo();
    if (!horarioActivo) {
      return res.json(
        formatResponse(true, "Sin turno activo en este momento", null)
      );
    }

    // 3. Fecha local Lima en formato YYYY-MM-DD (para comparar con operativos_turno.fecha)
    const hoyPeru = getDateInTimezone();

    // 4. Buscar operativo del turno de hoy
    const operativoTurno = await OperativosTurno.findOne({
      where: {
        turno: horarioActivo.turno,
        fecha: hoyPeru,
        deleted_at: null,
      },
    });

    if (!operativoTurno) {
      return res.json(
        formatResponse(
          true,
          "Turno activo sin operativo configurado para hoy",
          {
            turno: buildTurnoShape(horarioActivo, hoyPeru),
            rol_operativo: null,
            vehiculo: null,
            tipo_patrullaje: null,
            cuadrante: null,
          }
        )
      );
    }

    // 5. Buscar en operativos_vehiculos (conductor o copiloto)
    const opVehiculo = await OperativosVehiculos.findOne({
      where: {
        operativo_turno_id: operativoTurno.id,
        [Op.or]: [{ conductor_id: psId }, { copiloto_id: psId }],
        deleted_at: null,
      },
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "codigo_vehiculo", "placa", "marca"],
        },
      ],
    });

    if (opVehiculo) {
      const rolOperativo =
        opVehiculo.conductor_id === psId ? "CONDUCTOR" : "COPILOTO";
      const cuadrante = await getCuadranteActivoVehiculo(opVehiculo.id);

      return res.json(
        formatResponse(true, "Turno activo obtenido exitosamente", {
          turno: buildTurnoShape(horarioActivo, hoyPeru),
          rol_operativo: rolOperativo,
          vehiculo: opVehiculo.vehiculo,
          tipo_patrullaje: "VEHICULAR",
          cuadrante,
        })
      );
    }

    // 6. Buscar en operativos_personal (principal o auxiliar a pie)
    const opPersonal = await OperativosPersonal.findOne({
      where: {
        operativo_turno_id: operativoTurno.id,
        [Op.or]: [{ personal_id: psId }, { sereno_id: psId }],
        deleted_at: null,
      },
    });

    if (opPersonal) {
      const rolOperativo =
        opPersonal.personal_id === psId
          ? "SERENO_PRINCIPAL"
          : "SERENO_AUXILIAR";
      const cuadrante = await getCuadranteActivoPersonal(opPersonal.id);

      return res.json(
        formatResponse(true, "Turno activo obtenido exitosamente", {
          turno: buildTurnoShape(horarioActivo, hoyPeru),
          rol_operativo: rolOperativo,
          vehiculo: null,
          tipo_patrullaje: "A_PIE",
          cuadrante,
        })
      );
    }

    // 7. Tiene turno activo pero sin asignación operativa aún
    return res.json(
      formatResponse(true, "Turno activo sin asignación operativa", {
        turno: buildTurnoShape(horarioActivo, hoyPeru),
        rol_operativo: null,
        vehiculo: null,
        tipo_patrullaje: null,
        cuadrante: null,
      })
    );
  } catch (error) {
    logger.error("Error en getTurnoActivo", { stack: error.stack });
    return res.status(500).json(formatErrorResponse("Error interno del servidor"));
  }
};

export default { getTurnoActivo };
