/**
 * ===================================================
 * CONTROLLER: OperativosVehiculosNovedades
 * ===================================================
 *
 * @author Codi Express
 * @version 2.0.0
 * @date 2026-01-14
 *
 * Descripcion:
 * Gestiona las operaciones CRUD para las novedades atendidas en cuadrantes de vehículos operativos.
 * Incluye información completa de todos los niveles superiores (Turno, Vehículo, Cuadrante).
 *
 * Endpoints:
 * - GET /:operativoVehiculoCuadranteId/novedades: Obtener todas las novedades de un cuadrante con información completa.
 * - GET /:operativoVehiculoCuadranteId/novedades/:id: Obtener una novedad específica con información completa.
 * - POST /:operativoVehiculoCuadranteId/novedades: Registrar una nueva novedad atendida en un cuadrante.
 * - PUT /:operativoVehiculoCuadranteId/novedades/:id: Actualizar información de una novedad atendida.
 * - DELETE /:operativoVehiculoCuadranteId/novedades/:id: Eliminar una novedad atendida (soft delete).
 */

import models from "../models/index.js";
const { 
  OperativosVehiculosNovedades, 
  OperativosVehiculosCuadrantes, 
  OperativosVehiculos,
  OperativosTurno,
  Novedad,
  Vehiculo,
  Cuadrante,
  PersonalSeguridad,
  Usuario,
  Sector
} = models;

/**
 * Obtener todas las novedades asignadas a un cuadrante de vehículo operativo con información completa
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllNovedadesByCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;

  try {
    const operativoVehiculoCuadrante = await OperativosVehiculosCuadrantes.findByPk(
      cuadranteId,
      {
        include: [
          {
            model: OperativosVehiculos,
            as: "operativoVehiculo",
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
                model: Vehiculo,
                as: "vehiculo"
              },
              {
                model: PersonalSeguridad,
                as: "conductor"
              },
              {
                model: PersonalSeguridad,
                as: "copiloto"
              }
            ]
          },
          {
            model: Cuadrante,
            as: "cuadrante"
          }
        ]
      }
    );

    if (!operativoVehiculoCuadrante) {
      return res.status(404).json({
        status: "error",
        message: "Cuadrante de vehículo operativo no encontrado",
      });
    }

    const novedades = await OperativosVehiculosNovedades.findAll({
      where: { operativo_vehiculo_cuadrante_id: cuadranteId },
      include: [
        {
          model: Novedad,
          as: "novedad",
        },
        {
          model: Usuario,
          as: "creadoPor",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "actualizadoPor",
          attributes: ["id", "username", "nombres", "apellidos"]
        }
      ],
      order: [["reportado", "DESC"]]
    });

    // Enriquecer la respuesta con información completa de los niveles superiores
    const novedadesEnriquecidas = novedades.map(novedad => ({
      ...novedad.toJSON(),
      cuadranteOperativo: {
        id: operativoVehiculoCuadrante.id,
        hora_ingreso: operativoVehiculoCuadrante.hora_ingreso,
        hora_salida: operativoVehiculoCuadrante.hora_salida,
        observaciones: operativoVehiculoCuadrante.observaciones,
        incidentes_reportados: operativoVehiculoCuadrante.incidentes_reportados,
        cuadrante: operativoVehiculoCuadrante.cuadrante,
        operativoVehiculo: {
          id: operativoVehiculoCuadrante.operativoVehiculo.id,
          kilometraje_inicio: operativoVehiculoCuadrante.operativoVehiculo.kilometraje_inicio,
          kilometraje_fin: operativoVehiculoCuadrante.operativoVehiculo.kilometraje_fin,
          nivel_combustible_inicio: operativoVehiculoCuadrante.operativoVehiculo.nivel_combustible_inicio,
          nivel_combustible_fin: operativoVehiculoCuadrante.operativoVehiculo.nivel_combustible_fin,
          hora_inicio: operativoVehiculoCuadrante.operativoVehiculo.hora_inicio,
          hora_fin: operativoVehiculoCuadrante.operativoVehiculo.hora_fin,
          turno: operativoVehiculoCuadrante.operativoVehiculo.turno,
          vehiculo: operativoVehiculoCuadrante.operativoVehiculo.vehiculo,
          conductor: operativoVehiculoCuadrante.operativoVehiculo.conductor,
          copiloto: operativoVehiculoCuadrante.operativoVehiculo.copiloto
        }
      }
    }));

    res.status(200).json({
      status: "success",
      message: "Novedades obtenidas exitosamente con información completa",
      data: novedadesEnriquecidas,
      summary: {
        total: novedadesEnriquecidas.length,
        porEstado: {
          activas: novedadesEnriquecidas.filter(n => n.estado === 1).length,
          inactivas: novedadesEnriquecidas.filter(n => n.estado === 0).length,
          atendidas: novedadesEnriquecidas.filter(n => n.estado === 2).length,
        },
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
    console.error("Error en getAllNovedadesByCuadrante:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva novedad atendida en un cuadrante de vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createNovedadInCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;
  const created_by = req.user?.id || req.user?.usuario_id;

  try {
    // Validar que el cuadrante operativo exista
    const operativoVehiculoCuadrante = await OperativosVehiculosCuadrantes.findByPk(
      cuadranteId,
      {
        include: [
          {
            model: OperativosVehiculos,
            as: "operativoVehiculo",
            include: [
              { model: OperativosTurno, as: "turno" },
              { model: Vehiculo, as: "vehiculo" },
              { model: Cuadrante, as: "cuadrante" }
            ]
          }
        ]
      }
    );

    if (!operativoVehiculoCuadrante) {
      return res.status(404).json({
        status: "error",
        message: "Cuadrante de vehículo operativo no encontrado",
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

    const newNovedadAsignada = await OperativosVehiculosNovedades.create({
      novedad_id: req.body.novedad_id,
      reportado: req.body.reportado || new Date(),
      atendido: req.body.atendido,
      estado: req.body.estado || 1,
      prioridad: req.body.prioridad || "MEDIA",
      observaciones: req.body.observaciones,
      acciones_tomadas: req.body.acciones_tomadas,
      resultado: req.body.resultado || "PENDIENTE",
      operativo_vehiculo_cuadrante_id: cuadranteId,
      created_by,
    });

    // Obtener la novedad creada con toda la información completa
    const novedadCompleta = await OperativosVehiculosNovedades.findByPk(
      newNovedadAsignada.id,
      {
        include: [
          {
            model: Novedad,
            as: "novedad",
          },
          {
            model: Usuario,
            as: "creadoPor",
            attributes: ["id", "username", "nombres", "apellidos"]
          }
        ]
      }
    );

    // Enriquecer la respuesta
    const novedadEnriquecida = {
      ...novedadCompleta.toJSON(),
      cuadranteOperativo: {
        id: operativoVehiculoCuadrante.id,
        hora_ingreso: operativoVehiculoCuadrante.hora_ingreso,
        hora_salida: operativoVehiculoCuadrante.hora_salida,
        observaciones: operativoVehiculoCuadrante.observaciones,
        incidentes_reportados: operativoVehiculoCuadrante.incidentes_reportados,
        cuadrante: operativoVehiculoCuadrante.cuadrante,
        operativoVehiculo: {
          id: operativoVehiculoCuadrante.operativoVehiculo.id,
          kilometraje_inicio: operativoVehiculoCuadrante.operativoVehiculo.kilometraje_inicio,
          kilometraje_fin: operativoVehiculoCuadrante.operativoVehiculo.kilometraje_fin,
          nivel_combustible_inicio: operativoVehiculoCuadrante.operativoVehiculo.nivel_combustible_inicio,
          nivel_combustible_fin: operativoVehiculoCuadrante.operativoVehiculo.nivel_combustible_fin,
          hora_inicio: operativoVehiculoCuadrante.operativoVehiculo.hora_inicio,
          hora_fin: operativoVehiculoCuadrante.operativoVehiculo.hora_fin,
          turno: operativoVehiculoCuadrante.operativoVehiculo.turno,
          vehiculo: operativoVehiculoCuadrante.operativoVehiculo.vehiculo,
          conductor: operativoVehiculoCuadrante.operativoVehiculo.conductor,
          copiloto: operativoVehiculoCuadrante.operativoVehiculo.copiloto
        }
      }
    };

    res.status(201).json({
      status: "success",
      message: "Novedad registrada en el cuadrante correctamente",
      data: novedadEnriquecida,
    });
  } catch (error) {
    console.error("Error en createNovedadInCuadrante:", error);
    res.status(500).json({
      status: "error",
      message: "Error al registrar la novedad",
      error: error.message,
    });
  }
};

/**
 * Actualizar una novedad atendida en un cuadrante de vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateNovedadInCuadrante = async (req, res) => {
  const { id } = req.params;
  const updated_by = req.user?.id || req.user?.usuario_id;

  try {
    const novedadAsignada = await OperativosVehiculosNovedades.findByPk(id);
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
      updateData.estado = 2; // Marcar como atendido
    }

    await novedadAsignada.update(updateData);

    // Obtener la novedad actualizada con información completa
    const novedadActualizada = await OperativosVehiculosNovedades.findByPk(
      id,
      {
        include: [
          {
            model: Novedad,
            as: "novedad",
          },
          {
            model: Usuario,
            as: "creadoPor",
            attributes: ["id", "username", "nombres", "apellidos"]
          },
          {
            model: Usuario,
            as: "actualizadoPor",
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
    console.error("Error en updateNovedadInCuadrante:", error);
    res.status(500).json({
      status: "error",
      message: "Error al actualizar la novedad",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una novedad atendida de un cuadrante de vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteNovedadInCuadrante = async (req, res) => {
  const { id } = req.params;
  const deleted_by = req.user?.id || req.user?.usuario_id;

  try {
    const novedadAsignada = await OperativosVehiculosNovedades.findByPk(id);
    if (!novedadAsignada) {
      return res.status(404).json({
        status: "error",
        message: "Novedad no encontrada",
      });
    }

    await novedadAsignada.update({
      deleted_by,
      estado: 0, // Marcar como inactivo al eliminar
    });
    await novedadAsignada.destroy();

    res.status(200).json({
      status: "success",
      message: "Novedad eliminada correctamente",
    });
  } catch (error) {
    console.error("Error en deleteNovedadInCuadrante:", error);
    res.status(500).json({
      status: "error",
      message: "Error al eliminar la novedad",
      error: error.message,
    });
  }
};
