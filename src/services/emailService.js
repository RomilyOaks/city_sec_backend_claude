import nodemailer from "nodemailer";

// ============================================================
// TIMEOUTS — críticos para Railway:
// Sin timeouts, nodemailer espera hasta 2 min para conexión
// y hasta 30s para el saludo SMTP, colgando el endpoint
// completo hasta que Railway corta la conexión con 502.
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 8000,  // 8 s — falla rápido si no hay conexión TCP
  greetingTimeout: 8000,    // 8 s — tiempo máximo esperando el "220" SMTP
  socketTimeout: 15000,     // 15 s — inactividad máxima durante la sesión
});

// FROM configurable — permite usar Resend (onboarding@resend.dev en free tier)
// o cualquier cuenta SMTP. Cambiar en Railway → Variables sin tocar código.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.SMTP_USER ||
  "noreply@citysecure.com";

const FROM_NAME = process.env.RESEND_FROM_NAME || "CitySecure";

/**
 * Envía el email de recuperación de contraseña.
 * Si SMTP no está configurado (SMTP_USER vacío) loguea el reset link
 * y retorna sin lanzar error — el endpoint responde normalmente.
 */
export const enviarEmailRecuperacionPassword = async ({ email, username, resetLink }) => {
  // Guard: si no hay credenciales SMTP configuradas, no intentar conectar
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("⚠️  SMTP no configurado — email de recuperación NO enviado");
    console.warn(`   Para depurar, el reset link sería: ${resetLink}`);
    return; // No lanzar error — el controller responde con éxito igual
  }

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Recuperación de contraseña — CitySecure",
    html: `
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
    `,
  });
};
