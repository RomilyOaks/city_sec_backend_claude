/**
 * ============================================
 * CONFIGURACIÓN DE AUTENTICACIÓN Y SEGURIDAD
 * ============================================
 *
 * Configuraciones relacionadas con:
 * - JWT (JSON Web Tokens)
 * - Bcrypt (Hash de contraseñas)
 * - Rate Limiting
 * - Seguridad general
 */

require("dotenv").config();

/**
 * Función auxiliar para convertir tiempo legible a milisegundos
 * Ejemplo: '15m' → 900000ms, '7d' → 604800000ms
 */
const parseTime = (timeString) => {
  const units = {
    s: 1000, // segundos
    m: 60 * 1000, // minutos
    h: 60 * 60 * 1000, // horas
    d: 24 * 60 * 60 * 1000, // días
  };

  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Formato de tiempo inválido: ${timeString}`);
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
};

module.exports = {
  // ========================================
  // CONFIGURACIÓN DE JWT
  // ========================================
  jwt: {
    /**
     * Secret para firmar tokens
     * IMPORTANTE: En producción debe ser una clave fuerte y única
     * Genera una con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     */
    secret: process.env.JWT_SECRET || "tu-secret-super-seguro-cambiar-esto",

    /**
     * Tiempo de expiración del Access Token
     * Formato: '15m', '1h', '7d'
     * Recomendado: 15-30 minutos para access tokens
     */
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m",

    /**
     * Tiempo de expiración del Refresh Token
     * Formato: '7d', '30d', '90d'
     * Recomendado: 7-30 días para refresh tokens
     */
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d",

    /**
     * Algoritmo de firma
     * HS256 es el más común (HMAC con SHA-256)
     * Otras opciones: HS384, HS512, RS256 (requiere par de llaves)
     */
    algorithm: "HS256",

    /**
     * Issuer (quien emite el token)
     * Útil para validar el origen del token
     */
    issuer: "citizen-security-api",

    /**
     * Audience (para quién es el token)
     */
    audience: "citizen-security-client",
  },

  // ========================================
  // CONFIGURACIÓN DE BCRYPT
  // ========================================
  bcrypt: {
    /**
     * Rounds de salt para bcrypt
     * Más rounds = más seguro pero más lento
     * Recomendado: 10-12 para balance seguridad/performance
     * Cada incremento duplica el tiempo de proceso
     */
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },

  // ========================================
  // SEGURIDAD DE CONTRASEÑAS
  // ========================================
  password: {
    /**
     * Longitud mínima de contraseña
     */
    minLength: 8,

    /**
     * Longitud máxima de contraseña
     */
    maxLength: 128,

    /**
     * Requerir al menos una mayúscula
     */
    requireUppercase: true,

    /**
     * Requerir al menos una minúscula
     */
    requireLowercase: true,

    /**
     * Requerir al menos un número
     */
    requireNumber: true,

    /**
     * Requerir al menos un carácter especial
     */
    requireSpecialChar: true,

    /**
     * Caracteres especiales permitidos
     */
    specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",

    /**
     * Número de contraseñas anteriores que no se pueden reutilizar
     */
    historyCount: 5,

    /**
     * Días antes de que expire una contraseña (0 = nunca expira)
     */
    expirationDays: 90,
  },

  // ========================================
  // BLOQUEO DE CUENTA POR INTENTOS FALLIDOS
  // ========================================
  accountLock: {
    /**
     * Número máximo de intentos de login fallidos
     */
    maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,

    /**
     * Tiempo de bloqueo después de exceder intentos
     * Formato: '15m', '1h', '24h'
     */
    lockTime: process.env.LOCK_TIME || "15m",

    /**
     * Convertir lockTime a milisegundos
     */
    get lockTimeMs() {
      return parseTime(this.lockTime);
    },
  },

  // ========================================
  // RATE LIMITING
  // ========================================
  rateLimit: {
    /**
     * Ventana de tiempo para rate limiting
     * Formato: '15m', '1h'
     */
    windowMs: parseTime(process.env.RATE_LIMIT_WINDOW || "15m"),

    /**
     * Número máximo de requests en la ventana de tiempo
     */
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

    /**
     * Mensaje cuando se excede el límite
     */
    message:
      "Demasiadas solicitudes desde esta IP, por favor intente más tarde",

    /**
     * Incluir headers de rate limit en la respuesta
     */
    standardHeaders: true,

    /**
     * Deshabilitar headers legacy de rate limit
     */
    legacyHeaders: false,

    // Rate limiting específico para login
    login: {
      windowMs: parseTime("15m"),
      max: 5, // 5 intentos cada 15 minutos
      message: "Demasiados intentos de login, intente nuevamente en 15 minutos",
    },

    // Rate limiting específico para registro
    register: {
      windowMs: parseTime("1h"),
      max: 3, // 3 registros por hora por IP
      message: "Demasiados intentos de registro, intente nuevamente más tarde",
    },

    // Rate limiting para recuperación de contraseña
    passwordReset: {
      windowMs: parseTime("1h"),
      max: 3,
      message: "Demasiadas solicitudes de recuperación de contraseña",
    },
  },

  // ========================================
  // TOKENS DE RECUPERACIÓN/VERIFICACIÓN
  // ========================================
  tokens: {
    /**
     * Tiempo de expiración de token de verificación de email
     */
    emailVerification: {
      expiresIn: "24h",
      get expiresInMs() {
        return parseTime(this.expiresIn);
      },
    },

    /**
     * Tiempo de expiración de token de recuperación de contraseña
     */
    passwordReset: {
      expiresIn: "1h",
      get expiresInMs() {
        return parseTime(this.expiresIn);
      },
    },
  },

  // ========================================
  // 2FA / TWO-FACTOR AUTHENTICATION
  // ========================================
  twoFactor: {
    /**
     * Nombre de la aplicación en el código QR
     */
    appName: process.env.TWO_FACTOR_APP_NAME || "Seguridad Ciudadana",

    /**
     * Tamaño de la ventana de tiempo TOTP (en pasos de 30s)
     * window: 1 significa que acepta 1 código antes y 1 después
     */
    window: 1,

    /**
     * Período de tiempo de cada código TOTP (en segundos)
     */
    step: 30,

    /**
     * Número de códigos de recuperación a generar
     */
    recoveryCodesCount: 10,
  },

  // ========================================
  // SESIONES
  // ========================================
  session: {
    /**
     * Tiempo de expiración de sesión inactiva
     */
    inactivityTimeout: parseTime("30m"),

    /**
     * Tiempo máximo de vida de una sesión
     */
    maxLifetime: parseTime("12h"),

    /**
     * Número máximo de sesiones simultáneas por usuario
     */
    maxConcurrentSessions: 5,
  },

  // ========================================
  // OAUTH2
  // ========================================
  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/api/v1/auth/google/callback",
    },
    microsoft: {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL:
        process.env.MICROSOFT_CALLBACK_URL ||
        "http://localhost:3000/api/v1/auth/microsoft/callback",
    },
  },

  // ========================================
  // CORS
  // ========================================
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
};

/**
 * NOTAS IMPORTANTES:
 *
 * 1. JWT Secrets:
 *    - NUNCA uses el secret por defecto en producción
 *    - Genera un secret fuerte y único
 *    - Guárdalo de forma segura (variables de entorno, secretos de K8s, etc)
 *    - Si se compromete, TODOS los tokens quedan inválidos
 *
 * 2. Bcrypt Rounds:
 *    - 10 rounds es un buen balance
 *    - Más rounds = más seguro pero más lento
 *    - No uses menos de 10 en producción
 *
 * 3. Rate Limiting:
 *    - Protege contra ataques de fuerza bruta
 *    - Ajusta según tu tráfico esperado
 *    - Considera usar Redis para rate limiting distribuido
 *
 * 4. Políticas de Contraseña:
 *    - Ajusta según requerimientos de seguridad
 *    - Balance entre seguridad y usabilidad
 *    - Comunica claramente los requisitos al usuario
 *
 * 5. 2FA:
 *    - Altamente recomendado para usuarios administradores
 *    - Genera códigos QR para fácil configuración
 *    - Siempre ofrece códigos de recuperación
 *
 * 6. OAuth:
 *    - Simplifica login para usuarios
 *    - Requiere configuración en Google/Microsoft Console
 *    - Maneja correctamente los scopes y permisos
 */
