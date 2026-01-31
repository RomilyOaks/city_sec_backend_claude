/**
 * ===================================================
 * CONTROLLER: OperativosVehiculosCuadrantes
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2024-07-12
 *
 * Descripcion:
 * Gestiona las operaciones CRUD para los cuadrantes asignados a vehículos operativos.
 *
 * Endpoints:
 * - GET /:operativoVehiculoId/cuadrantes: Obtener todos los cuadrantes de un vehículo operativo.
 * - GET /:operativoVehiculoId/cuadrantes/:id: Obtener un cuadrante específico de un vehículo operativo.
 * - POST /:operativoVehiculoId/cuadrantes: Asignar un nuevo cuadrante a un vehículo operativo.
 * - PUT /:operativoVehiculoId/cuadrantes/:id: Actualizar la información de un cuadrante en un vehículo operativo.
 * - DELETE /:operativoVehiculoId/cuadrantes/:id: Eliminar la asignación de un cuadrante de un vehículo operativo.
 */

import models from "../models/index.js";
const { OperativosVehiculosCuadrantes, OperativosVehiculos, Cuadrante } =
  models;

/**
 * Obtener todos los cuadrantes asignados a un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllCuadrantesByVehiculo = async (req, res) => {
  const { vehiculoId } = req.params;

  try {
    console.log("🐛 DEBUG: Iniciando getAllCuadrantesByVehiculo para vehiculoId:", vehiculoId);

    const operativoVehiculo = await OperativosVehiculos.findByPk(
      vehiculoId
    );
    if (!operativoVehiculo) {
      console.log("🐛 DEBUG: Vehículo operativo no encontrado");
      return res.status(404).json({
        status: "error",
        message: "Vehículo operativo no encontrado",
      });
    }

    console.log("🐛 DEBUG: Vehículo encontrado, consultando cuadrantes activos...");

    const cuadrantes = await OperativosVehiculosCuadrantes.findAll({
      where: { 
        operativo_vehiculo_id: vehiculoId,
        estado_registro: 1,  // Solo registros activos
        deleted_at: null     // No eliminados
      },
      include: [
        {
          model: models.Cuadrante,
          as: "datosCuadrante",
          where: {
            estado_registro: 1  // Solo cuadrantes activos
          }
        },
      ],
      order: [["hora_ingreso", "ASC"]],
    });

    console.log("🐛 DEBUG: Cuadrantes consultados exitosamente. Count:", cuadrantes.length);

    res.status(200).json({
      status: "success",
      data: cuadrantes,
    });
  } catch (error) {
    console.error("🐛 DEBUG: Error en getAllCuadrantesByVehiculo:");
    console.error("🐛 DEBUG: Error message:", error.message);
    console.error("🐛 DEBUG: Error name:", error.name);
    
    res.status(500).json({
      status: "error",
      message: "Error al obtener los cuadrantes del vehículo",
      error: error.message,
      debug: {
        name: error.name,
        vehiculoId: req.params.vehiculoId,
      }
    });
  }
};

/**
 * Crear una nueva asignación de cuadrante a un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createCuadranteInVehiculo = async (req, res) => {
  console.log("🔥🔥🔥🔥🔥 createCuadranteInVehiculo EJECUTÁNDOSE - VERSIÓN FINAL ACTUALIZADA 🔥🔥🔥🔥🔥");
  console.log("🔥🔥🔥🔥🔥 req.body DIRECTO EN CONTROLLER:", JSON.stringify(req.body, null, 2));
  console.log("🔥🔥🔥🔥🔥 FECHA ACTUAL:", new Date().toISOString());
  
  const { vehiculoId } = req.params;
  
  // Verificar que el usuario existe en el request
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: "error",
      message: "Usuario no autenticado",
    });
  }
  
  const { id: created_by } = req.user;

  try {
    console.log("🐛 DEBUG: Iniciando createCuadranteInVehiculo para vehiculoId:", vehiculoId);
    console.log("🐛 DEBUG: req.params:", req.params);
    console.log("🐛 DEBUG: req.body TIPO:", typeof req.body);
    console.log("🐛 DEBUG: req.body CONTENIDO:", JSON.stringify(req.body, null, 2));
    console.log("🐛 DEBUG: req.body KEYS:", Object.keys(req.body));
    console.log("🐛 DEBUG: 'observaciones' in req.body:", "observaciones" in req.body);
    console.log("🐛 DEBUG: req.body.observaciones:", req.body.observaciones);
    console.log("🐛 DEBUG: Usuario creando:", created_by);

    const operativoVehiculo = await OperativosVehiculos.findByPk(
      vehiculoId
    );
    if (!operativoVehiculo) {
      console.log("🐛 DEBUG: Vehículo operativo no encontrado");
      return res.status(404).json({
        status: "error",
        message: "Vehículo operativo no encontrado",
      });
    }

    // Validar que el cuadrante exista
    if (req.body.cuadrante_id) {
      const { Cuadrante } = models;
      const cuadrante = await Cuadrante.findByPk(req.body.cuadrante_id);
      if (!cuadrante) {
        console.log("🐛 DEBUG: Cuadrante no encontrado con ID:", req.body.cuadrante_id);
        return res.status(404).json({
          status: "error",
          message: "Cuadrante no encontrado",
        });
      }
    }

    // 🔥 SOLUCIÓN DIRECTA: Forzar creación con todos los campos
    const createData = {
      operativo_vehiculo_id: vehiculoId,
      created_by,
    };

    // Campos obligatorios
    if (req.body.cuadrante_id) {
      createData.cuadrante_id = req.body.cuadrante_id;
    } else {
      return res.status(400).json({
        status: "error",
        message: "El campo cuadrante_id es obligatorio",
      });
    }

    if (req.body.hora_ingreso) {
      createData.hora_ingreso = req.body.hora_ingreso;
    } else {
      return res.status(400).json({
        status: "error",
        message: "El campo hora_ingreso es obligatorio",
      });
    }

    // 🔥 CAMPOS OPCIONALES - MANEJO EXPLÍCITO
    if ("observaciones" in req.body) {
      createData.observaciones = req.body.observaciones === "" ? null : req.body.observaciones;
      console.log("🔥🔥🔥 OBSERVACIONES PROCESADAS:", createData.observaciones);
    }

    if ("incidentes_reportados" in req.body) {
      createData.incidentes_reportados = req.body.incidentes_reportados === "" ? null : req.body.incidentes_reportados;
      console.log("🔥🔥🔥 INCIDENTES_REPORTADOS PROCESADOS:", createData.incidentes_reportados);
    }

    if ("hora_salida" in req.body) {
      createData.hora_salida = req.body.hora_salida === "" ? null : req.body.hora_salida;
      console.log("🔥🔥🔥 HORA_SALIDA PROCESADA:", createData.hora_salida);
    }

    console.log("🔥🔥🔥 DATOS FINALES A CREAR:", JSON.stringify(createData, null, 2));

    const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create(createData);

    console.log("🔥🔥🔥 CUADRANTE CREADO EXITOSAMENTE:");
    console.log("🔥🔥🔥 ID:", newCuadranteAsignado.id);
    console.log("🔥🔥🔥 observaciones:", newCuadranteAsignado.observaciones);
    console.log("🔥🔥🔥 incidentes_reportados:", newCuadranteAsignado.incidentes_reportados);

    // Recargar con datos completos para respuesta
    const cuadranteCompleto = await OperativosVehiculosCuadrantes.findByPk(newCuadranteAsignado.id, {
      include: [
        {
          model: models.Cuadrante,
          as: "datosCuadrante",
        },
        {
          model: models.Usuario,
          as: "creadorOperativosVehiculosCuadrantes",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
      ],
    });

    res.status(201).json({
      status: "success",
      message: "Cuadrante asignado al vehículo operativo correctamente",
      data: cuadranteCompleto,
    });
  } catch (error) {
    console.error("🔥🔥🔥 ERROR EN createCuadranteInVehiculo:");
    console.error("🔥🔥🔥 Error message:", error.message);
    console.error("🔥🔥🔥 Error name:", error.name);
    console.error("🔥🔥🔥 Error stack:", error.stack);
    
    // Manejar errores específicos de Sequelize
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));
      return res.status(400).json({
        status: "error",
        message: "Error de validación",
        errors,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Error al asignar el cuadrante",
      error: error.message,
      debug: {
        name: error.name,
        body: req.body,
        vehiculoId: req.params.vehiculoId,
      }
    });
  }
};

/**
 * Actualizar una asignación de cuadrante en un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateCuadranteInVehiculo = async (req, res) => {
  const { id } = req.params;
  const { updated_by } = req.user;

  try {
    console.log("🐛 DEBUG: Iniciando updateCuadranteInVehiculo para ID:", id);
    console.log("🐛 DEBUG: Datos recibidos:", req.body);
    console.log("🐛 DEBUG: Usuario actualizando:", updated_by);

    const cuadranteAsignado = await OperativosVehiculosCuadrantes.findByPk(id, {
      include: [
        {
          model: OperativosVehiculos,
          as: "operativoVehiculo",
          include: [
            {
              model: models.OperativosTurno,
              as: "turno",
              attributes: ["id", "estado"]
            }
          ]
        }
      ]
    });

    if (!cuadranteAsignado) {
      console.log("🐛 DEBUG: Asignación de cuadrante no encontrada");
      return res.status(404).json({
        status: "error",
        message: "Asignación de cuadrante no encontrada",
      });
    }

    // Validar que el turno esté ACTIVO para permitir edición
    const estadoTurno = cuadranteAsignado.operativoVehiculo?.turno?.estado;
    if (estadoTurno !== "ACTIVO") {
      console.log("🐛 DEBUG: Turno no está ACTIVO, estado:", estadoTurno);
      return res.status(400).json({
        status: "error",
        message: "No se puede editar la asignación. El turno no está en estado ACTIVO",
        debug: {
          estado_turno: estadoTurno,
          requerido: "ACTIVO"
        }
      });
    }

    console.log("🐛 DEBUG: Turno ACTIVO validado, procediendo con actualización...");

    // Campos permitidos cuando el turno está ACTIVO
    const camposPermitidos = ["hora_salida", "observaciones", "incidentes_reportados"];
    const updateData = {};
    
    console.log("🐛 DEBUG: Procesando campos permitidos:", camposPermitidos);
    
    // Solo permitir campos específicos y validar que hora_salida no sea obligatoria
    for (const campo of camposPermitidos) {
      if (campo in req.body) {
        console.log(`🐛 DEBUG: Procesando campo '${campo}':`, req.body[campo]);
        
        if (campo === "hora_salida" && req.body[campo] === "") {
          // Permitir hora_salida vacía (null)
          updateData[campo] = null;
          console.log("🐛 DEBUG: hora_salida vacía, estableciendo a null");
        } else if (req.body[campo] !== undefined) {
          updateData[campo] = req.body[campo];
          console.log(`🐛 DEBUG: ${campo} establecido a:`, req.body[campo]);
        }
      } else {
        console.log(`🐛 DEBUG: Campo '${campo}' no presente en req.body`);
      }
    }

    console.log("🐛 DEBUG: updateData final antes de validación:", JSON.stringify(updateData, null, 2));

    // Validar que si se envía hora_salida, sea posterior a hora_ingreso
    if (updateData.hora_salida && cuadranteAsignado.hora_ingreso) {
      const horaIngreso = new Date(cuadranteAsignado.hora_ingreso);
      const horaSalida = new Date(updateData.hora_salida);
      
      if (horaSalida <= horaIngreso) {
        return res.status(400).json({
          status: "error",
          message: "La hora de salida debe ser posterior a la hora de ingreso",
          debug: {
            hora_ingreso: cuadranteAsignado.hora_ingreso,
            hora_salida: updateData.hora_salida
          }
        });
      }
    }

    updateData.updated_by = updated_by;
    console.log("🐛 DEBUG: Datos a actualizar (con updated_by):", JSON.stringify(updateData, null, 2));

    await cuadranteAsignado.update(updateData);

    console.log("🐛 DEBUG: Actualización exitosa");
    console.log("🐛 DEBUG: Verificando datos guardados:");
    console.log("🐛 DEBUG: observaciones guardadas:", cuadranteAsignado.observaciones);
    console.log("🐛 DEBUG: incidentes_reportados guardados:", cuadranteAsignado.incidentes_reportados);
    console.log("🐛 DEBUG: hora_salida guardada:", cuadranteAsignado.hora_salida);

    // Recargar con los datos actualizados y relaciones
    const cuadranteActualizado = await OperativosVehiculosCuadrantes.findByPk(id, {
      include: [
        {
          model: models.Cuadrante,
          as: "datosCuadrante",
        },
        {
          model: models.Usuario,
          as: "creadorOperativosVehiculosCuadrantes",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: models.Usuario,
          as: "actualizadorOperativosVehiculosCuadrantes",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Asignación de cuadrante actualizada correctamente",
      data: cuadranteActualizado,
    });
  } catch (error) {
    console.error("🐛 DEBUG: Error en updateCuadranteInVehiculo:");
    console.error("🐛 DEBUG: Error message:", error.message);
    console.error("🐛 DEBUG: Error name:", error.name);
    console.error("🐛 DEBUG: Error stack:", error.stack);

    // Manejar errores específicos de Sequelize
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        status: "error",
        message: "Ya existe una asignación para este vehículo, cuadrante y hora de ingreso",
        error: error.message,
      });
    }

    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        status: "error",
        message: "Error de validación",
        errors,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Error al actualizar la asignación",
      error: error.message,
      debug: {
        name: error.name,
        id: req.params.id,
        body: req.body,
      }
    });
  }
};

/**
 * Eliminar (soft delete) una asignación de cuadrante de un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteCuadranteInVehiculo = async (req, res) => {
  const { id } = req.params;
  const { deleted_by } = req.user;

  try {
    console.log("🐛 DEBUG: Iniciando deleteCuadranteInVehiculo para ID:", id);
    console.log("🐛 DEBUG: Usuario eliminando:", deleted_by);

    const cuadranteAsignado = await OperativosVehiculosCuadrantes.findByPk(id);
    if (!cuadranteAsignado) {
      console.log("🐛 DEBUG: Asignación de cuadrante no encontrada");
      return res.status(404).json({
        status: "error",
        message: "Asignación de cuadrante no encontrada",
      });
    }

    console.log("🐛 DEBUG: Asignación encontrada, procediendo con soft delete...");

    // Soft delete: actualizar deleted_by, deleted_at y estado_registro = 0
    await cuadranteAsignado.update({
      deleted_by,
      deleted_at: new Date(),
      estado_registro: 0,  // Importante: también poner estado_registro = 0
    });

    // Luego hacer el destroy para que Sequelize maneje el soft delete correctamente
    await cuadranteAsignado.destroy();

    console.log("🐛 DEBUG: Soft delete completado exitosamente");

    res.status(200).json({
      status: "success",
      message: "Asignación de cuadrante eliminada correctamente",
    });
  } catch (error) {
    console.error("🐛 DEBUG: Error en deleteCuadranteInVehiculo:");
    console.error("🐛 DEBUG: Error message:", error.message);
    console.error("🐛 DEBUG: Error name:", error.name);
    console.error("🐛 DEBUG: Error stack:", error.stack);
    
    res.status(500).json({
      status: "error",
      message: "Error al eliminar la asignación",
      error: error.message,
      debug: {
        name: error.name,
        id: req.params.id,
      }
    });
  }
};
