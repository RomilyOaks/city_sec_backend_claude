/**
 * ===================================================
 * CONTROLADOR: Horarios Turnos
 * ===================================================
 *
 * Ruta: src/controllers/horariosTurnosController.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-20
 *
 * Descripción:
 * Controlador para gestión de horarios de turnos para operativos de patrullaje.
 * Maneja CRUD completo con validaciones, soft delete y reactivación.
 *
 * Funciones (7):
 * - getAllHorariosTurnos() - GET /horarios-turnos
 * - getHorarioTurnoById() - GET /horarios-turnos/:turno
 * - createHorarioTurno() - POST /horarios-turnos
 * - updateHorarioTurno() - PUT /horarios-turnos/:turno
 * - deleteHorarioTurno() - DELETE /horarios-turnos/:turno
 * - reactivarHorarioTurno() - POST /horarios-turnos/:turno/reactivar
 * - getHorarioActivo() - GET /horarios-turnos/activo
 *
 * @author Windsurf AI
 * @supervisor Romily Oaks
 * @date 2026-01-20
 * @version 1.0.0
 */

import models from "../models/index.js";
const { HorariosTurnos, Usuario } = models;

// ==========================================
// ENDPOINT 1: OBTENER TODOS LOS HORARIOS
// ==========================================

/**
 * Obtener todos los horarios de turnos con filtros opcionales
 * GET /api/v1/horarios-turnos
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Lista de horarios con paginación
 */
export const getAllHorariosTurnos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado = null,
      includeDeleted = false,
    } = req.query;

    // Convertir parámetros a números
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Construir where clause
    const whereClause = {};
    
    if (estado !== null && estado !== undefined) {
      whereClause.estado = estado === "true" || estado === "1" ? 1 : 0;
    }
    
    if (!includeDeleted || includeDeleted === "false") {
      whereClause.deleted_at = null;
    }

    // Consulta principal
    const { count, rows: horarios } = await HorariosTurnos.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "username", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "username", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "eliminador",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
      order: [["turno", "ASC"]],
      limit: limitNum,
      offset: offset,
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      message: "Horarios de turnos obtenidos exitosamente",
      data: horarios,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
      },
    });
  } catch (error) {
    console.error("❌ Error en getAllHorariosTurnos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ==========================================
// ENDPOINT 2: OBTENER HORARIO POR ID
// ==========================================

/**
 * Obtener un horario de turno específico por su ID
 * GET /api/v1/horarios-turnos/:turno
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Horario específico
 */
export const getHorarioTurnoById = async (req, res) => {
  try {
    const { turno } = req.params;

    const horario = await HorariosTurnos.findByPk(turno, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "username", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "username", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "eliminador",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
    });

    if (!horario) {
      return res.status(404).json({
        success: false,
        message: "Horario de turno no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Horario de turno obtenido exitosamente",
      data: horario,
    });
  } catch (error) {
    console.error("❌ Error en getHorarioTurnoById:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ==========================================
// ENDPOINT 3: CREAR HORARIO
// ==========================================

/**
 * Crear un nuevo horario de turno
 * POST /api/v1/horarios-turnos
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Horario creado
 */
export const createHorarioTurno = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { turno, hora_inicio, hora_fin, cruza_medianoche = false } = req.body;

    // Verificar si ya existe un horario para este turno
    console.log(`🔍 Buscando horario existente para turno: ${turno}`);
    const horarioExistente = await HorariosTurnos.findByPk(turno, {
      paranoid: false // Incluir registros eliminados (soft delete)
    });
    
    console.log(`📊 Horario encontrado:`, horarioExistente ? {
      turno: horarioExistente.turno,
      estado: horarioExistente.estado,
      deleted_at: horarioExistente.deleted_at,
      hora_inicio: horarioExistente.hora_inicio,
      hora_fin: horarioExistente.hora_fin
    } : 'No encontrado');
    
    if (horarioExistente) {
      // Si existe y está activo (no eliminado y estado=1)
      if (horarioExistente.estado === 1 && !horarioExistente.deleted_at) {
        console.log(`❌ Error: Ya existe un horario activo para ${turno}`);
        return res.status(400).json({
          success: false,
          message: "Ya existe un horario activo para este turno",
        });
      }
      
      // Si existe pero está inactivo o eliminado, reactivarlo en lugar de crear nuevo
      if (horarioExistente.estado === 0 || horarioExistente.deleted_at) {
        console.log(`♻️ Reactivando horario inactivo/eliminado para ${turno}`);
        const horarioReactivo = await HorariosTurnos.reactivar(turno, userId);
        
        // Actualizar los datos del horario reactivado
        await horarioReactivo.update({
          hora_inicio,
          hora_fin,
          cruza_medianoche: cruza_medianoche ? 1 : 0,
          updated_by: userId,
          updated_at: new Date(),
        });
        
        return res.status(200).json({
          success: true,
          message: "Horario de turno reactivado y actualizado exitosamente",
          data: horarioReactivo,
        });
      }
    }

    // Validación adicional: verificar consistencia de horarios
    if (!cruza_medianoche && hora_fin <= hora_inicio) {
      return res.status(400).json({
        success: false,
        message: "La hora de fin debe ser posterior a la hora de inicio cuando no cruza medianoche",
      });
    }

    // Crear nuevo horario
    const nuevoHorario = await HorariosTurnos.create({
      turno,
      hora_inicio,
      hora_fin,
      cruza_medianoche: cruza_medianoche ? 1 : 0,
      estado: 1,
      created_by: userId,
    });

    // Obtener el horario creado con relaciones
    const horarioCompleto = await HorariosTurnos.findByPk(nuevoHorario.turno, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Horario de turno creado exitosamente",
      data: horarioCompleto,
    });
  } catch (error) {
    console.error("❌ Error en createHorarioTurno:", error);
    
    // Manejar errores específicos de Sequelize
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Ya existe un horario para este turno",
      });
    }
    
    if (error.name === "SequelizeValidationError") {
      const errores = error.errors.map((e) => ({
        campo: e.path,
        mensaje: e.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errores: errores,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ==========================================
// ENDPOINT 4: ACTUALIZAR HORARIO
// ==========================================

/**
 * Actualizar un horario de turno existente
 * PUT /api/v1/horarios-turnos/:turno
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Horario actualizado
 */
export const updateHorarioTurno = async (req, res) => {
  try {
    const { turno } = req.params;
    const { id: userId } = req.user;
    const { hora_inicio, hora_fin, cruza_medianoche, estado } = req.body;

    // Verificar si el horario existe
    const horario = await HorariosTurnos.findByPk(turno);
    
    if (!horario) {
      return res.status(404).json({
        success: false,
        message: "Horario de turno no encontrado",
      });
    }

    // Validación de consistencia de horarios si se actualizan
    if (hora_inicio && hora_fin) {
      const cruza = cruza_medianoche !== undefined ? cruza_medianoche : horario.cruza_medianoche;
      
      if (!cruza && hora_fin <= hora_inicio) {
        return res.status(400).json({
          success: false,
          message: "La hora de fin debe ser posterior a la hora de inicio cuando no cruza medianoche",
        });
      }
    }

    // Preparar objeto de actualización
    const updateData = {
      updated_by: userId,
      updated_at: new Date(),
    };

    if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
    if (hora_fin !== undefined) updateData.hora_fin = hora_fin;
    if (cruza_medianoche !== undefined) updateData.cruza_medianoche = cruza_medianoche ? 1 : 0;
    if (estado !== undefined) updateData.estado = estado ? 1 : 0;

    // Actualizar horario
    await horario.update(updateData);

    // Obtener horario actualizado con relaciones
    const horarioActualizado = await HorariosTurnos.findByPk(turno, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "username", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Horario de turno actualizado exitosamente",
      data: horarioActualizado,
    });
  } catch (error) {
    console.error("❌ Error en updateHorarioTurno:", error);
    
    if (error.name === "SequelizeValidationError") {
      const errores = error.errors.map((e) => ({
        campo: e.path,
        mensaje: e.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errores: errores,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ==========================================
// ENDPOINT 5: ELIMINAR HORARIO (SOFT DELETE)
// ==========================================

/**
 * Eliminar un horario de turno (soft delete)
 * DELETE /api/v1/horarios-turnos/:turno
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const deleteHorarioTurno = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { turno } = req.params;

    console.log(`🗑️ Intentando eliminar horario: ${turno} por usuario: ${userId}`);

    const horario = await HorariosTurnos.findByPk(turno);

    if (!horario) {
      console.log(`❌ Horario no encontrado: ${turno}`);
      return res.status(404).json({
        success: false,
        message: "Horario de turno no encontrado",
      });
    }

    if (horario.estado === 0) {
      console.log(`⚠️ Horario ya está inactivo: ${turno}`);
      return res.status(400).json({
        success: false,
        message: "El horario ya está inactivo",
      });
    }

    // Primero actualizar estado y deleted_by manualmente
    console.log(`🔄 Actualizando estado y deleted_by de: ${turno}`);
    await horario.update({
      estado: 0,
      deleted_by: userId,
      updated_by: userId,
      updated_at: new Date(),
    });

    // Luego usar destroy() para que Sequelize maneje deleted_at automáticamente
    console.log(`🔄 Realizando soft delete con destroy() de: ${turno}`);
    await horario.destroy({
      force: false, // Soft delete (no eliminar permanentemente)
      individualHooks: true, // Ejecutar hooks
    });

    console.log(`✅ Horario eliminado exitosamente: ${turno}`);
    
    // Verificar que se haya guardado deleted_at
    const horarioVerificado = await HorariosTurnos.findByPk(turno, {
      paranoid: false, // Incluir eliminados
    });
    
    console.log(`📊 Verificación post-eliminación:`, {
      turno: horarioVerificado.turno,
      estado: horarioVerificado.estado,
      deleted_at: horarioVerificado.deleted_at,
      deleted_by: horarioVerificado.deleted_by,
    });

    res.status(200).json({
      success: true,
      message: "Horario de turno eliminado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en deleteHorarioTurno:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ==========================================
// ENDPOINT 6: REACTIVAR HORARIO
// ==========================================

/**
 * Reactivar un horario de turno eliminado
 * POST /api/v1/horarios-turnos/:turno/reactivar
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Horario reactivado
 */
export const reactivarHorarioTurno = async (req, res) => {
  try {
    const { turno } = req.params;
    const { id: userId } = req.user;

    // Buscar horario incluyendo eliminados
    const horario = await HorariosTurnos.findByPk(turno, {
      paranoid: false, // Incluir registros eliminados
    });
    
    if (!horario) {
      return res.status(404).json({
        success: false,
        message: "Horario de turno no encontrado",
      });
    }

    // Verificar si ya está activo
    if (horario.estado === 1 && !horario.deleted_at) {
      return res.status(400).json({
        success: false,
        message: "El horario ya está activo",
      });
    }

    // Reactivar horario
    await horario.update({
      estado: 1,
      deleted_at: null,
      deleted_by: null,
      updated_by: userId,
      updated_at: new Date(),
    });

    // Obtener horario reactivado con relaciones
    const horarioReactivado = await HorariosTurnos.findByPk(turno, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "username", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Horario de turno reactivado exitosamente",
      data: horarioReactivado,
    });
  } catch (error) {
    console.error("❌ Error en reactivarHorarioTurno:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ==========================================
// ENDPOINT 7: OBTENER HORARIO ACTIVO
// ==========================================

/**
 * Obtener el horario activo según la hora actual
 * GET /api/v1/horarios-turnos/activo
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Horario activo actual
 */
export const getHorarioActivo = async (req, res) => {
  try {
    // Obtener hora actual (permitir override para pruebas)
    const horaActual = req.query.timestamp 
      ? new Date(req.query.timestamp)
      : new Date();

    const horaString = horaActual.toTimeString().slice(0, 8); // HH:MM:SS
    
    // Obtener todos los horarios activos
    const horariosActivos = await HorariosTurnos.findAll({
      where: {
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "username", "email"],
          required: false,
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
    });

    // Encontrar el horario activo actual
    let horarioActivo = null;

    for (const horario of horariosActivos) {
      const inicio = new Date(`2000-01-01 ${horario.hora_inicio}`);
      let fin = new Date(`2000-01-01 ${horario.hora_fin}`);
      
      if (horario.cruza_medianoche) {
        // Si cruza medianoche, el fin es del día siguiente
        fin = new Date(`2000-01-02 ${horario.hora_fin}`);
      }
      
      const horaVerificar = new Date(`2000-01-01 ${horaString}`);
      
      if (horaVerificar >= inicio && horaVerificar <= fin) {
        horarioActivo = horario;
        break;
      }
    }

    if (!horarioActivo) {
      return res.status(404).json({
        success: false,
        message: "No hay horario activo en este momento",
        data: {
          hora_actual: horaString,
          horarios_disponibles: horariosActivos.map(h => ({
            turno: h.turno,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            cruza_medianoche: h.cruza_medianoche,
          })),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Horario activo obtenido exitosamente",
      data: {
        ...horarioActivo.toJSON(),
        hora_actual: horaString,
        esta_en_turno: true,
      },
    });
  } catch (error) {
    console.error("❌ Error en getHorarioActivo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Exportaciones para compatibilidad
export default {
  getAllHorariosTurnos,
  getHorarioTurnoById,
  createHorarioTurno,
  updateHorarioTurno,
  deleteHorarioTurno,
  reactivarHorarioTurno,
  getHorarioActivo,
};
