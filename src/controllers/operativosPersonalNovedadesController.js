/**
 * ===================================================
 * CONTROLLER: OperativosPersonalNovedades
 * ===================================================
 *
 * Ruta: src/controllers/operativosPersonalNovedadesController.js
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @version 2.2.2
 * @date 2026-01-17
 *
 * Descripcion:
 * Gestiona las operaciones CRUD para las novedades atendidas en cuadrantes
 * de personal operativo (patrullaje a pie). Incluye información completa
 * de todos los niveles superiores (Turno, Personal, Cuadrante).
 *
 * Endpoints:
 * - GET /:cuadranteId/novedades: Obtener todas las novedades de un cuadrante con información completa.
 * - GET /:cuadranteId/novedades/disponibles: Obtener novedades disponibles para el cuadrante.
 * - GET /:cuadranteId/novedades/:id: Obtener una novedad específica con información completa.
 * - POST /:cuadranteId/novedades: Registrar una nueva novedad atendida en un cuadrante.
 * - PUT /novedades/:id: Actualizar información de una novedad atendida.
 * - DELETE /novedades/:id: Eliminar una novedad atendida (soft delete).
 */

import models from "../models/index.js";
const {
  OperativosPersonalNovedades,
  OperativosPersonalCuadrantes,
  OperativosPersonal,
  OperativosTurno,
  Novedad,
  Cuadrante,
  PersonalSeguridad,
  Usuario,
  Sector
} = models;

/**
 * Obtener novedades disponibles para un cuadrante específico
 * GET /:cuadranteId/novedades/disponibles
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getNovedadesDisponiblesByCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;

  try {
    // Validar que el cuadrante exista
    const cuadrante = await Cuadrante.findByPk(cuadranteId);
    if (!cuadrante) {
      return res.status(404).json({
        status: "error",
        message: "Cuadrante no encontrado",
      });
    }

    // Obtener novedades que pertenecen a este cuadrante
    const novedades = await Novedad.findAll({
      where: {
        cuadrante_id: cuadranteId,
        estado: 1 // Solo novedades activas
      },
      include: [
        {
          model: models.TipoNovedad,
          as: "novedadTipoNovedad",
          attributes: ["id", "nombre", "color_hex", "icono"]
        },
        {
          model: models.SubtipoNovedad,
          as: "novedadSubtipoNovedad",
          attributes: ["id", "nombre", "descripcion", "prioridad"]
        },
        {
          model: models.EstadoNovedad,
          as: "novedadEstado",
          attributes: ["id", "nombre", "color_hex", "icono"]
        },
        {
          model: Sector,
          as: "novedadSector",
          attributes: ["id", "nombre", "sector_code"]
        },
        {
          model: Cuadrante,
          as: "novedadCuadrante",
          attributes: ["id", "nombre", "cuadrante_code"]
        }
      ],
      order: [
        ["prioridad_actual", "DESC"],
        ["fecha_hora_reporte", "DESC"]
      ]
    });

    res.status(200).json({
      status: "success",
      message: "Novedades disponibles del cuadrante obtenidas exitosamente",
      data: novedades,
      cuadranteInfo: {
        id: cuadrante.id,
        nombre: cuadrante.nombre,
        codigo: cuadrante.codigo || cuadrante.cuadrante_code
      },
      summary: {
        total: novedades.length,
        porPrioridad: {
          urgente: novedades.filter(n => n.prioridad_actual === "URGENTE").length,
          alta: novedades.filter(n => n.prioridad_actual === "ALTA").length,
          media: novedades.filter(n => n.prioridad_actual === "MEDIA").length,
          baja: novedades.filter(n => n.prioridad_actual === "BAJA").length,
        },
        porEstado: {
          despachado: novedades.filter(n => n.estado_novedad_id === 2).length,
          pendiente: novedades.filter(n => n.estado_novedad_id === 1).length,
          atendido: novedades.filter(n => n.estado_novedad_id === 3).length,
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Obtener todas las novedades asignadas a un cuadrante de personal operativo con información completa
 * GET /:cuadranteId/novedades
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllNovedadesByCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;

  try {
    const operativoPersonalCuadrante = await OperativosPersonalCuadrantes.findByPk(
      cuadranteId,
      {
        include: [
          {
            model: OperativosPersonal,
            as: "operativoPersonal",
            include: [
              {
                model: OperativosTurno,
                as: "turno",
                include: [
                  {
                    model: Sector,
                    as: "sector"
                  },
                  {
                    model: PersonalSeguridad,
                    as: "operador"
                  },
                  {
                    model: PersonalSeguridad,
                    as: "supervisor"
                  }
                ]
              },
              {
                model: PersonalSeguridad,
                as: "personal"
              },
              {
                model: PersonalSeguridad,
                as: "sereno"
              }
            ]
          },
          {
            model: Cuadrante,
            as: "datosCuadrante"
          }
        ]
      }
    );

    if (!operativoPersonalCuadrante) {
      return res.status(404).json({
        status: "error",
        message: "Cuadrante de personal operativo no encontrado",
      });
    }

    const novedades = await OperativosPersonalNovedades.findAll({
      where: { operativo_personal_cuadrante_id: cuadranteId },
      include: [
        {
          model: Novedad,
          as: "novedad",
        },
        {
          model: Usuario,
          as: "creadorOperativosPersonalNovedades",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "actualizadorOperativosPersonalNovedades",
          attributes: ["id", "username", "nombres", "apellidos"]
        }
      ],
      order: [["reportado", "DESC"]]
    });

    // Enriquecer la respuesta con información completa de los niveles superiores
    const novedadesEnriquecidas = novedades.map(novedad => ({
      ...novedad.toJSON(),
      cuadranteOperativo: {
        id: operativoPersonalCuadrante.id,
        hora_ingreso: operativoPersonalCuadrante.hora_ingreso,
        hora_salida: operativoPersonalCuadrante.hora_salida,
        observaciones: operativoPersonalCuadrante.observaciones,
        incidentes_reportados: operativoPersonalCuadrante.incidentes_reportados,
        cuadrante: operativoPersonalCuadrante.datosCuadrante,
        operativoPersonal: {
          id: operativoPersonalCuadrante.operativoPersonal.id,
          tipo_patrullaje: operativoPersonalCuadrante.operativoPersonal.tipo_patrullaje,
          hora_inicio: operativoPersonalCuadrante.operativoPersonal.hora_inicio,
          hora_fin: operativoPersonalCuadrante.operativoPersonal.hora_fin,
          turno: operativoPersonalCuadrante.operativoPersonal.turno,
          personal: operativoPersonalCuadrante.operativoPersonal.personal,
          sereno: operativoPersonalCuadrante.operativoPersonal.sereno
        }
      }
    }));

    // Crear objeto cuadranteInfo para incluir siempre en la respuesta
    const cuadranteInfo = {
      cuadrante: operativoPersonalCuadrante.datosCuadrante,
      operativoPersonal: {
        id: operativoPersonalCuadrante.operativoPersonal.id,
        tipo_patrullaje: operativoPersonalCuadrante.operativoPersonal.tipo_patrullaje,
        hora_inicio: operativoPersonalCuadrante.operativoPersonal.hora_inicio,
        hora_fin: operativoPersonalCuadrante.operativoPersonal.hora_fin,
        turno: operativoPersonalCuadrante.operativoPersonal.turno,
        personal: operativoPersonalCuadrante.operativoPersonal.personal,
        sereno: operativoPersonalCuadrante.operativoPersonal.sereno
      }
    };

    res.status(200).json({
      status: "success",
      message: "Novedades obtenidas exitosamente con información completa",
      data: novedadesEnriquecidas,
      cuadranteInfo: cuadranteInfo,
      summary: {
        total: novedadesEnriquecidas.length,
        porPrioridad: {
          baja: novedadesEnriquecidas.filter(n => n.prioridad === "BAJA").length,
          media: novedadesEnriquecidas.filter(n => n.prioridad === "MEDIA").length,
          alta: novedadesEnriquecidas.filter(n => n.prioridad === "ALTA").length,
          urgente: novedadesEnriquecidas.filter(n => n.prioridad === "URGENTE").length,
        },
        porResultado: {
          pendientes: novedadesEnriquecidas.filter(n => n.resultado === "PENDIENTE").length,
          resueltas: novedadesEnriquecidas.filter(n => n.resultado === "RESUELTO").length,
          escaladas: novedadesEnriquecidas.filter(n => n.resultado === "ESCALADO").length,
          canceladas: novedadesEnriquecidas.filter(n => n.resultado === "CANCELADO").length,
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva novedad atendida en un cuadrante de personal operativo
 * POST /:cuadranteId/novedades
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createNovedadInCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;
  const created_by = req.user?.id || req.user?.usuario_id;

  try {
    // Validar que el cuadrante operativo exista
    const operativoPersonalCuadrante = await OperativosPersonalCuadrantes.findByPk(
      cuadranteId,
      {
        include: [
          {
            model: OperativosPersonal,
            as: "operativoPersonal",
            include: [
              { model: OperativosTurno, as: "turno" },
              { model: PersonalSeguridad, as: "personal" }
            ]
          },
          {
            model: Cuadrante,
            as: "datosCuadrante"
          }
        ]
      }
    );

    if (!operativoPersonalCuadrante) {
      return res.status(404).json({
        status: "error",
        message: "Cuadrante de personal operativo no encontrado",
      });
    }

    // Validar que la novedad exista
    const novedad = await Novedad.findByPk(req.body.novedad_id);
    if (!novedad) {
      return res.status(404).json({
        status: "error",
        message: "La novedad especificada no existe",
      });
    }

    const newNovedadAsignada = await OperativosPersonalNovedades.create({
      novedad_id: req.body.novedad_id,
      reportado: req.body.reportado || new Date(),
      atendido: req.body.atendido,
      prioridad: req.body.prioridad || "MEDIA",
      observaciones: req.body.observaciones,
      acciones_tomadas: req.body.acciones_tomadas,
      resultado: req.body.resultado || "PENDIENTE",
      operativo_personal_cuadrante_id: cuadranteId,
      created_by,
    });

    // Obtener la novedad creada con toda la información completa
    const novedadCompleta = await OperativosPersonalNovedades.findByPk(
      newNovedadAsignada.id,
      {
        include: [
          {
            model: Novedad,
            as: "novedad",
          },
          {
            model: Usuario,
            as: "creadorOperativosPersonalNovedades",
            attributes: ["id", "username", "nombres", "apellidos"]
          }
        ]
      }
    );

    // Enriquecer la respuesta
    const novedadEnriquecida = {
      ...novedadCompleta.toJSON(),
      cuadranteOperativo: {
        id: operativoPersonalCuadrante.id,
        hora_ingreso: operativoPersonalCuadrante.hora_ingreso,
        hora_salida: operativoPersonalCuadrante.hora_salida,
        observaciones: operativoPersonalCuadrante.observaciones,
        incidentes_reportados: operativoPersonalCuadrante.incidentes_reportados,
        cuadrante: operativoPersonalCuadrante.datosCuadrante,
        operativoPersonal: {
          id: operativoPersonalCuadrante.operativoPersonal.id,
          tipo_patrullaje: operativoPersonalCuadrante.operativoPersonal.tipo_patrullaje,
          hora_inicio: operativoPersonalCuadrante.operativoPersonal.hora_inicio,
          hora_fin: operativoPersonalCuadrante.operativoPersonal.hora_fin,
          turno: operativoPersonalCuadrante.operativoPersonal.turno,
          personal: operativoPersonalCuadrante.operativoPersonal.personal,
          sereno: operativoPersonalCuadrante.operativoPersonal.sereno
        }
      }
    };

    res.status(201).json({
      status: "success",
      message: "Novedad registrada en el cuadrante correctamente",
      data: novedadEnriquecida,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al registrar la novedad",
      error: error.message,
    });
  }
};

/**
 * Actualizar una novedad atendida en un cuadrante de personal operativo
 * PUT /novedades/:id
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateNovedadInCuadrante = async (req, res) => {
  const { id } = req.params;
  const updated_by = req.user?.id || req.user?.usuario_id;

  try {
    const novedadAsignada = await OperativosPersonalNovedades.findByPk(id);
    if (!novedadAsignada) {
      return res.status(404).json({
        status: "error",
        message: "Novedad no encontrada",
      });
    }

    // Si se está actualizando el resultado a "RESUELTO", actualizar la fecha de atención
    const updateData = {
      ...req.body,
      updated_by,
    };

    if (req.body.resultado === "RESUELTO" && !req.body.atendido) {
      updateData.atendido = new Date();
    }

    await novedadAsignada.update(updateData);

    // Obtener la novedad actualizada con información completa
    const novedadActualizada = await OperativosPersonalNovedades.findByPk(
      id,
      {
        include: [
          {
            model: Novedad,
            as: "novedad",
          },
          {
            model: Usuario,
            as: "creadorOperativosPersonalNovedades",
            attributes: ["id", "username", "nombres", "apellidos"]
          },
          {
            model: Usuario,
            as: "actualizadorOperativosPersonalNovedades",
            attributes: ["id", "username", "nombres", "apellidos"]
          }
        ]
      }
    );

    res.status(200).json({
      status: "success",
      message: "Novedad actualizada correctamente",
      data: novedadActualizada,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al actualizar la novedad",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una novedad atendida de un cuadrante de personal operativo
 * DELETE /novedades/:id
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteNovedadInCuadrante = async (req, res) => {
  const { id } = req.params;
  const deleted_by = req.user?.id || req.user?.usuario_id;

  try {
    const novedadAsignada = await OperativosPersonalNovedades.findByPk(id);
    if (!novedadAsignada) {
      return res.status(404).json({
        status: "error",
        message: "Novedad no encontrada",
      });
    }

    await novedadAsignada.update({
      deleted_by,
      estado_registro: 0,
    });
    await novedadAsignada.destroy();

    res.status(200).json({
      status: "success",
      message: "Novedad eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al eliminar la novedad",
      error: error.message,
    });
  }
};
