import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER;

export const enviarEmailRecuperacionPassword = async ({ email, username, resetLink }) => {
  await transporter.sendMail({
    from: `"CitySecure" <${FROM}>`,
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
