/**
 * ===================================================
 * CONTROLADOR: Abastecimientos de Combustible
 * ===================================================
 *
 * Ruta: src/controllers/abastecimientosController.js
 *
 * Descripción:
 * Controlador para gestionar los abastecimientos de combustible.
 * Implementa:
 * - Listado con filtros
 * - Obtención por ID
 * - Creación
 * - Actualización
 * - Eliminación lógica (soft delete)
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-17
 *
 * Nota de diseño:
 * - La BD exige `personal_id` NOT NULL. En el flujo del sistema, este campo
 *   debe representar al personal (sereno/operador) que hizo el abastecimiento.
 * - `authMiddleware` incluye `personal_seguridad_id` dentro de `req.user`.
 *   Por ello, si el cliente no envía `personal_id`, el controlador utilizará
 *   `req.user.personal_seguridad_id` como valor por defecto.
 *
 * @module controllers/abastecimientosController
 * @requires sequelize
 */

import { AbastecimientoCombustible, Vehiculo, PersonalSeguridad } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * GET /api/v1/abastecimientos
 * Listar abastecimientos con filtros
 */
export const getAbastecimientos = async (req, res) => {
  try {
    const {
      vehiculo_id,
      personal_id,
      fecha_inicio,
      fecha_fin,
      limit = 50,
    } = req.query;

    // Construcción del WHERE de forma incremental (lectura clara)
    const where = {
      deleted_at: null, // Soft delete
    };

    if (vehiculo_id) where.vehiculo_id = vehiculo_id;
    if (personal_id) where.personal_id = personal_id;

    // Filtro por rango de fechas
    if (fecha_inicio || fecha_fin) {
      where.fecha_hora = {};
      if (fecha_inicio) where.fecha_hora[Op.gte] = new Date(fecha_inicio);
      if (fecha_fin) where.fecha_hora[Op.lte] = new Date(fecha_fin);
    }

    const abastecimientos = await AbastecimientoCombustible.findAll({
      where,
      limit: parseInt(limit),
      order: [["fecha_hora", "DESC"]],
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "codigo_vehiculo", "placa"],
        },
        {
          model: PersonalSeguridad,
          as: "personal",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        total: abastecimientos.length,
        abastecimientos,
      },
    });
  } catch (error) {
    console.error("Error en getAbastecimientos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar abastecimientos",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/abastecimientos/:id
 * Obtener un abastecimiento por ID
 */
export const getAbastecimientoById = async (req, res) => {
  try {
    const { id } = req.params;

    const abastecimiento = await AbastecimientoCombustible.findOne({
      where: { id, deleted_at: null },
      include: [
        { model: Vehiculo, as: "vehiculo" },
        { model: PersonalSeguridad, as: "personal" },
      ],
    });

    if (!abastecimiento) {
      return res.status(404).json({
        success: false,
        message: "Abastecimiento no encontrado",
      });
    }

    return res.status(200).json({ success: true, data: abastecimiento });
  } catch (error) {
    console.error("Error en getAbastecimientoById:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el abastecimiento",
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/abastecimientos
 * Crear abastecimiento
 */
export const createAbastecimiento = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      vehiculo_id,
      personal_id,
      fecha_hora,
      tipo_combustible,
      km_actual,
      cantidad,
      cantidad_galones,
      unidad,
      precio_unitario,
      precio_galon,
      importe_total,
      grifo_nombre,
      grifo,
      grifo_ruc,
      factura_boleta,
      moneda,
      observaciones,
      comprobante_adjunto,
    } = req.body;

    // 1) Validar existencia de vehículo activo (soft delete)
    const vehiculo = await Vehiculo.findOne({
      where: { id: vehiculo_id, estado: 1, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!vehiculo) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // 2) Resolver personal_id
    // Regla:
    // - Si viene en body, se usa.
    // - Si no, se usa req.user.personal_seguridad_id (inyectado por authMiddleware).
    let personalIdFinal = personal_id || req.user?.personal_seguridad_id || null;

    if (!personalIdFinal) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "No se pudo determinar el personal_id. Asigne personal_seguridad_id al usuario autenticado o envíe personal_id en el request.",
      });
    }

    // 3) Validar que el personal exista y esté activo
    const personal = await PersonalSeguridad.findOne({
      where: { id: personalIdFinal, estado: 1, deleted_at: null },
      transaction,
    });

    if (!personal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado o inactivo",
      });
    }

    // 4) Normalizar payload a columnas reales de BD
    // Compatibilidad con endpoint legacy:
    // - cantidad_galones -> cantidad + unidad=GALONES
    // - precio_galon -> precio_unitario
    // - grifo -> grifo_nombre
    const cantidadFinal = cantidad ?? cantidad_galones;
    const unidadFinal = unidad ?? (cantidad_galones ? "GALONES" : "LITROS");
    const precioFinal = precio_unitario ?? precio_galon ?? 0;
    const grifoNombreFinal = grifo_nombre ?? grifo;

    // Cálculo del total (si no viene)
    const importeTotalFinal =
      importe_total ?? parseFloat(cantidadFinal) * parseFloat(precioFinal);

    // 5) Actualizar kilometraje del vehículo si corresponde
    // Nota: se actualiza solo si el nuevo KM es mayor al actual.
    if (
      km_actual !== undefined &&
      km_actual !== null &&
      vehiculo.kilometraje_actual !== null &&
      parseFloat(km_actual) > parseFloat(vehiculo.kilometraje_actual)
    ) {
      await vehiculo.update(
        {
          kilometraje_actual: km_actual,
          updated_by: req.user?.id,
        },
        { transaction }
      );
    }

    // 6) Crear registro de abastecimiento
    const abastecimiento = await AbastecimientoCombustible.create(
      {
        vehiculo_id,
        personal_id: personalIdFinal,
        fecha_hora,
        tipo_combustible,
        km_actual,
        cantidad: cantidadFinal,
        unidad: unidadFinal,
        precio_unitario: precioFinal,
        importe_total: importeTotalFinal,
        grifo_nombre: grifoNombreFinal,
        grifo_ruc: grifo_ruc || null,
        factura_boleta: factura_boleta || null,
        moneda: moneda || "PEN",
        observaciones: observaciones || null,
        comprobante_adjunto: comprobante_adjunto || null,
        estado: 1,
        created_by: req.user?.id || null,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Abastecimiento registrado exitosamente",
      data: abastecimiento,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error en createAbastecimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar abastecimiento",
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/abastecimientos/:id
 * Actualizar abastecimiento
 *
 * Nota:
 * - Por trazabilidad, usualmente se edita solo información complementaria
 *   (comprobante, observaciones, factura).
 */
export const updateAbastecimiento = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const abastecimiento = await AbastecimientoCombustible.findOne({
      where: { id, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!abastecimiento) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Abastecimiento no encontrado",
      });
    }

    const {
      grifo_nombre,
      grifo,
      grifo_ruc,
      factura_boleta,
      observaciones,
      comprobante_adjunto,
      estado,
    } = req.body;

    await abastecimiento.update(
      {
        grifo_nombre: grifo_nombre ?? grifo ?? abastecimiento.grifo_nombre,
        grifo_ruc: grifo_ruc ?? abastecimiento.grifo_ruc,
        factura_boleta: factura_boleta ?? abastecimiento.factura_boleta,
        observaciones: observaciones ?? abastecimiento.observaciones,
        comprobante_adjunto:
          comprobante_adjunto ?? abastecimiento.comprobante_adjunto,
        estado: estado ?? abastecimiento.estado,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Abastecimiento actualizado",
      data: abastecimiento,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error en updateAbastecimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar abastecimiento",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/v1/abastecimientos/:id
 * Soft delete
 */
export const deleteAbastecimiento = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const abastecimiento = await AbastecimientoCombustible.findOne({
      where: { id, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!abastecimiento) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Abastecimiento no encontrado",
      });
    }

    await abastecimiento.update(
      {
        deleted_at: new Date(),
        deleted_by: req.user?.id || null,
        estado: 0,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Abastecimiento eliminado (soft delete)",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error en deleteAbastecimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar abastecimiento",
      error: error.message,
    });
  }
};
