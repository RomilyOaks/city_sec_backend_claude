/**
 * CONTROLADOR: Patrullaje — Turno Activo del Sereno
 *
 * Endpoint: GET /api/v1/patrullaje/turno-activo
 *
 * Devuelve el turno activo del sereno autenticado (vía JWT) junto con
 * datos del personal, asignación operativa y novedades asignadas.
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
  PersonalSeguridad,
  HorariosTurnos,
  OperativosTurno,
  OperativosVehiculos,
  OperativosPersonal,
  OperativosVehiculosCuadrantes,
  OperativosPersonalCuadrantes,
  OperativosVehiculosNovedades,
  OperativosPersonalNovedades,
  Vehiculo,
  Cuadrante,
  Novedad,
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
} = models;

// ─────────────────────────────────────────────────────────
// HELPERS PRIVADOS
// ─────────────────────────────────────────────────────────

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

const buildTurnoShape = (horario, fecha) => ({
  nombre: horario.turno,
  hora_inicio: horario.hora_inicio,
  hora_fin: horario.hora_fin,
  fecha,
});

const buildSerenoShape = (ps) => ({
  id: ps.id,
  nombres: ps.nombres,
  apellido_paterno: ps.apellido_paterno,
  apellido_materno: ps.apellido_materno,
  doc_tipo: ps.doc_tipo,
  doc_numero: ps.doc_numero,
});

const buildNovedadShape = (n) => {
  const nov = n.novedad ?? n; // soporta tanto novedad anidada como directa
  return {
    id: nov.id,
    codigo: nov.novedad_code,
    descripcion: nov.descripcion,
    prioridad: nov.prioridad_actual,
    fecha_hora: nov.fecha_hora_ocurrencia,
    tipo: nov.novedadTipoNovedad?.nombre ?? null,
    subtipo: nov.novedadSubtipoNovedad?.nombre ?? null,
    estado: nov.novedadEstado?.nombre ?? null,
  };
};

/**
 * Devuelve { cuadrante, novedades } del operativo vehicular activo.
 * "Activo" = sin hora_salida en la asignación de cuadrante.
 */
const getCuadranteActivoVehiculo = async (opVehiculoId) => {
  const ovc = await OperativosVehiculosCuadrantes.findOne({
    where: { operativo_vehiculo_id: opVehiculoId, hora_salida: null },
    include: [
      {
        model: Cuadrante,
        as: "cuadrante",
        attributes: ["id", "nombre"],
      },
      {
        model: OperativosVehiculosNovedades,
        as: "novedades",
        attributes: [],
        required: false,
        include: [
          {
            model: Novedad,
            as: "novedad",
            attributes: ["id", "novedad_code", "descripcion", "prioridad_actual", "fecha_hora_ocurrencia"],
            include: [
              { model: TipoNovedad, as: "novedadTipoNovedad", attributes: ["nombre"] },
              { model: SubtipoNovedad, as: "novedadSubtipoNovedad", attributes: ["nombre"] },
              { model: EstadoNovedad, as: "novedadEstado", attributes: ["nombre"] },
            ],
          },
        ],
      },
    ],
  });

  if (!ovc) return { cuadrante: null, novedades: [] };

  const novedadesRaw = ovc.novedades ?? [];
  return {
    cuadrante: ovc.cuadrante ?? null,
    novedades: novedadesRaw.map(buildNovedadShape),
  };
};

/**
 * Devuelve { cuadrante, novedades } del operativo personal activo.
 */
const getCuadranteActivoPersonal = async (opPersonalId) => {
  const opc = await OperativosPersonalCuadrantes.findOne({
    where: { operativo_personal_id: opPersonalId, hora_salida: null },
    include: [
      {
        model: Cuadrante,
        as: "datosCuadrante",
        attributes: ["id", "nombre"],
      },
      {
        model: OperativosPersonalNovedades,
        as: "novedades",
        attributes: [],
        required: false,
        include: [
          {
            model: Novedad,
            as: "novedad",
            attributes: ["id", "novedad_code", "descripcion", "prioridad_actual", "fecha_hora_ocurrencia"],
            include: [
              { model: TipoNovedad, as: "novedadTipoNovedad", attributes: ["nombre"] },
              { model: SubtipoNovedad, as: "novedadSubtipoNovedad", attributes: ["nombre"] },
              { model: EstadoNovedad, as: "novedadEstado", attributes: ["nombre"] },
            ],
          },
        ],
      },
    ],
  });

  if (!opc) return { cuadrante: null, novedades: [] };

  const novedadesRaw = opc.novedades ?? [];
  return {
    cuadrante: opc.datosCuadrante ?? null,
    novedades: novedadesRaw.map(buildNovedadShape),
  };
};

// ─────────────────────────────────────────────────────────
// ENDPOINT PRINCIPAL
// ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/patrullaje/turno-activo
 *
 * Responde siempre HTTP 200.
 * data:null → sin turno activo (APK bloquea GPS).
 */
export const getTurnoActivo = async (req, res) => {
  try {
    // 1. Datos del usuario + personal de seguridad
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ["personal_seguridad_id"],
      include: [
        {
          model: PersonalSeguridad,
          as: "usuarioPersonalSeguridad",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
          required: false,
        },
      ],
    });

    if (!usuario?.personal_seguridad_id) {
      return res.json(
        formatResponse(true, "Usuario sin personal de seguridad asignado", null)
      );
    }

    const psId = usuario.personal_seguridad_id;
    const sereno = usuario.usuarioPersonalSeguridad
      ? buildSerenoShape(usuario.usuarioPersonalSeguridad)
      : null;

    // 2. Horario activo (hora Lima)
    const horarioActivo = await resolveHorarioActivo();
    if (!horarioActivo) {
      return res.json(
        formatResponse(true, "Sin turno activo en este momento", null)
      );
    }

    // 3. Fecha del operativo — para turnos cross-midnight usa ayer si hora < hora_fin
    const hoyPeru = getDateInTimezone();
    let fechaOperativo = hoyPeru;

    if (horarioActivo.cruza_medianoche) {
      const horaActualLima = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Lima",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());

      if (horaActualLima < horarioActivo.hora_fin) {
        const [y, m, d] = hoyPeru.split("-").map(Number);
        const ayer = new Date(Date.UTC(y, m - 1, d - 1));
        fechaOperativo = ayer.toISOString().slice(0, 10);
      }
    }

    // 4. Verificar que existe operativo_turno para este turno/fecha
    const hayOperativo = await OperativosTurno.findOne({
      where: { turno: horarioActivo.turno, fecha: fechaOperativo },
      attributes: ["id"],
    });

    if (!hayOperativo) {
      return res.json(
        formatResponse(true, "Turno activo sin operativo configurado para hoy", {
          turno: buildTurnoShape(horarioActivo, fechaOperativo),
          sereno,
          rol_operativo: null,
          vehiculo: null,
          tipo_patrullaje: null,
          cuadrante: null,
          novedades_asignadas: [],
        })
      );
    }

    // 5. Buscar asignación vehicular — JOIN directo con operativos_turno
    const opVehiculo = await OperativosVehiculos.findOne({
      where: { [Op.or]: [{ conductor_id: psId }, { copiloto_id: psId }] },
      include: [
        {
          model: OperativosTurno,
          as: "turno",
          where: { turno: horarioActivo.turno, fecha: fechaOperativo },
          attributes: [],
          required: true,
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "codigo_vehiculo", "placa", "marca"],
        },
      ],
    });

    if (opVehiculo) {
      const rolOperativo =
        Number(opVehiculo.conductor_id) === Number(psId) ? "CONDUCTOR" : "COPILOTO";
      const { cuadrante, novedades } = await getCuadranteActivoVehiculo(opVehiculo.id);

      return res.json(
        formatResponse(true, "Turno activo obtenido exitosamente", {
          turno: buildTurnoShape(horarioActivo, fechaOperativo),
          sereno,
          rol_operativo: rolOperativo,
          vehiculo: opVehiculo.vehiculo,
          tipo_patrullaje: "VEHICULAR",
          cuadrante,
          novedades_asignadas: novedades,
        })
      );
    }

    // 6. Buscar asignación a pie — JOIN directo con operativos_turno
    const opPersonal = await OperativosPersonal.findOne({
      where: { [Op.or]: [{ personal_id: psId }, { sereno_id: psId }] },
      include: [
        {
          model: OperativosTurno,
          as: "turno",
          where: { turno: horarioActivo.turno, fecha: fechaOperativo },
          attributes: [],
          required: true,
        },
      ],
    });

    if (opPersonal) {
      const rolOperativo =
        Number(opPersonal.personal_id) === Number(psId)
          ? "SERENO_PRINCIPAL"
          : "SERENO_AUXILIAR";
      const { cuadrante, novedades } = await getCuadranteActivoPersonal(opPersonal.id);

      return res.json(
        formatResponse(true, "Turno activo obtenido exitosamente", {
          turno: buildTurnoShape(horarioActivo, fechaOperativo),
          sereno,
          rol_operativo: rolOperativo,
          vehiculo: null,
          tipo_patrullaje: "A_PIE",
          cuadrante,
          novedades_asignadas: novedades,
        })
      );
    }

    // 7. Turno activo pero sin asignación operativa aún
    return res.json(
      formatResponse(true, "Turno activo sin asignación operativa", {
        turno: buildTurnoShape(horarioActivo, fechaOperativo),
        sereno,
        rol_operativo: null,
        vehiculo: null,
        tipo_patrullaje: null,
        cuadrante: null,
        novedades_asignadas: [],
      })
    );
  } catch (error) {
    logger.error("Error en getTurnoActivo", { stack: error.stack });
    return res.status(500).json(formatErrorResponse("Error interno del servidor"));
  }
};

export default { getTurnoActivo };
