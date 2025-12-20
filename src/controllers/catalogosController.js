/**
 * Controlador de Catálogos
 * Ruta: src/controllers/catalogosController.js
 * ============================================
 * Gestiona los catálogos maestros del sistema:
 * - Tipos y Subtipos de Novedades
 * - Estados de Novedades
 * - Tipos de Vehículos
 * - Cargos
 * - Unidades/Oficinas
 */

import {
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
  TipoVehiculo,
  Cargo,
  UnidadOficina,
  Ubigeo,
  sequelize,
} from "../models/index.js";
import { Op } from "sequelize";

// ==================== TIPOS DE NOVEDAD ====================

/**
 * Obtener todos los tipos de novedad
 * @route GET /api/catalogos/tipos-novedad
 */
const getTiposNovedad = async (req, res) => {
  try {
    const { incluir_subtipos = "true" } = req.query;

    const include =
      incluir_subtipos === "true"
        ? [
            {
              model: SubtipoNovedad,
              as: "subtipos",
              where: { estado: 1, deleted_at: null },
              required: false,
            },
          ]
        : [];

    const tipos = await TipoNovedad.findAll({
      where: { estado: 1, deleted_at: null },
      include,
      order: [
        ["orden", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: tipos,
    });
  } catch (error) {
    console.error("Error al obtener tipos de novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos de novedad",
      error: error.message,
    });
  }
};

/**
 * Crear tipo de novedad
 * @route POST /api/catalogos/tipos-novedad
 * Permisos: administrador
 */
const createTipoNovedad = async (req, res) => {
  try {
    const {
      tipo_code,
      nombre,
      descripcion,
      icono,
      color_hex,
      orden,
      requiere_unidad,
    } = req.body;

    if (!tipo_code || !nombre) {
      return res.status(400).json({
        success: false,
        message: "Código y nombre son requeridos",
      });
    }

    // Verificar código duplicado
    const existe = await TipoNovedad.findOne({
      where: { tipo_code, deleted_at: null },
    });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un tipo con este código",
      });
    }

    const nuevoTipo = await TipoNovedad.create({
      tipo_code,
      nombre,
      descripcion,
      icono,
      color_hex: color_hex || "#6B7280",
      orden: orden || 0,
      requiere_unidad: requiere_unidad !== undefined ? requiere_unidad : 1,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Tipo de novedad creado exitosamente",
      data: nuevoTipo,
    });
  } catch (error) {
    console.error("Error al crear tipo de novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear tipo de novedad",
      error: error.message,
    });
  }
};

// ==================== SUBTIPOS DE NOVEDAD ====================

/**
 * Obtener subtipos de novedad
 * @route GET /api/catalogos/subtipos-novedad
 */
const getSubtiposNovedad = async (req, res) => {
  try {
    const { tipo_id, prioridad } = req.query;

    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    if (tipo_id) {
      whereClause.tipo_novedad_id = tipo_id;
    }

    if (prioridad) {
      whereClause.prioridad = prioridad;
    }

    const subtipos = await SubtipoNovedad.findAll({
      where: whereClause,
      include: [
        {
          model: TipoNovedad,
          as: "tipo",
          attributes: ["id", "nombre", "tipo_code"],
        },
      ],
      order: [
        ["tipo_novedad_id", "ASC"],
        ["orden", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: subtipos,
    });
  } catch (error) {
    console.error("Error al obtener subtipos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener subtipos de novedad",
      error: error.message,
    });
  }
};

/**
 * Crear subtipo de novedad
 * @route POST /api/catalogos/subtipos-novedad
 * Permisos: administrador
 */
const createSubtipoNovedad = async (req, res) => {
  try {
    const {
      tipo_novedad_id,
      subtipo_code,
      nombre,
      descripcion,
      prioridad,
      tiempo_respuesta_min,
      requiere_ambulancia,
      requiere_bomberos,
      requiere_pnp,
      orden,
    } = req.body;

    if (!tipo_novedad_id || !subtipo_code || !nombre) {
      return res.status(400).json({
        success: false,
        message: "Tipo, código y nombre son requeridos",
      });
    }

    // Verificar que el tipo existe
    const tipoExiste = await TipoNovedad.findByPk(tipo_novedad_id);
    if (!tipoExiste) {
      return res.status(404).json({
        success: false,
        message: "Tipo de novedad no encontrado",
      });
    }

    // Verificar código duplicado
    const existe = await SubtipoNovedad.findOne({
      where: { subtipo_code, deleted_at: null },
    });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un subtipo con este código",
      });
    }

    const nuevoSubtipo = await SubtipoNovedad.create({
      tipo_novedad_id,
      subtipo_code,
      nombre,
      descripcion,
      prioridad: prioridad || "MEDIA",
      tiempo_respuesta_min,
      requiere_ambulancia: requiere_ambulancia || 0,
      requiere_bomberos: requiere_bomberos || 0,
      requiere_pnp: requiere_pnp || 0,
      orden: orden || 0,
      created_by: req.user.id,
    });

    const subtipoCompleto = await SubtipoNovedad.findByPk(nuevoSubtipo.id, {
      include: [{ model: TipoNovedad, as: "tipo" }],
    });

    res.status(201).json({
      success: true,
      message: "Subtipo de novedad creado exitosamente",
      data: subtipoCompleto,
    });
  } catch (error) {
    console.error("Error al crear subtipo:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear subtipo de novedad",
      error: error.message,
    });
  }
};

// ==================== ESTADOS DE NOVEDAD ====================

/**
 * Obtener estados de novedad
 * @route GET /api/catalogos/estados-novedad
 */
const getEstadosNovedad = async (req, res) => {
  try {
    const estados = await EstadoNovedad.findAll({
      where: { estado: 1, deleted_at: null },
      order: [["orden", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: estados,
    });
  } catch (error) {
    console.error("Error al obtener estados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estados de novedad",
      error: error.message,
    });
  }
};

/**
 * Crear estado de novedad
 * @route POST /api/catalogos/estados-novedad
 * Permisos: administrador
 */
const createEstadoNovedad = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      color_hex,
      icono,
      orden,
      es_inicial,
      es_final,
      requiere_unidad,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "Nombre es requerido",
      });
    }

    // Si es inicial, desactivar otros estados iniciales
    if (es_inicial) {
      await EstadoNovedad.update(
        { es_inicial: 0 },
        { where: { es_inicial: 1 } }
      );
    }

    const nuevoEstado = await EstadoNovedad.create({
      nombre,
      descripcion,
      color_hex: color_hex || "#6B7280",
      icono,
      orden: orden || 0,
      es_inicial: es_inicial || 0,
      es_final: es_final || 0,
      requiere_unidad: requiere_unidad || 0,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Estado de novedad creado exitosamente",
      data: nuevoEstado,
    });
  } catch (error) {
    console.error("Error al crear estado:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear estado de novedad",
      error: error.message,
    });
  }
};

// ==================== TIPOS DE VEHÍCULO ====================

/**
 * Obtener tipos de vehículo
 * @route GET /api/catalogos/tipos-vehiculo
 */
const getTiposVehiculo = async (req, res) => {
  try {
    const tipos = await TipoVehiculo.findAll({
      where: { estado: 1, deleted_at: null },
      order: [["nombre", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: tipos,
    });
  } catch (error) {
    console.error("Error al obtener tipos de vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos de vehículo",
      error: error.message,
    });
  }
};

/**
 * Crear tipo de vehículo
 * @route POST /api/catalogos/tipos-vehiculo
 * Permisos: administrador
 */
const createTipoVehiculo = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "Nombre es requerido",
      });
    }

    const nuevoTipo = await TipoVehiculo.create({
      nombre,
      descripcion,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Tipo de vehículo creado exitosamente",
      data: nuevoTipo,
    });
  } catch (error) {
    console.error("Error al crear tipo de vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear tipo de vehículo",
      error: error.message,
    });
  }
};

// ==================== CARGOS ====================

/**
 * Obtener cargos
 * @route GET /api/catalogos/cargos
 */
const getCargos = async (req, res) => {
  try {
    const cargos = await Cargo.findAll({
      where: { estado: 1 },
      order: [["nombre", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: cargos,
    });
  } catch (error) {
    console.error("Error al obtener cargos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cargos",
      error: error.message,
    });
  }
};

/**
 * Crear cargo
 * @route POST /api/catalogos/cargos
 * Permisos: administrador
 */
const createCargo = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "Nombre es requerido",
      });
    }

    const nuevoCargo = await Cargo.create({
      nombre,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Cargo creado exitosamente",
      data: nuevoCargo,
    });
  } catch (error) {
    console.error("Error al crear cargo:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear cargo",
      error: error.message,
    });
  }
};

// ==================== UNIDADES/OFICINAS ====================

/**
 * Obtener unidades/oficinas
 * @route GET /api/catalogos/unidades
 */
const getUnidades = async (req, res) => {
  try {
    const { tipo_unidad } = req.query;

    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    if (tipo_unidad) {
      whereClause.tipo_unidad = tipo_unidad;
    }

    const unidades = await UnidadOficina.findAll({
      where: whereClause,
      order: [["nombre", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: unidades,
    });
  } catch (error) {
    console.error("Error al obtener unidades:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener unidades",
      error: error.message,
    });
  }
};

/**
 * Crear unidad/oficina
 * @route POST /api/catalogos/unidades
 * Permisos: administrador
 */
const createUnidad = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      tipo_unidad,
      telefono,
      email,
      direccion,
      ubigeo,
      latitud,
      longitud,
      radio_cobertura_km,
      activo_24h,
      horario_inicio,
      horario_fin,
    } = req.body;

    if (!nombre || !tipo_unidad) {
      return res.status(400).json({
        success: false,
        message: "Nombre y tipo de unidad son requeridos",
      });
    }

    const nuevaUnidad = await UnidadOficina.create({
      codigo,
      nombre,
      tipo_unidad,
      telefono,
      email,
      direccion,
      ubigeo,
      latitud,
      longitud,
      radio_cobertura_km,
      activo_24h: activo_24h !== undefined ? activo_24h : 1,
      horario_inicio,
      horario_fin,
      created_by: req.user.id,
    });

    const unidadCompleta = await UnidadOficina.findByPk(nuevaUnidad.id, {
      include: [{ model: Ubigeo, as: "ubigeo_rel" }],
    });

    res.status(201).json({
      success: true,
      message: "Unidad creada exitosamente",
      data: unidadCompleta,
    });
  } catch (error) {
    console.error("Error al crear unidad:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear unidad",
      error: error.message,
    });
  }
};

// ==================== UBIGEO ====================

/**
 * Buscar ubigeos
 * @route GET /api/catalogos/ubigeo
 */
const buscarUbigeo = async (req, res) => {
  try {
    const { search, departamento, provincia } = req.query;

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { distrito: { [Op.like]: `%${search}%` } },
        { provincia: { [Op.like]: `%${search}%` } },
        { departamento: { [Op.like]: `%${search}%` } },
      ];
    }

    if (departamento) {
      whereClause.departamento = departamento;
    }

    if (provincia) {
      whereClause.provincia = provincia;
    }

    const ubigeos = await Ubigeo.findAll({
      where: whereClause,
      limit: 50,
      order: [
        ["departamento", "ASC"],
        ["provincia", "ASC"],
        ["distrito", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: ubigeos,
    });
  } catch (error) {
    console.error("Error al buscar ubigeo:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar ubigeo",
      error: error.message,
    });
  }
};

/**
 * Obtener departamentos únicos
 * @route GET /api/catalogos/departamentos
 */
const getDepartamentos = async (req, res) => {
  try {
    //  import { sequelize } from "../models/index.js";

    const departamentos = await Ubigeo.findAll({
      attributes: [
        [
          sequelize.fn("DISTINCT", sequelize.col("departamento")),
          "departamento",
        ],
      ],
      order: [["departamento", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: departamentos.map((d) => d.departamento),
    });
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener departamentos",
      error: error.message,
    });
  }
};

export default {
  getTiposNovedad,
  createTipoNovedad,
  getSubtiposNovedad,
  createSubtipoNovedad,
  getEstadosNovedad,
  createEstadoNovedad,
  getTiposVehiculo,
  createTipoVehiculo,
  getCargos,
  createCargo,
  getUnidades,
  createUnidad,
  buscarUbigeo,
  getDepartamentos,
};
