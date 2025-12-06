/**
 * Ruta: src/controllers/cuadrantesController.js
 *
 * Descripción:
 * Controlador para la gestión de cuadrantes del sistema de seguridad ciudadana.
 * Los cuadrantes son subdivisiones de sectores que permiten un control territorial
 * más granular para patrullaje y asignación de recursos.
 *
 * Funcionalidades:
 * - CRUD completo de cuadrantes
 * - Búsqueda por sector
 * - Búsqueda por código único
 * - Búsqueda geoespacial (cuadrantes cercanos)
 * - Estadísticas por sector
 * - Activar/desactivar cuadrantes
 * - Validación de datos de entrada
 *
 * Endpoints:
 * - GET    /api/v1/cuadrantes           - Listar todos
 * - GET    /api/v1/cuadrantes/:id       - Obtener por ID
 * - GET    /api/v1/cuadrantes/sector/:sectorId - Por sector
 * - GET    /api/v1/cuadrantes/codigo/:code - Por código
 * - GET    /api/v1/cuadrantes/cercanos   - Búsqueda geoespacial
 * - POST   /api/v1/cuadrantes           - Crear nuevo
 * - PUT    /api/v1/cuadrantes/:id       - Actualizar
 * - DELETE /api/v1/cuadrantes/:id       - Eliminar (soft delete)
 * - PATCH  /api/v1/cuadrantes/:id/estado - Activar/desactivar
 *
 * @module controllers/cuadrantesController
 * @requires models/Cuadrante
 * @requires models/Sector
 */

import { Cuadrante, Sector } from "../models/index.js";
import { Op } from "sequelize";

/**
 * GET /api/v1/cuadrantes
 * Obtener lista de cuadrantes con paginación y filtros
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.page - Número de página (default: 1)
 * @param {number} req.query.limit - Items por página (default: 10)
 * @param {number} req.query.sector_id - Filtrar por sector
 * @param {boolean} req.query.activos - Solo activos (default: true)
 * @param {string} req.query.search - Búsqueda por nombre o código
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con lista paginada de cuadrantes
 */
export const getCuadrantes = async (req, res) => {
  try {
    // Extraer parámetros de query con valores por defecto
    const {
      page = 1,
      limit = 10,
      sector_id,
      activos = "true",
      search,
    } = req.query;

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir condiciones WHERE dinámicamente
    const whereConditions = {
      deleted_at: null, // Solo cuadrantes no eliminados
    };

    // Filtro por sector si se especifica
    if (sector_id) {
      whereConditions.sector_id = parseInt(sector_id);
    }

    // Filtro por estado activo/inactivo
    if (activos === "true") {
      whereConditions.estado = true;
    }

    // Filtro de búsqueda por nombre o código
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { cuadrante_code: { [Op.like]: `%${search}%` } },
      ];
    }

    // Ejecutar consulta con paginación
    const { count, rows: cuadrantes } = await Cuadrante.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre", "sector_code"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["cuadrante_code", "ASC"]],
      distinct: true, // Para contar correctamente con JOINs
    });

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(count / parseInt(limit));

    // Respuesta exitosa
    res.json({
      success: true,
      data: {
        cuadrantes,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error en getCuadrantes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cuadrantes",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/cuadrantes/:id
 * Obtener un cuadrante específico por ID con sus relaciones
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cuadrante
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con datos del cuadrante
 */
export const getCuadranteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar cuadrante con sus relaciones
    const cuadrante = await Cuadrante.findByPk(id, {
      include: [
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre", "sector_code", "zona_code"],
        },
      ],
    });

    // Validar si existe
    if (!cuadrante || cuadrante.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado",
      });
    }

    // Respuesta exitosa
    res.json({
      success: true,
      data: cuadrante,
    });
  } catch (error) {
    console.error("Error en getCuadranteById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cuadrante",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/cuadrantes/sector/:sectorId
 * Obtener cuadrantes de un sector específico
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.sectorId - ID del sector
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con cuadrantes del sector
 */
export const getCuadrantesBySector = async (req, res) => {
  try {
    const { sectorId } = req.params;

    // Verificar que el sector existe
    const sector = await Sector.findByPk(sectorId);

    if (!sector || sector.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Sector no encontrado",
      });
    }

    // Obtener cuadrantes del sector usando método estático del modelo
    const cuadrantes = await Cuadrante.findBySector(sectorId);

    // Respuesta exitosa
    res.json({
      success: true,
      data: {
        sector: {
          id: sector.id,
          nombre: sector.nombre,
          sector_code: sector.sector_code,
        },
        cuadrantes,
        total: cuadrantes.length,
      },
    });
  } catch (error) {
    console.error("Error en getCuadrantesBySector:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cuadrantes del sector",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/cuadrantes/codigo/:code
 * Buscar cuadrante por su código único
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.code - Código del cuadrante
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con datos del cuadrante
 */
export const getCuadranteByCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Buscar usando método estático del modelo
    const cuadrante = await Cuadrante.findByCode(code);

    if (!cuadrante) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado con ese código",
      });
    }

    res.json({
      success: true,
      data: cuadrante,
    });
  } catch (error) {
    console.error("Error en getCuadranteByCode:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar cuadrante",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/cuadrantes/cercanos
 * Buscar cuadrantes cercanos a una ubicación (búsqueda geoespacial)
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.lat - Latitud central
 * @param {number} req.query.lng - Longitud central
 * @param {number} req.query.radius - Radio en kilómetros (default: 5)
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con cuadrantes cercanos
 */
export const getCuadrantesCercanos = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    // Validar parámetros requeridos
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Se requieren los parámetros lat y lng",
      });
    }

    // Convertir a números y validar
    const latitud = parseFloat(lat);
    const longitud = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitud) || isNaN(longitud) || isNaN(radiusKm)) {
      return res.status(400).json({
        success: false,
        message: "Los parámetros deben ser números válidos",
      });
    }

    // Validar rangos
    if (latitud < -90 || latitud > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitud debe estar entre -90 y 90",
      });
    }

    if (longitud < -180 || longitud > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitud debe estar entre -180 y 180",
      });
    }

    // Buscar cuadrantes cercanos usando método del modelo
    const cuadrantes = await Cuadrante.findNearby(latitud, longitud, radiusKm);

    res.json({
      success: true,
      data: {
        ubicacion: { latitud, longitud },
        radio_km: radiusKm,
        cuadrantes,
        total: cuadrantes.length,
      },
    });
  } catch (error) {
    console.error("Error en getCuadrantesCercanos:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar cuadrantes cercanos",
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/cuadrantes
 * Crear un nuevo cuadrante
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del cuadrante
 * @param {Object} req.usuario - Usuario autenticado (del middleware)
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con cuadrante creado
 */
export const createCuadrante = async (req, res) => {
  try {
    const {
      cuadrante_code,
      nombre,
      sector_id,
      zona_code,
      latitud,
      longitud,
      poligono_json,
      radio_metros,
      color_mapa,
    } = req.body;

    const created_by = req.usuario.userId;

    // Validar campos requeridos
    if (!nombre || !sector_id) {
      return res.status(400).json({
        success: false,
        message: "Nombre y sector_id son requeridos",
      });
    }

    // Verificar que el sector existe
    const sector = await Sector.findByPk(sector_id);

    if (!sector || sector.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "El sector especificado no existe",
      });
    }

    // Si se proporciona código, verificar que no exista
    if (cuadrante_code) {
      const existente = await Cuadrante.findOne({
        where: { cuadrante_code: cuadrante_code.toUpperCase() },
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un cuadrante con ese código",
        });
      }
    }

    // Crear el cuadrante
    const nuevoCuadrante = await Cuadrante.create({
      cuadrante_code,
      nombre,
      sector_id,
      zona_code,
      latitud,
      longitud,
      poligono_json,
      radio_metros,
      color_mapa,
      created_by,
    });

    // Recargar con relaciones
    const cuadranteCreado = await Cuadrante.findByPk(nuevoCuadrante.id, {
      include: [
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre", "sector_code"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Cuadrante creado exitosamente",
      data: cuadranteCreado,
    });
  } catch (error) {
    console.error("Error en createCuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear cuadrante",
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/cuadrantes/:id
 * Actualizar un cuadrante existente
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cuadrante
 * @param {Object} req.body - Datos a actualizar
 * @param {Object} req.usuario - Usuario autenticado
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con cuadrante actualizado
 */
export const updateCuadrante = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      zona_code,
      latitud,
      longitud,
      poligono_json,
      radio_metros,
      color_mapa,
    } = req.body;

    const updated_by = req.usuario.userId;

    // Buscar cuadrante
    const cuadrante = await Cuadrante.findByPk(id);

    if (!cuadrante || cuadrante.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado",
      });
    }

    // Preparar datos a actualizar
    const datosActualizar = { updated_by };

    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (zona_code !== undefined) datosActualizar.zona_code = zona_code;
    if (latitud !== undefined) datosActualizar.latitud = latitud;
    if (longitud !== undefined) datosActualizar.longitud = longitud;
    if (poligono_json !== undefined)
      datosActualizar.poligono_json = poligono_json;
    if (radio_metros !== undefined) datosActualizar.radio_metros = radio_metros;
    if (color_mapa !== undefined) datosActualizar.color_mapa = color_mapa;

    // Actualizar
    await cuadrante.update(datosActualizar);

    // Recargar con relaciones
    const cuadranteActualizado = await Cuadrante.findByPk(id, {
      include: [
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre", "sector_code"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Cuadrante actualizado exitosamente",
      data: cuadranteActualizado,
    });
  } catch (error) {
    console.error("Error en updateCuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar cuadrante",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/v1/cuadrantes/:id
 * Eliminar un cuadrante (soft delete)
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cuadrante
 * @param {Object} req.usuario - Usuario autenticado
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con confirmación
 */
export const deleteCuadrante = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.usuario.userId;

    // Buscar cuadrante
    const cuadrante = await Cuadrante.findByPk(id);

    if (!cuadrante || cuadrante.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado",
      });
    }

    // Soft delete usando método del modelo
    await cuadrante.softDelete(deleted_by);

    res.json({
      success: true,
      message: "Cuadrante eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteCuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar cuadrante",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/v1/cuadrantes/:id/estado
 * Activar o desactivar un cuadrante
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cuadrante
 * @param {Object} req.body - Datos
 * @param {boolean} req.body.estado - true para activar, false para desactivar
 * @param {Object} req.usuario - Usuario autenticado
 * @param {Object} res - Response de Express
 *
 * @returns {Object} JSON con cuadrante actualizado
 */
export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const updated_by = req.usuario.userId;

    // Validar parámetro estado
    if (typeof estado !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "El parámetro estado debe ser true o false",
      });
    }

    // Buscar cuadrante
    const cuadrante = await Cuadrante.findByPk(id);

    if (!cuadrante || cuadrante.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado",
      });
    }

    // Actualizar estado
    cuadrante.estado = estado;
    cuadrante.updated_by = updated_by;
    await cuadrante.save();

    res.json({
      success: true,
      message: `Cuadrante ${estado ? "activado" : "desactivado"} exitosamente`,
      data: {
        id: cuadrante.id,
        cuadrante_code: cuadrante.cuadrante_code,
        nombre: cuadrante.nombre,
        estado: cuadrante.estado,
      },
    });
  } catch (error) {
    console.error("Error en cambiarEstado:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado del cuadrante",
      error: error.message,
    });
  }
};

// Exportar todas las funciones como objeto por defecto
export default {
  getCuadrantes,
  getCuadranteById,
  getCuadrantesBySector,
  getCuadranteByCode,
  getCuadrantesCercanos,
  createCuadrante,
  updateCuadrante,
  deleteCuadrante,
  cambiarEstado,
};
