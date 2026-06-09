import { Op } from "sequelize";
import models from "../models/index.js";
import { calcularMetricasPeriodo } from "./metricasService.js";
import getSupabaseClient from "../config/supabaseClient.js";
import logger from "../utils/logger.js";

const { Suscripcion, Plan, Factura, DatosFacturacion } = models;

const SERIE = process.env.FACTURA_SERIE || "F001";
const IGV = parseFloat(process.env.IGV_PORCENTAJE || "18") / 100;
const DIAS_VENCIMIENTO = parseInt(process.env.FACTURA_DIAS_VENCIMIENTO || "30", 10);

async function siguienteNumeroFactura() {
  const ultima = await Factura.findOne({
    attributes: ["numero_factura"],
    where: { numero_factura: { [Op.like]: `${SERIE}-%` } },
    order: [["id", "DESC"]],
  });
  if (!ultima) return `${SERIE}-00001`;
  const n = parseInt(ultima.numero_factura.split("-")[1], 10) + 1;
  return `${SERIE}-${String(n).padStart(5, "0")}`;
}

function limaDate(offsetDays = 0) {
  const lima = new Date(Date.now() - 5 * 60 * 60 * 1000);
  lima.setUTCDate(lima.getUTCDate() + offsetDays);
  return lima.toISOString().slice(0, 10);
}

// ─── PLACEHOLDER PDF ──────────────────────────────────────────────────────────
// TODO (SPEC-BILLING-001 PDF): implementar con pdfkit.
// Diseño en sección 9 del spec: logo, datos emisor/cliente, tabla de conceptos,
// subtotal, IGV, total, datos bancarios, soporte bi-moneda (tipo_cambio si USD).
// Variables de entorno: FACTURA_EMISOR_RAZON_SOCIAL, FACTURA_EMISOR_RUC,
//   FACTURA_EMISOR_DIRECCION, FACTURA_BANCO_NOMBRE, FACTURA_BANCO_CUENTA, FACTURA_BANCO_CCI
// Retorna un Buffer; pasar ese Buffer a subirPdf().
async function generarPdfBuffer(_factura, _metrica, _datos, _plan) {
  return null; // reemplazar por implementación pdfkit
}
// ─────────────────────────────────────────────────────────────────────────────

async function subirPdf(buffer, numeroFactura) {
  if (!buffer) return null;
  const supabase = getSupabaseClient();
  const path = `facturas/${numeroFactura}.pdf`;
  const { error } = await supabase.storage
    .from("facturas")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });
  if (error) {
    logger.error("facturaService: error al subir PDF", { error: error.message });
    return null;
  }
  const { data } = supabase.storage.from("facturas").getPublicUrl(path);
  return data.publicUrl;
}

async function enviarEmailFactura(_datos, _factura, _pdfBuffer) {
  // TODO: implementar con Resend cuando datos bancarios estén confirmados.
  // Usar RESEND_FROM_EMAIL / RESEND_FROM_NAME y adjuntar pdfBuffer.
}

export async function generarFactura(suscripcionId, periodo, opciones = {}) {
  const sus = await Suscripcion.findByPk(suscripcionId, {
    include: [{ model: Plan, as: "plan" }],
  });
  if (!sus) throw new Error(`Suscripción ${suscripcionId} no encontrada`);

  const periodoDate = `${periodo}-01`;

  const existe = await Factura.findOne({
    where: { suscripcion_id: suscripcionId, periodo: periodoDate },
  });
  if (existe) {
    throw Object.assign(
      new Error("Ya existe una factura para este período"),
      { code: "FACTURA_DUPLICADA" }
    );
  }

  const metrica = await calcularMetricasPeriodo(suscripcionId, periodo);

  const montoBase = parseFloat(metrica.costo_base);
  const montoExcedente =
    parseFloat(metrica.costo_excedente_usuarios) +
    parseFloat(metrica.costo_excedente_novedades);
  const subtotal = montoBase + montoExcedente;
  const montoIgv = parseFloat((subtotal * IGV).toFixed(2));
  const montoTotal = parseFloat((subtotal + montoIgv).toFixed(2));

  const moneda = sus.plan.moneda;
  const tipoCambio = moneda === "USD" ? (opciones.tipo_cambio ?? null) : null;
  if (moneda === "USD" && !tipoCambio) {
    throw new Error("tipo_cambio es requerido para facturas en USD");
  }

  const numero = await siguienteNumeroFactura();

  const factura = await Factura.create({
    suscripcion_id: suscripcionId,
    metrica_id: metrica.id,
    numero_factura: numero,
    periodo: periodoDate,
    moneda,
    tipo_cambio: tipoCambio,
    monto_base: montoBase.toFixed(2),
    monto_excedente: montoExcedente.toFixed(2),
    monto_igv: montoIgv.toFixed(2),
    monto_total: montoTotal.toFixed(2),
    estado: "pendiente",
    fecha_emision: limaDate(),
    fecha_vencimiento: limaDate(DIAS_VENCIMIENTO),
    pdf_url: null,
    notas: opciones.notas ?? null,
  });

  const datos = await DatosFacturacion.findOne();
  const pdfBuffer = await generarPdfBuffer(factura, metrica, datos, sus.plan);
  const pdfUrl = await subirPdf(pdfBuffer, numero);

  if (pdfUrl) {
    await factura.update({ pdf_url: pdfUrl });
  }

  await enviarEmailFactura(datos, factura, pdfBuffer);

  logger.info(`facturaService: factura ${numero} generada — total ${montoTotal} ${moneda}`);
  return factura;
}
