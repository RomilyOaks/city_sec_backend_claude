import models from "../models/index.js";
import { formatResponse, formatErrorResponse } from "../utils/responseFormatter.js";
import logger from "../utils/logger.js";
import { calcularMetricasPeriodo } from "../services/metricasService.js";
import { generarFactura as svcGenerarFactura } from "../services/facturaService.js";
import { invalidarCacheCheckSuscripcion } from "../middlewares/checkSuscripcion.js";
import getSupabaseClient from "../config/supabaseClient.js";

const { Suscripcion, Plan, MetricasUso, Factura, DatosFacturacion } = models;

// ─── GET /billing/suscripcion ─────────────────────────────────────────────────
export const getSuscripcion = async (req, res) => {
  try {
    const sus = await Suscripcion.findOne({
      order: [["id", "DESC"]],
      include: [{ model: Plan, as: "plan" }],
    });
    if (!sus) return res.json(formatResponse(true, "Sin suscripción activa", null));
    res.json(formatResponse(true, "Suscripción obtenida", sus));
  } catch (err) {
    logger.error("getSuscripcion error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al obtener suscripción"));
  }
};

// ─── GET /billing/metricas/actual ─────────────────────────────────────────────
export const getMetricasActual = async (req, res) => {
  try {
    const sus = await Suscripcion.findOne({ order: [["id", "DESC"]] });
    if (!sus) return res.status(404).json(formatErrorResponse("Sin suscripción activa"));

    const limaAhora = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const periodo = limaAhora.toISOString().slice(0, 7); // YYYY-MM
    const metrica = await calcularMetricasPeriodo(sus.id, periodo);
    res.json(formatResponse(true, "Métricas del período actual", metrica));
  } catch (err) {
    logger.error("getMetricasActual error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al calcular métricas"));
  }
};

// ─── GET /billing/metricas/:periodo ───────────────────────────────────────────
export const getMetricasPeriodo = async (req, res) => {
  try {
    const { periodo } = req.params;
    const sus = await Suscripcion.findOne({ order: [["id", "DESC"]] });
    if (!sus) return res.status(404).json(formatErrorResponse("Sin suscripción activa"));

    const metrica = await calcularMetricasPeriodo(sus.id, periodo);
    res.json(formatResponse(true, `Métricas del período ${periodo}`, metrica));
  } catch (err) {
    logger.error("getMetricasPeriodo error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al calcular métricas del período"));
  }
};

// ─── GET /billing/facturas ────────────────────────────────────────────────────
export const getFacturas = async (req, res) => {
  try {
    const where = {};
    if (req.query.estado) where.estado = req.query.estado;
    if (req.query.periodo) where.periodo = `${req.query.periodo}-01`;

    const facturas = await Factura.findAll({
      where,
      order: [["id", "DESC"]],
      include: [
        {
          model: MetricasUso,
          as: "metrica",
          attributes: ["usuarios_activos", "novedades_creadas"],
        },
      ],
    });
    res.json(formatResponse(true, "Facturas obtenidas", facturas));
  } catch (err) {
    logger.error("getFacturas error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al obtener facturas"));
  }
};

// ─── GET /billing/facturas/:id ────────────────────────────────────────────────
export const getFactura = async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      include: [
        { model: MetricasUso, as: "metrica" },
        {
          model: Suscripcion,
          as: "suscripcion",
          include: [{ model: Plan, as: "plan" }],
        },
      ],
    });
    if (!factura) return res.status(404).json(formatErrorResponse("Factura no encontrada"));
    res.json(formatResponse(true, "Factura obtenida", factura));
  } catch (err) {
    logger.error("getFactura error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al obtener factura"));
  }
};

// ─── GET /billing/facturas/:id/pdf ────────────────────────────────────────────
export const getFacturaPdf = async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      attributes: ["pdf_url"],
    });
    if (!factura) return res.status(404).json(formatErrorResponse("Factura no encontrada"));
    if (!factura.pdf_url) return res.status(404).json(formatErrorResponse("PDF aún no generado"));

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from("facturas")
      .createSignedUrl(factura.pdf_url, 3600);

    if (error || !data?.signedUrl) {
      logger.error("getFacturaPdf: error al generar signed URL", { error: error?.message });
      return res.status(500).json(formatErrorResponse("Error al generar acceso al PDF"));
    }

    res.redirect(data.signedUrl);
  } catch (err) {
    logger.error("getFacturaPdf error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al obtener PDF"));
  }
};

// ─── POST /billing/facturas/generar ───────────────────────────────────────────
export const generarFactura = async (req, res) => {
  try {
    const sus = await Suscripcion.findOne({ order: [["id", "DESC"]] });
    if (!sus) return res.status(404).json(formatErrorResponse("Sin suscripción activa"));

    const { periodo, tipo_cambio, notas } = req.body;
    const factura = await svcGenerarFactura(sus.id, periodo, { tipo_cambio, notas });
    res.status(201).json(formatResponse(true, "Factura generada exitosamente", factura));
  } catch (err) {
    if (err.code === "FACTURA_DUPLICADA") {
      return res.status(409).json(formatErrorResponse(err.message));
    }
    logger.error("generarFactura error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al generar factura"));
  }
};

// ─── POST /billing/facturas/:id/pagar ─────────────────────────────────────────
export const registrarPago = async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json(formatErrorResponse("Factura no encontrada"));
    if (factura.estado === "pagada") {
      return res.status(400).json(formatErrorResponse("La factura ya está pagada"));
    }
    if (factura.estado === "anulada") {
      return res.status(400).json(formatErrorResponse("No se puede pagar una factura anulada"));
    }

    const limaHoy = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const fechaPago = req.body.fecha_pago || limaHoy;

    await factura.update({ estado: "pagada", fecha_pago: fechaPago });

    const sus = await Suscripcion.findByPk(factura.suscripcion_id);
    if (sus && ["gracia", "suspendida"].includes(sus.estado)) {
      await sus.update({ estado: "activa" });
    }

    invalidarCacheCheckSuscripcion();

    res.json(formatResponse(true, "Pago registrado exitosamente", {
      factura_id: factura.id,
      estado: "pagada",
      fecha_pago: fechaPago,
    }));
  } catch (err) {
    logger.error("registrarPago error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al registrar pago"));
  }
};

// ─── GET /billing/datos-facturacion ───────────────────────────────────────────
export const getDatosFacturacion = async (req, res) => {
  try {
    const datos = await DatosFacturacion.findOne();
    if (!datos) {
      return res.status(404).json(formatErrorResponse("Datos de facturación no configurados"));
    }
    res.json(formatResponse(true, "Datos de facturación obtenidos", datos));
  } catch (err) {
    logger.error("getDatosFacturacion error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al obtener datos de facturación"));
  }
};

// ─── PUT /billing/datos-facturacion ───────────────────────────────────────────
export const updateDatosFacturacion = async (req, res) => {
  try {
    const datos = await DatosFacturacion.findOne();
    if (!datos) {
      return res.status(404).json(formatErrorResponse("Datos de facturación no configurados"));
    }

    const campos = [
      "razon_social", "ruc", "direccion_fiscal", "ubigeo",
      "email_facturacion", "representante_legal", "cargo_representante",
    ];
    const update = {};
    for (const c of campos) {
      if (req.body[c] !== undefined) update[c] = req.body[c];
    }

    await datos.update(update);
    res.json(formatResponse(true, "Datos de facturación actualizados", datos));
  } catch (err) {
    logger.error("updateDatosFacturacion error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al actualizar datos de facturación"));
  }
};

// ─── GET /billing/planes ──────────────────────────────────────────────────────
export const getPlanes = async (req, res) => {
  try {
    const planes = await Plan.findAll({
      where: { activo: 1 },
      order: [["precio_base_mensual", "ASC"]],
    });
    res.json(formatResponse(true, "Planes obtenidos", planes));
  } catch (err) {
    logger.error("getPlanes error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al obtener planes"));
  }
};

// ─── PUT /billing/suscripcion/plan ────────────────────────────────────────────
export const cambiarPlan = async (req, res) => {
  try {
    const sus = await Suscripcion.findOne({ order: [["id", "DESC"]] });
    if (!sus) return res.status(404).json(formatErrorResponse("Sin suscripción activa"));
    if (sus.estado === "cancelada") {
      return res.status(400).json(formatErrorResponse("No se puede cambiar el plan de una suscripción cancelada"));
    }

    const plan = await Plan.findByPk(req.body.plan_id);
    if (!plan) return res.status(404).json(formatErrorResponse("Plan no encontrado"));
    if (!plan.activo) return res.status(400).json(formatErrorResponse("El plan seleccionado está inactivo"));

    await sus.update({ plan_id: plan.id });
    res.json(formatResponse(true, "Plan actualizado exitosamente", {
      suscripcion_id: sus.id,
      nuevo_plan: plan.nombre,
    }));
  } catch (err) {
    logger.error("cambiarPlan error", { stack: err.stack });
    res.status(500).json(formatErrorResponse("Error al cambiar plan"));
  }
};
