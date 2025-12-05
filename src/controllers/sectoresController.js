/**
 * sectoresController.js
 * Controlador de Sectores y Cuadrantes
 * Gestiona la división territorial para patrullaje
 */

const { Sector, Cuadrante, Ubigeo } = require("../models");
const { Op } = require("sequelize");

// ==================== SECTORES ====================

/**
 * Obtener todos los sectores
 * Permisos: todos los usuarios autenticados
 * @route GET /api/sectores
 */
exports.getAllSectores = async (req, res) => {
  try {
    const { estado, zona_code } = req.query;

    const whereClause = {
      deleted_at: null,
    };

    if (estado !== undefined) {
      whereClause.estado = estado;
    }

    if (zona_code) {
      whereClause.zona_code = zona_code;
    }

    const sectores = await Sector.findAll({
      where: whereClause,
      include: [
        {
          model: Ubigeo,
          as: "ubigeo_rel",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
        {
          model: Cuadrante,
          as: "cuadrantes",
          where: { estado: 1, deleted_at: null },
          required: false, // LEFT JOIN para incluir sectores sin cuadrantes
        },
      ],
      order: [["sector_code", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: sectores,
    });
  } catch (error) {
    console.error("Error al obtener sectores:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los sectores",
      error: error.message,
    });
  }
};

/**
 * Obtener un sector por ID
 * Permisos: todos los usuarios autenticados
 * @route GET /api/sectores/:id
 */
exports.getSectorById = async (req, res) => {
  try {
    const { id } = req.params;

    const sector = await Sector.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: Ubigeo,
          as: "ubigeo_rel",
        },
        {
          model: Cuadrante,
          as: "cuadrantes",
          where: { estado: 1, deleted_at: null },
          required: false,
        },
      ],
    });

    if (!sector) {
      return res.status(404).json({
        success: false,
        message: "Sector no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: sector,
    });
  } catch (error) {
    console.error("Error al obtener sector:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el sector",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo sector
 * Permisos: supervisor, administrador
 * @route POST /api/sectores
 */
exports.createSector = async (req, res) => {
  try {
    const {
      sector_code,
      nombre,
      descripcion,
      ubigeo,
      zona_code,
      poligono_json,
      color_mapa,
    } = req.body;

    // Validar campos requeridos
    if (!sector_code || !nombre) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: sector_code, nombre",
      });
    }

    // Verificar si el código ya existe
    const sectorExistente = await Sector.findOne({
      where: { sector_code, deleted_at: null },
    });

    if (sectorExistente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un sector con este código",
      });
    }

    // Crear sector
    const nuevoSector = await Sector.create({
      sector_code,
      nombre,
      descripcion,
      ubigeo,
      zona_code,
      poligono_json,
      color_mapa: color_mapa || "#3B82F6",
      created_by: req.user.id,
    });

    // Obtener sector completo
    const sectorCompleto = await Sector.findByPk(nuevoSector.id, {
      include: [{ model: Ubigeo, as: "ubigeo_rel" }],
    });

    res.status(201).json({
      success: true,
      message: "Sector creado exitosamente",
      data: sectorCompleto,
    });
  } catch (error) {
    console.error("Error al crear sector:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el sector",
      error: error.message,
    });
  }
};

/**
 * Actualizar un sector
 * Permisos: supervisor, administrador
 * @route PUT /api/sectores/:id
 */
exports.updateSector = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const sector = await Sector.findOne({
      where: { id, deleted_at: null },
    });

    if (!sector) {
      return res.status(404).json({
        success: false,
        message: "Sector no encontrado",
      });
    }

    // Verificar código duplicado si se está cambiando
    if (
      datosActualizacion.sector_code &&
      datosActualizacion.sector_code !== sector.sector_code
    ) {
      const codigoExistente = await Sector.findOne({
        where: {
          sector_code: datosActualizacion.sector_code,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro sector con este código",
        });
      }
    }

    // Actualizar sector
    await sector.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    // Obtener sector actualizado
    const sectorActualizado = await Sector.findByPk(id, {
      include: [
        { model: Ubigeo, as: "ubigeo_rel" },
        { model: Cuadrante, as: "cuadrantes" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Sector actualizado exitosamente",
      data: sectorActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar sector:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el sector",
      error: error.message,
    });
  }
};

/**
 * Eliminar un sector (soft delete)
 * Permisos: administrador
 * @route DELETE /api/sectores/:id
 */
exports.deleteSector = async (req, res) => {
  try {
    const { id } = req.params;

    const sector = await Sector.findOne({
      where: { id, deleted_at: null },
    });

    if (!sector) {
      return res.status(404).json({
        success: false,
        message: "Sector no encontrado",
      });
    }

    // Verificar si tiene cuadrantes activos
    const cuadrantesActivos = await Cuadrante.count({
      where: {
        sector_id: id,
        estado: 1,
        deleted_at: null,
      },
    });

    if (cuadrantesActivos > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar el sector porque tiene cuadrantes activos asociados",
      });
    }

    // Soft delete
    await sector.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Sector eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar sector:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el sector",
      error: error.message,
    });
  }
};

// ==================== CUADRANTES ====================

/**
 * Obtener todos los cuadrantes
 * Permisos: todos los usuarios autenticados
 * @route GET /api/cuadrantes
 */
exports.getAllCuadrantes = async (req, res) => {
  try {
    const { sector_id, estado } = req.query;

    const whereClause = {
      deleted_at: null,
    };

    if (sector_id) {
      whereClause.sector_id = sector_id;
    }

    if (estado !== undefined) {
      whereClause.estado = estado;
    }

    const cuadrantes = await Cuadrante.findAll({
      where: whereClause,
      include: [
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "sector_code", "nombre"],
        },
      ],
      order: [["cuadrante_code", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: cuadrantes,
    });
  } catch (error) {
    console.error("Error al obtener cuadrantes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los cuadrantes",
      error: error.message,
    });
  }
};

/**
 * Obtener un cuadrante por ID
 * Permisos: todos los usuarios autenticados
 * @route GET /api/cuadrantes/:id
 */
exports.getCuadranteById = async (req, res) => {
  try {
    const { id } = req.params;

    const cuadrante = await Cuadrante.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: Sector,
          as: "sector",
        },
      ],
    });

    if (!cuadrante) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: cuadrante,
    });
  } catch (error) {
    console.error("Error al obtener cuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el cuadrante",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo cuadrante
 * Permisos: supervisor, administrador
 * @route POST /api/cuadrantes
 */
exports.createCuadrante = async (req, res) => {
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

    // Validar campos requeridos
    if (!cuadrante_code || !nombre || !sector_id) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: cuadrante_code, nombre, sector_id",
      });
    }

    // Verificar si el código ya existe
    const cuadranteExistente = await Cuadrante.findOne({
      where: { cuadrante_code, deleted_at: null },
    });

    if (cuadranteExistente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un cuadrante con este código",
      });
    }

    // Verificar que el sector existe
    const sector = await Sector.findOne({
      where: { id: sector_id, estado: 1, deleted_at: null },
    });

    if (!sector) {
      return res.status(404).json({
        success: false,
        message: "Sector no encontrado o inactivo",
      });
    }

    // Crear cuadrante
    const nuevoCuadrante = await Cuadrante.create({
      cuadrante_code,
      nombre,
      sector_id,
      zona_code,
      latitud,
      longitud,
      poligono_json,
      radio_metros,
      color_mapa: color_mapa || "#10B981",
      created_by: req.user.id,
    });

    // Obtener cuadrante completo
    const cuadranteCompleto = await Cuadrante.findByPk(nuevoCuadrante.id, {
      include: [{ model: Sector, as: "sector" }],
    });

    res.status(201).json({
      success: true,
      message: "Cuadrante creado exitosamente",
      data: cuadranteCompleto,
    });
  } catch (error) {
    console.error("Error al crear cuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el cuadrante",
      error: error.message,
    });
  }
};

/**
 * Actualizar un cuadrante
 * Permisos: supervisor, administrador
 * @route PUT /api/cuadrantes/:id
 */
exports.updateCuadrante = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const cuadrante = await Cuadrante.findOne({
      where: { id, deleted_at: null },
    });

    if (!cuadrante) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado",
      });
    }

    // Verificar código duplicado si se está cambiando
    if (
      datosActualizacion.cuadrante_code &&
      datosActualizacion.cuadrante_code !== cuadrante.cuadrante_code
    ) {
      const codigoExistente = await Cuadrante.findOne({
        where: {
          cuadrante_code: datosActualizacion.cuadrante_code,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro cuadrante con este código",
        });
      }
    }

    // Actualizar cuadrante
    await cuadrante.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    // Obtener cuadrante actualizado
    const cuadranteActualizado = await Cuadrante.findByPk(id, {
      include: [{ model: Sector, as: "sector" }],
    });

    res.status(200).json({
      success: true,
      message: "Cuadrante actualizado exitosamente",
      data: cuadranteActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar cuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el cuadrante",
      error: error.message,
    });
  }
};

/**
 * Eliminar un cuadrante (soft delete)
 * Permisos: administrador
 * @route DELETE /api/cuadrantes/:id
 */
exports.deleteCuadrante = async (req, res) => {
  try {
    const { id } = req.params;

    const cuadrante = await Cuadrante.findOne({
      where: { id, deleted_at: null },
    });

    if (!cuadrante) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante no encontrado",
      });
    }

    // Soft delete
    await cuadrante.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Cuadrante eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar cuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el cuadrante",
      error: error.message,
    });
  }
};

module.exports = exports;
