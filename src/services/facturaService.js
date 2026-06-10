import { Op } from "sequelize";
import PDFDocument from "pdfkit";
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

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function simboloMoneda(moneda) {
  return moneda === "USD" ? "$" : "S/";
}

function fmtMoney(valor, moneda) {
  const numero = parseFloat(valor || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${simboloMoneda(moneda)} ${numero}`;
}

function fmtPeriodo(periodo) {
  const [anio, mes] = periodo.split("-");
  const nombreMes = MESES_ES[parseInt(mes, 10) - 1];
  return `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${anio}`;
}

function fmtFechaCorta(fecha) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

// ─── PDF DE FACTURA (pdfkit) ──────────────────────────────────────────────────
// Implementado según diseño de la sección 9 del SPEC-BILLING-001:
// emisor/cliente, tabla de conceptos (base + excedentes), subtotal/IGV/total,
// datos bancarios y soporte bi-moneda (tipo de cambio + equivalente en soles).
// Retorna un Buffer en memoria; subirPdf() lo sube al bucket privado "facturas".
async function generarPdfBuffer(factura, metrica, datos, plan) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const moneda = factura.moneda;

    // ─── Encabezado ───
    doc.font("Helvetica-Bold").fontSize(20).text("CITYSECURE", 50, 50);
    doc.font("Helvetica-Bold").fontSize(16).text("FACTURA", 0, 50, { align: "right" });
    doc.font("Helvetica").fontSize(11).text(`N° ${factura.numero_factura}`, { align: "right" });
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ─── Emisor ───
    doc.font("Helvetica-Bold").fontSize(11).text("EMISOR");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Razón Social: ${process.env.FACTURA_EMISOR_RAZON_SOCIAL || "-"}`);
    doc.text(`RUC: ${process.env.FACTURA_EMISOR_RUC || "-"}`);
    doc.text(`Dirección: ${process.env.FACTURA_EMISOR_DIRECCION || "-"}`);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ─── Cliente ───
    doc.font("Helvetica-Bold").fontSize(11).text("CLIENTE");
    doc.font("Helvetica").fontSize(10);
    if (datos) {
      doc.text(`Razón Social: ${datos.razon_social || "-"}`);
      doc.text(`RUC: ${datos.ruc || "-"}`);
      doc.text(`Dirección fiscal: ${datos.direccion_fiscal || "-"}`);
    } else {
      doc.text("Pendiente de configurar");
    }
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ─── Info de factura ───
    doc.font("Helvetica").fontSize(10);
    doc.text(`Período: ${fmtPeriodo(factura.periodo)}`);
    doc.text(`Fecha emisión: ${fmtFechaCorta(factura.fecha_emision)}`);
    doc.text(`Fecha vencimiento: ${fmtFechaCorta(factura.fecha_vencimiento)}`);
    doc.text(`Moneda: ${moneda === "USD" ? "USD (Dólares)" : "PEN (Soles)"}`);
    doc.moveDown(0.5);

    // ─── Tabla de conceptos ───
    const colDescX = 50;
    const colCantX = 380;
    const colMontoX = 440;

    doc.font("Helvetica-Bold").fontSize(10);
    let y = doc.y;
    doc.text("DESCRIPCIÓN", colDescX, y);
    doc.text("CANT.", colCantX, y, { width: 60, align: "right" });
    doc.text("MONTO", colMontoX, y, { width: 105, align: "right" });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica").fontSize(10);

    // Fila 1: cuota base
    y = doc.y;
    doc.text(`Plan ${plan.nombre} (cuota base)`, colDescX, y, { width: 320 });
    doc.text("1", colCantX, y, { width: 60, align: "right" });
    doc.text(fmtMoney(factura.monto_base, moneda), colMontoX, y, { width: 105, align: "right" });
    doc.moveDown(0.3);

    // Fila 2: usuarios adicionales (solo si hay excedente y el plan tiene tope)
    const costoExcUsuarios = parseFloat(metrica.costo_excedente_usuarios || 0);
    if (costoExcUsuarios > 0 && plan.max_usuarios != null) {
      const extraUsuarios = Math.max(0, metrica.usuarios_activos - plan.max_usuarios);
      y = doc.y;
      doc.text(`Usuarios adicionales (${extraUsuarios} extra)`, colDescX, y, { width: 320 });
      doc.text(String(extraUsuarios), colCantX, y, { width: 60, align: "right" });
      doc.text(fmtMoney(costoExcUsuarios, moneda), colMontoX, y, { width: 105, align: "right" });
      doc.moveDown(0.3);
    }

    // Fila 3: novedades extra (solo si hay excedente y el plan tiene tope)
    const costoExcNovedades = parseFloat(metrica.costo_excedente_novedades || 0);
    if (costoExcNovedades > 0 && plan.max_novedades_mes != null) {
      const extraNovedades = metrica.novedades_creadas - plan.max_novedades_mes;
      y = doc.y;
      doc.text(`Novedades extra (${extraNovedades} sobre ${plan.max_novedades_mes})`, colDescX, y, { width: 320 });
      doc.text(String(extraNovedades), colCantX, y, { width: 60, align: "right" });
      doc.text(fmtMoney(costoExcNovedades, moneda), colMontoX, y, { width: 105, align: "right" });
      doc.moveDown(0.3);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    // ─── Totales ───
    const subtotal = parseFloat(factura.monto_base) + parseFloat(factura.monto_excedente);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Subtotal: ${fmtMoney(subtotal, moneda)}`, { align: "right" });
    doc.text(`IGV (${process.env.IGV_PORCENTAJE || "18"}%): ${fmtMoney(factura.monto_igv, moneda)}`, { align: "right" });
    doc.font("Helvetica-Bold");
    doc.text(`TOTAL: ${fmtMoney(factura.monto_total, moneda)}`, { align: "right" });
    doc.font("Helvetica");
    doc.moveDown(0.5);

    // ─── Bi-moneda ───
    if (moneda === "USD" && factura.tipo_cambio) {
      const tipoCambio = parseFloat(factura.tipo_cambio);
      const equivalenteSoles = parseFloat(factura.monto_total) * tipoCambio;
      doc.text(`Tipo de cambio: S/ ${tipoCambio.toFixed(4)} por USD 1.00`, { align: "right" });
      doc.text(
        `Equivalente en soles: S/ ${equivalenteSoles.toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        { align: "right" }
      );
      doc.moveDown(0.5);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ─── Datos bancarios ───
    doc.font("Helvetica-Bold").fontSize(11).text("FORMA DE PAGO");
    doc.font("Helvetica").fontSize(10);
    doc.text("Transferencia bancaria");
    doc.text(`Banco: ${process.env.FACTURA_BANCO_NOMBRE || "Pendiente de confirmar"}`);
    doc.text(`Cuenta: ${process.env.FACTURA_BANCO_CUENTA || "Pendiente de confirmar"}`);
    doc.text(`CCI: ${process.env.FACTURA_BANCO_CCI || "Pendiente de confirmar"}`);

    doc.end();
  });
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

  // Verificar que el archivo subido es accesible (no se guarda esta URL: expira)
  const { error: signedError } = await supabase.storage
    .from("facturas")
    .createSignedUrl(path, 3600);
  if (signedError) {
    logger.error("facturaService: error al verificar PDF subido", { error: signedError.message });
    return null;
  }

  return path; // se guarda el path en facturas.pdf_url, no una URL
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
