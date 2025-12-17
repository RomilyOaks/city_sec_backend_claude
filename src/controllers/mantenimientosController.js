import sequelize from "../config/database.js";
import {
  MantenimientoVehiculo,
  Taller,
  Vehiculo,
  UnidadOficina,
} from "../models/index.js";
import { Op } from "sequelize";

const ESTADOS_INMOVILIZA = ["EN_TALLER", "EN_PROCESO"];
const ESTADOS_LIBERA = ["FINALIZADO", "CANCELADO"];

const toNumberOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const computeCostoTotal = ({ costo_total, costo_mano_obra, costo_repuestos }) => {
  const total = toNumberOrNull(costo_total);
  if (total !== null) return total;

  const mano = toNumberOrNull(costo_mano_obra);
  const rep = toNumberOrNull(costo_repuestos);

  if (mano === null && rep === null) return null;
  return (mano || 0) + (rep || 0);
};

export const getMantenimientos = async (req, res) => {
  try {
    const {
      vehiculo_id,
      estado_mantenimiento,
      taller_id,
      limit = 50,
    } = req.query;

    const where = {
      deleted_at: null,
    };

    if (vehiculo_id) where.vehiculo_id = vehiculo_id;
    if (estado_mantenimiento) where.estado_mantenimiento = estado_mantenimiento;
    if (taller_id) where.taller_id = taller_id;

    const items = await MantenimientoVehiculo.findAll({
      where,
      limit: parseInt(limit),
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "codigo_vehiculo", "placa", "estado_operativo"],
        },
        {
          model: Taller,
          as: "taller",
          attributes: ["id", "nombre", "ruc", "direccion"],
        },
        {
          model: UnidadOficina,
          as: "unidadOficina",
          attributes: ["id", "nombre", "codigo"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        total: items.length,
        mantenimientos: items,
      },
    });
  } catch (error) {
    console.error("Error en getMantenimientos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar mantenimientos",
      error: error.message,
    });
  }
};

export const getMantenimientoById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MantenimientoVehiculo.findOne({
      where: { id, deleted_at: null },
      include: [
        { model: Vehiculo, as: "vehiculo" },
        { model: Taller, as: "taller" },
        { model: UnidadOficina, as: "unidadOficina" },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error("Error en getMantenimientoById:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el mantenimiento",
      error: error.message,
    });
  }
};

export const createMantenimiento = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const payload = { ...req.body };
    const costoTotal = computeCostoTotal(payload);
    if (costoTotal !== null) payload.costo_total = costoTotal;

    const vehiculo = await Vehiculo.findOne({
      where: { id: payload.vehiculo_id, estado: 1, deleted_at: null },
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

    if (payload.taller_id) {
      const taller = await Taller.findOne({
        where: { id: payload.taller_id, estado: 1, deleted_at: null },
        transaction,
      });

      if (!taller) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Taller no encontrado o inactivo",
        });
      }
    }

    if (payload.unidad_oficina_id) {
      const unidad = await UnidadOficina.findOne({
        where: { id: payload.unidad_oficina_id, estado: true, deleted_at: null },
        transaction,
      });

      if (!unidad) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Unidad/Oficina no encontrada o inactiva",
        });
      }
    }

    const nuevo = await MantenimientoVehiculo.create(
      {
        ...payload,
        created_by: req.user?.id || null,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    if (ESTADOS_INMOVILIZA.includes(nuevo.estado_mantenimiento)) {
      await vehiculo.update(
        { estado_operativo: "MANTENIMIENTO", updated_by: req.user?.id || null },
        { transaction }
      );
    }

    await transaction.commit();

    const item = await MantenimientoVehiculo.findByPk(nuevo.id, {
      include: [
        { model: Vehiculo, as: "vehiculo" },
        { model: Taller, as: "taller" },
        { model: UnidadOficina, as: "unidadOficina" },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Mantenimiento creado exitosamente",
      data: item,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error en createMantenimiento:", error);

    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message: "Documento de mantenimiento ya existe para este vehículo",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al crear mantenimiento",
      error: error.message,
    });
  }
};

export const updateMantenimiento = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const payload = { ...req.body };
    const costoTotal = computeCostoTotal(payload);
    if (costoTotal !== null) payload.costo_total = costoTotal;

    const item = await MantenimientoVehiculo.findOne({
      where: { id, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      });
    }

    if (payload.vehiculo_id && payload.vehiculo_id !== item.vehiculo_id) {
      const vehiculo = await Vehiculo.findOne({
        where: { id: payload.vehiculo_id, estado: 1, deleted_at: null },
        transaction,
      });

      if (!vehiculo) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Vehículo no encontrado",
        });
      }
    }

    if (payload.taller_id) {
      const taller = await Taller.findOne({
        where: { id: payload.taller_id, estado: 1, deleted_at: null },
        transaction,
      });

      if (!taller) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Taller no encontrado o inactivo",
        });
      }
    }

    if (payload.unidad_oficina_id) {
      const unidad = await UnidadOficina.findOne({
        where: { id: payload.unidad_oficina_id, estado: true, deleted_at: null },
        transaction,
      });

      if (!unidad) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Unidad/Oficina no encontrada o inactiva",
        });
      }
    }

    await item.update(
      {
        ...payload,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    await transaction.commit();

    const actualizado = await MantenimientoVehiculo.findByPk(id, {
      include: [
        { model: Vehiculo, as: "vehiculo" },
        { model: Taller, as: "taller" },
        { model: UnidadOficina, as: "unidadOficina" },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Mantenimiento actualizado exitosamente",
      data: actualizado,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error en updateMantenimiento:", error);

    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message: "Documento de mantenimiento ya existe para este vehículo",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al actualizar mantenimiento",
      error: error.message,
    });
  }
};

export const deleteMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MantenimientoVehiculo.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      });
    }

    await item.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Mantenimiento eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteMantenimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar mantenimiento",
      error: error.message,
    });
  }
};

export const cambiarEstadoMantenimiento = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      estado_mantenimiento,
      observaciones,
      km_actual_al_finalizar,
      costo_mano_obra,
      costo_repuestos,
      costo_total,
    } = req.body;

    const item = await MantenimientoVehiculo.findOne({
      where: { id, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      });
    }

    const vehiculo = await Vehiculo.findOne({
      where: { id: item.vehiculo_id, estado: 1, deleted_at: null },
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

    await item.update(
      {
        estado_mantenimiento,
        observaciones: observaciones ?? item.observaciones,
        km_actual_al_finalizar:
          km_actual_al_finalizar ?? item.km_actual_al_finalizar,
        costo_mano_obra: costo_mano_obra ?? item.costo_mano_obra,
        costo_repuestos: costo_repuestos ?? item.costo_repuestos,
        costo_total:
          computeCostoTotal({
            costo_total,
            costo_mano_obra,
            costo_repuestos,
          }) ?? item.costo_total,
        updated_by: req.user?.id || null,
        fecha_inicio:
          estado_mantenimiento === "EN_TALLER" && !item.fecha_inicio
            ? new Date()
            : item.fecha_inicio,
        fecha_fin:
          estado_mantenimiento === "FINALIZADO" && !item.fecha_fin
            ? new Date()
            : item.fecha_fin,
      },
      { transaction }
    );

    if (estado_mantenimiento === "FINALIZADO") {
      const kmFinal = toNumberOrNull(km_actual_al_finalizar);
      if (kmFinal !== null) {
        const kmVeh = toNumberOrNull(vehiculo.kilometraje_actual) || 0;
        if (kmFinal < kmVeh) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message:
              "km_actual_al_finalizar no puede ser menor al kilometraje_actual del vehículo",
          });
        }

        await vehiculo.update(
          {
            kilometraje_actual: kmFinal,
            updated_by: req.user?.id || null,
          },
          { transaction }
        );
      }
    }

    if (ESTADOS_INMOVILIZA.includes(estado_mantenimiento)) {
      if (vehiculo.estado_operativo !== "MANTENIMIENTO") {
        await vehiculo.update(
          { estado_operativo: "MANTENIMIENTO", updated_by: req.user?.id || null },
          { transaction }
        );
      }
    }

    if (ESTADOS_LIBERA.includes(estado_mantenimiento)) {
      const otrosActivos = await MantenimientoVehiculo.count({
        where: {
          vehiculo_id: vehiculo.id,
          deleted_at: null,
          estado: 1,
          estado_mantenimiento: { [Op.in]: ESTADOS_INMOVILIZA },
          id: { [Op.ne]: item.id },
        },
        transaction,
      });

      if (otrosActivos === 0 && vehiculo.estado_operativo === "MANTENIMIENTO") {
        await vehiculo.update(
          { estado_operativo: "DISPONIBLE", updated_by: req.user?.id || null },
          { transaction }
        );
      }
    }

    await transaction.commit();

    const actualizado = await MantenimientoVehiculo.findByPk(id, {
      include: [
        { model: Vehiculo, as: "vehiculo" },
        { model: Taller, as: "taller" },
        { model: UnidadOficina, as: "unidadOficina" },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Estado de mantenimiento actualizado",
      data: actualizado,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error en cambiarEstadoMantenimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al cambiar estado del mantenimiento",
      error: error.message,
    });
  }
};
