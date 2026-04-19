/**
 * ===================================================
 * CONTROLADOR: cargosController.js
 * ===================================================
 *
 * Ruta: src/controllers/cargosController.js
 *
 * Descripción:
 * Controlador para la gestión de cargos/puestos de trabajo
 * del personal de seguridad ciudadana.
 *
 * VERSIÓN: 1.0.0
 * - ✅ CRUD completo
 * - ✅ Validaciones robustas
 * - ✅ Estadísticas
 * - ✅ Soft delete
 * - ✅ Documentación JSDoc
 *
 * @module controllers/cargosController
 * @requires sequelize
 * @author Sistema de Seguridad Ciudadana
 * @version 1.0.0
 * @date 2025-12-12
 */

import { Cargo } from "../models/index.js";
import { Op } from "sequelize";

// ==========================================
// LISTAR TODOS LOS CARGOS
// ==========================================

/**
 * GET /api/v1/cargos
 * Obtiene lista de cargos con filtros y paginación
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} [req.query.categoria] - Filtrar por categoría
 * @param {boolean} [req.query.requiere_licencia] - Filtrar por licencia
 * @param {boolean} [req.query.activos] - Solo activos
 * @param {number} [req.query.page=1] - Página actual
 * @param {number} [req.query.limit=50] - Registros por página
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con array de cargos
 */
export const getAllCargos = async (req, res) => {
  try {
    const {
      categoria,
      requiere_licencia,
      activos = "true",
      page = 1,
      limit = 50,
    } = req.query;

    // Construir filtros
    const whereClause = {};

    // Filtro de activos
    if (activos === "true") {
      whereClause.estado = true;
      whereClause.deleted_at = null;
    }

    // Filtro por categoría
    if (categoria) {
      whereClause.categoria = categoria;
    }

    // Filtro por requiere_licencia
    if (requiere_licencia !== undefined) {
      whereClause.requiere_licencia = requiere_licencia === "true";
    }

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Consultar cargos
    const { count, rows: cargos } = await Cargo.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [
        ["nivel_jerarquico", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    res.json({
      success: true,
      data: {
        cargos,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error en getAllCargos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cargos",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// OBTENER CARGO POR ID
// ==========================================

/**
 * GET /api/v1/cargos/:id
 * Obtiene un cargo específico por ID
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cargo
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con datos del cargo
 */
export const getCargoById = async (req, res) => {
  try {
    const { id } = req.params;

    const cargo = await Cargo.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: "Cargo no encontrado",
      });
    }

    // Obtener cantidad de personal con este cargo
    const cantidadPersonal = await cargo.contarPersonal();

    res.json({
      success: true,
      data: {
        ...cargo.toJSON(),
        cantidad_personal: cantidadPersonal,
      },
    });
  } catch (error) {
    console.error("Error en getCargoById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cargo",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// CREAR CARGO
// ==========================================

/**
 * POST /api/v1/cargos
 * Crea un nuevo cargo
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del cargo
 * @param {string} req.body.nombre - Nombre del cargo
 * @param {string} [req.body.descripcion] - Descripción
 * @param {number} [req.body.nivel_jerarquico=5] - Nivel jerárquico
 * @param {string} [req.body.categoria=Operativo] - Categoría
 * @param {boolean} [req.body.requiere_licencia=false] - Requiere licencia
 * @param {number} [req.body.salario_base] - Salario base
 * @param {string} [req.body.codigo] - Código del cargo
 * @param {string} [req.body.color] - Color hex
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con cargo creado
 */
export const createCargo = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      nivel_jerarquico,
      categoria,
      requiere_licencia,
      salario_base,
      codigo,
      color,
    } = req.body;

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "El nombre del cargo es obligatorio",
      });
    }

    // Verificar que no exista un cargo con el mismo nombre
    const cargoExistente = await Cargo.findOne({
      where: {
        nombre: nombre.trim(),
        deleted_at: null,
      },
    });

    if (cargoExistente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un cargo con ese nombre",
      });
    }

    // Verificar código si se proporciona
    if (codigo) {
      const codigoExistente = await Cargo.findOne({
        where: {
          codigo: codigo.trim().toUpperCase(),
          deleted_at: null,
        },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un cargo con ese código",
        });
      }
    }

    // Crear el cargo
    const nuevoCargo = await Cargo.create({
      nombre,
      descripcion,
      nivel_jerarquico: nivel_jerarquico || 5,
      categoria: categoria || "Operativo",
      requiere_licencia: requiere_licencia || false,
      salario_base,
      codigo,
      color: color || "#6B7280",
      created_by: req.user?.id,
      updated_by: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Cargo creado exitosamente",
      data: nuevoCargo,
    });
  } catch (error) {
    console.error("Error en createCargo:", error);

    // Manejar errores de validación de Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear cargo",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ACTUALIZAR CARGO
// ==========================================

/**
 * PUT /api/v1/cargos/:id
 * Actualiza un cargo existente
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cargo
 * @param {Object} req.body - Datos a actualizar
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con cargo actualizado
 */
export const updateCargo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      nivel_jerarquico,
      categoria,
      requiere_licencia,
      salario_base,
      codigo,
      color,
      estado,
    } = req.body;

    // Buscar el cargo
    const cargo = await Cargo.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: "Cargo no encontrado",
      });
    }

    // Verificar nombre único si se está cambiando
    if (nombre && nombre !== cargo.nombre) {
      const nombreExistente = await Cargo.findOne({
        where: {
          nombre: nombre.trim(),
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro cargo con ese nombre",
        });
      }
    }

    // Verificar código único si se está cambiando
    if (codigo && codigo !== cargo.codigo) {
      const codigoExistente = await Cargo.findOne({
        where: {
          codigo: codigo.trim().toUpperCase(),
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro cargo con ese código",
        });
      }
    }

    // Actualizar el cargo
    await cargo.update({
      nombre: nombre || cargo.nombre,
      descripcion: descripcion !== undefined ? descripcion : cargo.descripcion,
      nivel_jerarquico: nivel_jerarquico || cargo.nivel_jerarquico,
      categoria: categoria || cargo.categoria,
      requiere_licencia:
        requiere_licencia !== undefined
          ? requiere_licencia
          : cargo.requiere_licencia,
      salario_base:
        salario_base !== undefined ? salario_base : cargo.salario_base,
      codigo: codigo !== undefined ? codigo : cargo.codigo,
      color: color || cargo.color,
      estado: estado !== undefined ? estado : cargo.estado,
      updated_by: req.user?.id,
    });

    res.json({
      success: true,
      message: "Cargo actualizado exitosamente",
      data: cargo,
    });
  } catch (error) {
    console.error("Error en updateCargo:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar cargo",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ELIMINAR CARGO (SOFT DELETE)
// ==========================================

/**
 * DELETE /api/v1/cargos/:id
 * Elimina lógicamente un cargo
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cargo
 * @param {Object} res - Response de Express
 * @returns {Object} JSON confirmando eliminación
 */
export const deleteCargo = async (req, res) => {
  try {
    const { id } = req.params;

    const cargo = await Cargo.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: "Cargo no encontrado",
      });
    }

    // Verificar si hay personal asignado a este cargo
    const cantidadPersonal = await cargo.contarPersonal();

    if (cantidadPersonal > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el cargo porque tiene ${cantidadPersonal} persona(s) asignada(s)`,
      });
    }

    // Soft delete
    await cargo.softDelete(req.user?.id);

    res.json({
      success: true,
      message: "Cargo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteCargo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar cargo",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// RESTAURAR CARGO
// ==========================================

/**
 * POST /api/v1/cargos/:id/restore
 * Restaura un cargo eliminado
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {number} req.params.id - ID del cargo
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con cargo restaurado
 */
export const restoreCargo = async (req, res) => {
  try {
    const { id } = req.params;

    const cargo = await Cargo.findOne({
      where: {
        id,
        deleted_at: { [Op.ne]: null },
      },
    });

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: "Cargo no encontrado o no está eliminado",
      });
    }

    await cargo.restore(req.user?.id);

    res.status(201).json({
      success: true,
      message: "Cargo creado exitosamente",
      data: cargo,
    });
  } catch (error) {
    console.error("Error en createCargo:", error);
    res.status(500).json({
      success: false,
      message: "Error al restaurar cargo",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ESTADÍSTICAS DE CARGOS
// ==========================================

/**
 * GET /api/v1/cargos/stats
 * Obtiene estadísticas de cargos
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con estadísticas
 */
export const getEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Cargo.getEstadisticas();

    res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error("Error en getEstadisticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// LISTAR CARGOS POR CATEGORÍA
// ==========================================

/**
 * GET /api/v1/cargos/categoria/:categoria
 * Obtiene cargos de una categoría específica
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.categoria - Categoría del cargo
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con array de cargos
 */
export const getCargosByCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;

    // Validar categoría
    const categoriasValidas = [
      "Directivo",
      "Jefatura",
      "Supervisión",
      "Operativo",
      "Administrativo",
      "Apoyo",
    ];

    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({
        success: false,
        message: "Categoría no válida",
        categorias_validas: categoriasValidas,
      });
    }

    const cargos = await Cargo.findByCategoria(categoria);

    res.json({
      success: true,
      data: cargos,
    });
  } catch (error) {
    console.error("Error en getCargosByCategoria:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cargos por categoría",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// LISTAR CARGOS QUE REQUIEREN LICENCIA
// ==========================================

/**
 * GET /api/v1/cargos/con-licencia
 * Obtiene cargos que requieren licencia de conducir
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con array de cargos
 */
export const getCargosConLicencia = async (req, res) => {
  try {
    const cargos = await Cargo.findConLicencia();

    res.json({
      success: true,
      data: cargos,
    });
  } catch (error) {
    console.error("Error en getCargosConLicencia:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cargos con licencia",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// EXPORTACIONES
// ==========================================

export default {
  getAllCargos,
  getCargoById,
  createCargo,
  updateCargo,
  deleteCargo,
  restoreCargo,
  getEstadisticas,
  getCargosByCategoria,
  getCargosConLicencia,
};
