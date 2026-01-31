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
    const horarioExistente = await HorariosTurnos.findByPk(turno, {
      paranoid: false // Incluir registros eliminados (soft delete)
    });
    
    if (horarioExistente) {
      // Si existe y está activo (no eliminado y estado=1)
      if (horarioExistente.estado === 1 && !horarioExistente.deleted_at) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un horario activo para este turno",
        });
      }
      
      // Si existe pero está inactivo o eliminado, reactivarlo en lugar de crear nuevo
      if (horarioExistente.estado === 0 || horarioExistente.deleted_at) {
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

    const horario = await HorariosTurnos.findByPk(turno);

    if (!horario) {
      return res.status(404).json({
        success: false,
        message: "Horario de turno no encontrado",
      });
    }

    if (horario.estado === 0) {
      return res.status(400).json({
        success: false,
        message: "El horario ya está inactivo",
      });
    }

    // Soft delete manual (sin paranoid)
    await horario.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: userId,
      updated_by: userId,
      updated_at: new Date(),
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
 * Convierte hora UTC a hora local de Perú (UTC-5)
 * @param {Date} date - Fecha en UTC
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {Object} { horaString, fechaLocal, fechaYYYYMMDD }
 */
const convertirAHoraLocal = (date, timezone = "America/Lima") => {
  try {
    // Usar Intl.DateTimeFormat para obtener la hora en la timezone especificada
    const opciones = {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat("en-GB", opciones);
    const horaString = formatter.format(date);

    // Obtener también la fecha completa para debugging
    const opcionesFecha = {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatterFecha = new Intl.DateTimeFormat("en-GB", opcionesFecha);
    const fechaLocal = formatterFecha.format(date);

    // Obtener fecha en formato YYYY-MM-DD
    const opcionesFechaSolo = {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    const formatterFechaSolo = new Intl.DateTimeFormat("en-GB", opcionesFechaSolo);
    const fechaParts = formatterFechaSolo.formatToParts(date);
    const year = fechaParts.find(part => part.type === "year").value;
    const month = fechaParts.find(part => part.type === "month").value;
    const day = fechaParts.find(part => part.type === "day").value;
    const fechaYYYYMMDD = `${year}-${month}-${day}`;

    return { horaString, fechaLocal, fechaYYYYMMDD };
  } catch (error) {
    // Fallback: Si la timezone no es válida, usar UTC-5 manualmente
    const utcOffset = -5 * 60 * 60 * 1000; // -5 horas en milisegundos
    const fechaLocal = new Date(date.getTime() + utcOffset);
    const horaString = fechaLocal.toISOString().slice(11, 19);
    const fechaYYYYMMDD = fechaLocal.toISOString().slice(0, 10);
    return { horaString, fechaLocal: fechaLocal.toISOString(), fechaYYYYMMDD };
  }
};

/**
 * Obtener el horario activo según la hora actual
 * GET /api/v1/horarios-turnos/activo
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Horario activo actual
 *
 * Query params:
 * - timestamp: ISO8601 timestamp para pruebas (opcional)
 * - timezone: Timezone IANA, default "America/Lima" (opcional)
 */
export const getHorarioActivo = async (req, res) => {
  try {
    // Timezone por defecto: Perú (UTC-5)
    const timezone = req.query.timezone || "America/Lima";

    // Obtener hora actual (permitir override para pruebas)
    const horaUTC = req.query.timestamp
      ? new Date(req.query.timestamp)
      : new Date();

    // Convertir a hora local de Perú
    const { horaString, fechaLocal, fechaYYYYMMDD } = convertirAHoraLocal(horaUTC, timezone);

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
    let fechaTurno = fechaYYYYMMDD; // Fecha actual por defecto

    for (const horario of horariosActivos) {
      const inicio = horario.hora_inicio; // "HH:MM:SS"
      const fin = horario.hora_fin; // "HH:MM:SS"

      if (horario.cruza_medianoche) {
        // Turno nocturno: 23:00 - 07:00
        // La hora actual debe ser >= inicio O < fin
        if (horaString >= inicio || horaString < fin) {
          horarioActivo = horario;
          
          // Si el turno cruza medianoche y la hora actual es < hora_inicio,
          // el turno empezó el día anterior
          if (horaString < inicio) {
            // Ajustar fecha al día anterior
            const fecha = new Date(fechaYYYYMMDD);
            fecha.setDate(fecha.getDate() - 1);
            fechaTurno = fecha.toISOString().split("T")[0];
          }
          
          break;
        }
      } else {
        // Turno normal: inicio <= hora < fin
        if (horaString >= inicio && horaString < fin) {
          horarioActivo = horario;
          break;
        }
      }
    }

    // Información de debug para entender la conversión
    const debugInfo = {
      servidor_utc: horaUTC.toISOString(),
      timezone_usada: timezone,
      hora_local_calculada: horaString,
      fecha_local_completa: fechaLocal,
    };

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
          debug: debugInfo,
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
        fecha: fechaTurno, // ← CAMPO REQUERIDO: fecha correcta del turno
        debug: debugInfo,
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
