/**
 * ===================================================
 * CONTROLADOR: Subsectores
 * ===================================================
 *
 * Ruta: src/controllers/subsectoresController.js
 *
 * VERSION: 1.0.0
 * FECHA: 2026-02-03
 *
 * Descripcion:
 * Controlador para gestion de subsectores territoriales.
 * Los subsectores son subdivisiones de sectores que agrupan cuadrantes.
 * Jerarquia: Sector -> Subsector -> Cuadrante
 *
 * Funciones:
 * - getAllSubsectores()    - GET /subsectores
 * - getSubsectorById()     - GET /subsectores/:id
 * - getSubsectoresBySector() - GET /subsectores/sector/:sectorId
 * - createSubsector()      - POST /subsectores
 * - updateSubsector()      - PUT /subsectores/:id
 * - deleteSubsector()      - DELETE /subsectores/:id
 *
 * @module controllers/subsectoresController
 * @version 1.0.0
 * @date 2026-02-03
 */

import {
  Sector,
  Subsector,
  Cuadrante,
  Usuario,
  PersonalSeguridad,
} from "../models/index.js";
import { Op } from "sequelize";

// ==================== CONSTANTES ====================

/**
 * Include para auditoria de Subsectores
 */
const subsectorAuditInclude = [
  {
    model: Sector,
    as: "sector",
    attributes: ["id", "sector_code", "nombre", "color_mapa"],
  },
  {
    model: PersonalSeguridad,
    as: "supervisor",
    attributes: [
      "id",
      "nombres",
      "apellido_paterno",
      "apellido_materno",
      "doc_numero",
    ],
    required: false,
  },
  {
    model: Usuario,
    as: "creadorSubsector",
    attributes: ["id", "username", "email"],
    required: false,
  },
  {
    model: Usuario,
    as: "actualizadorSubsector",
    attributes: ["id", "username", "email"],
    required: false,
  },
  {
    model: Usuario,
    as: "eliminadorSubsector",
    attributes: ["id", "username", "email"],
    required: false,
  },
];

// ==================== FUNCIONES ====================

/**
 * Obtener todos los subsectores
 * @route GET /api/v1/subsectores
 */
const getAllSubsectores = async (req, res) => {
  try {
    const { sector_id, estado, search, page, limit } = req.query;

    const whereClause = {
      deleted_at: null,
    };

    if (sector_id) {
      whereClause.sector_id = sector_id;
    }

    if (estado !== undefined) {
      whereClause.estado = estado;
    }

    if (search && search.trim().length > 0) {
      whereClause[Op.or] = [
        { subsector_code: { [Op.like]: `%${search}%` } },
        { nombre: { [Op.like]: `%${search}%` } },
      ];
    }

    // Paginacion
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 15;
    const offset = (pageNumber - 1) * pageSize;

    const totalItems = await Subsector.count({ where: whereClause });

    const subsectores = await Subsector.findAll({
      where: whereClause,
      include: [
        ...subsectorAuditInclude,
        {
          model: Cuadrante,
          as: "cuadrantes",
          where: { estado: 1, deleted_at: null },
          required: false,
          attributes: ["id", "cuadrante_code", "nombre", "color_mapa"],
        },
      ],
      limit: pageSize,
      offset: offset,
      order: [["subsector_code", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        subsectores,
        pagination: {
          current_page: pageNumber,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / pageSize),
          items_per_page: pageSize,
        },
      },
    });
  } catch (error) {
    console.error("Error en getAllSubsectores:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los subsectores",
      error: error.message,
    });
  }
};

/**
 * Obtener un subsector por ID
 * @route GET /api/v1/subsectores/:id
 */
const getSubsectorById = async (req, res) => {
  try {
    const { id } = req.params;

    const subsector = await Subsector.findOne({
      where: { id, deleted_at: null },
      include: [
        ...subsectorAuditInclude,
        {
          model: Cuadrante,
          as: "cuadrantes",
          where: { estado: 1, deleted_at: null },
          required: false,
          attributes: [
            "id",
            "cuadrante_code",
            "nombre",
            "color_mapa",
            "latitud",
            "longitud",
          ],
        },
      ],
    });

    if (!subsector) {
      return res.status(404).json({
        success: false,
        message: "Subsector no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: subsector,
    });
  } catch (error) {
    console.error("Error en getSubsectorById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el subsector",
      error: error.message,
    });
  }
};

/**
 * Obtener subsectores por sector
 * @route GET /api/v1/subsectores/sector/:sectorId
 */
const getSubsectoresBySector = async (req, res) => {
  try {
    const { sectorId } = req.params;
    const { page, limit } = req.query;

    // Verificar que el sector existe
    const sector = await Sector.findOne({
      where: { id: sectorId, deleted_at: null },
    });

    if (!sector) {
      return res.status(404).json({
        success: false,
        message: "Sector no encontrado",
      });
    }

    const whereClause = {
      sector_id: sectorId,
      estado: 1,
      deleted_at: null,
    };

    // Paginacion
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 15;
    const offset = (pageNumber - 1) * pageSize;

    const totalItems = await Subsector.count({ where: whereClause });

    const subsectores = await Subsector.findAll({
      where: whereClause,
      include: [
        ...subsectorAuditInclude,
        {
          model: Cuadrante,
          as: "cuadrantes",
          where: { estado: 1, deleted_at: null },
          required: false,
          attributes: ["id", "cuadrante_code", "nombre"],
        },
      ],
      limit: pageSize,
      offset: offset,
      order: [["subsector_code", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        sector: {
          id: sector.id,
          sector_code: sector.sector_code,
          nombre: sector.nombre,
        },
        subsectores,
        pagination: {
          current_page: pageNumber,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / pageSize),
          items_per_page: pageSize,
        },
      },
    });
  } catch (error) {
    console.error("Error en getSubsectoresBySector:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los subsectores del sector",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo subsector
 * @route POST /api/v1/subsectores
 */
const createSubsector = async (req, res) => {
  try {
    const {
      subsector_code,
      nombre,
      sector_id,
      personal_supervisor_id,
      referencia,
      poligono_json,
      radio_metros,
      color_mapa,
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !sector_id) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: nombre, sector_id",
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

    // Verificar codigo duplicado si se proporciona
    if (subsector_code) {
      const codigoExistente = await Subsector.findOne({
        where: { subsector_code, deleted_at: null },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un subsector con este codigo",
        });
      }
    }

    // Determinar supervisor: usar el proporcionado o heredar del sector
    let supervisorFinal = personal_supervisor_id || sector.supervisor_id || null;

    // Verificar supervisor si hay uno definido
    if (supervisorFinal) {
      const supervisor = await PersonalSeguridad.findOne({
        where: { id: supervisorFinal, estado: 1, deleted_at: null },
      });

      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor no encontrado o inactivo",
        });
      }
    }

    // Crear subsector
    const nuevoSubsector = await Subsector.create({
      subsector_code,
      nombre,
      sector_id,
      personal_supervisor_id: supervisorFinal,
      referencia,
      poligono_json,
      radio_metros,
      color_mapa: color_mapa || "#10B981",
      created_by: req.user.id,
      updated_by: req.user.id,
    });

    // Obtener subsector completo
    const subsectorCompleto = await Subsector.findByPk(nuevoSubsector.id, {
      include: subsectorAuditInclude,
    });

    res.status(201).json({
      success: true,
      message: "Subsector creado exitosamente",
      data: subsectorCompleto,
    });
  } catch (error) {
    console.error("Error en createSubsector:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el subsector",
      error: error.message,
    });
  }
};

/**
 * Actualizar un subsector
 * @route PUT /api/v1/subsectores/:id
 */
const updateSubsector = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const subsector = await Subsector.findOne({
      where: { id, deleted_at: null },
    });

    if (!subsector) {
      return res.status(404).json({
        success: false,
        message: "Subsector no encontrado",
      });
    }

    // Verificar codigo duplicado si se esta cambiando
    if (
      datosActualizacion.subsector_code &&
      datosActualizacion.subsector_code !== subsector.subsector_code
    ) {
      const codigoExistente = await Subsector.findOne({
        where: {
          subsector_code: datosActualizacion.subsector_code,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro subsector con este codigo",
        });
      }
    }

    // Verificar sector si se esta cambiando
    if (
      datosActualizacion.sector_id &&
      datosActualizacion.sector_id !== subsector.sector_id
    ) {
      const sector = await Sector.findOne({
        where: {
          id: datosActualizacion.sector_id,
          estado: 1,
          deleted_at: null,
        },
      });

      if (!sector) {
        return res.status(404).json({
          success: false,
          message: "Sector no encontrado o inactivo",
        });
      }
    }

    // Verificar supervisor si se esta cambiando
    if (
      datosActualizacion.personal_supervisor_id &&
      datosActualizacion.personal_supervisor_id !==
        subsector.personal_supervisor_id
    ) {
      const supervisor = await PersonalSeguridad.findOne({
        where: {
          id: datosActualizacion.personal_supervisor_id,
          estado: 1,
          deleted_at: null,
        },
      });

      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor no encontrado o inactivo",
        });
      }
    }

    // Actualizar subsector
    await subsector.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    // Obtener subsector actualizado
    const subsectorActualizado = await Subsector.findByPk(id, {
      include: [
        ...subsectorAuditInclude,
        {
          model: Cuadrante,
          as: "cuadrantes",
          where: { estado: 1, deleted_at: null },
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Subsector actualizado exitosamente",
      data: subsectorActualizado,
    });
  } catch (error) {
    console.error("Error en updateSubsector:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el subsector",
      error: error.message,
    });
  }
};

/**
 * Eliminar un subsector (soft delete)
 * @route DELETE /api/v1/subsectores/:id
 */
const deleteSubsector = async (req, res) => {
  try {
    const { id } = req.params;

    const subsector = await Subsector.findOne({
      where: { id, deleted_at: null },
    });

    if (!subsector) {
      return res.status(404).json({
        success: false,
        message: "Subsector no encontrado",
      });
    }

    // Verificar si tiene cuadrantes activos
    const cuadrantesActivos = await Cuadrante.count({
      where: {
        subsector_id: id,
        estado: 1,
        deleted_at: null,
      },
    });

    if (cuadrantesActivos > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el subsector porque tiene ${cuadrantesActivos} cuadrante(s) activo(s) asociado(s)`,
      });
    }

    // Soft delete
    await subsector.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Subsector eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteSubsector:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el subsector",
      error: error.message,
    });
  }
};

export default {
  getAllSubsectores,
  getSubsectorById,
  getSubsectoresBySector,
  createSubsector,
  updateSubsector,
  deleteSubsector,
};
