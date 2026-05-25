/**
 * emailService.js — Servicio de envío de correos
 *
 * Estrategia dual:
 *   1. Si RESEND_API_KEY está configurado → usa Resend HTTP API (HTTPS port 443)
 *      → Funciona en Railway (Railway bloquea SMTP 25/465/587)
 *   2. Si solo hay credenciales SMTP → usa nodemailer como fallback
 *      → Para desarrollo local o servidores sin restricción de SMTP
 */

import nodemailer from "nodemailer";
import { Resend } from "resend";

// ──────────────────────────────────────────────
// FROM configurable vía env vars
// ──────────────────────────────────────────────
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.SMTP_USER ||
  "noreply@citysecure.com";

const FROM_NAME = process.env.RESEND_FROM_NAME || "CitySecure";

// ──────────────────────────────────────────────
// Nodemailer transporter (solo se usa si no hay RESEND_API_KEY)
// Timeouts cortos para evitar colgar el endpoint en Railway
// ──────────────────────────────────────────────
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 15000,
});

// ──────────────────────────────────────────────
// Función interna: enviar con Resend SDK (HTTP)
// ──────────────────────────────────────────────
const enviarConResend = async ({ to, subject, html }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  return data;
};

// ──────────────────────────────────────────────
// Función interna: enviar con nodemailer (SMTP)
// ──────────────────────────────────────────────
const enviarConSMTP = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("⚠️  SMTP no configurado — email NO enviado");
    return null;
  }
  await smtpTransporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
};

// ──────────────────────────────────────────────
// HTML del email de recuperación de contraseña
// ──────────────────────────────────────────────
const htmlRecuperacion = (username, resetLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #4e8c1f;">CitySecure — Recuperar contraseña</h2>
    <p>Hola <strong>${username}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p style="margin: 24px 0;">
      <a href="${resetLink}"
         style="background: #4e8c1f; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Restablecer contraseña
      </a>
    </p>
    <p style="color: #666; font-size: 13px;">
      Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este mensaje.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">
      Sistema de Seguridad Ciudadana — Municipalidad
    </p>
  </div>
`;

// ──────────────────────────────────────────────
// API pública
// ──────────────────────────────────────────────

/**
 * Envía el email de recuperación de contraseña.
 * Usa Resend SDK si RESEND_API_KEY está disponible (recomendado en Railway).
 * Fallback a SMTP si solo hay credenciales nodemailer configuradas.
 */
export const enviarEmailRecuperacionPassword = async ({ email, username, resetLink }) => {
  const payload = {
    to: email,
    subject: "Recuperación de contraseña — CitySecure",
    html: htmlRecuperacion(username, resetLink),
  };

  if (process.env.RESEND_API_KEY) {
    console.log("📧 Enviando email vía Resend SDK...");
    await enviarConResend(payload);
    console.log(`✅ Email enviado vía Resend a: ${email}`);
    return;
  }

  // Fallback: SMTP
  console.log("📧 Enviando email vía SMTP...");
  await enviarConSMTP(payload);
  if (process.env.SMTP_USER) {
    console.log(`✅ Email enviado vía SMTP a: ${email}`);
  }
};
