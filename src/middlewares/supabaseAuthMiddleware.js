/**
 * ============================================
 * MIDDLEWARE: supabaseAuthMiddleware.js
 * ============================================
 * Valida tokens JWT emitidos por Supabase Auth.
 * Independiente de authMiddleware.js (que valida JWT interno de CitySecure).
 * Usado exclusivamente en rutas /api/v1/ciudadanos/*.
 *
 * En caso de éxito: req.ciudadano = { userId, email }
 * En caso de fallo: 401 { success: false, message: 'TOKEN_INVALIDO' }
 */

import jwt from "jsonwebtoken";
import { formatErrorResponse } from "../utils/responseFormatter.js";

export const verificarTokenCiudadano = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(
        formatErrorResponse("No se proporcionó un token de autenticación")
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.SUPABASE_JWT_SECRET;

    if (!secret) {
      return res.status(500).json(
        formatErrorResponse("Configuración de autenticación incompleta")
      );
    }

    const decoded = jwt.verify(token, secret);

    // Supabase JWT payload: sub = UUID del usuario, role = 'authenticated'
    if (decoded.role !== "authenticated") {
      return res.status(401).json(formatErrorResponse("TOKEN_INVALIDO"));
    }

    req.ciudadano = {
      userId: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json(formatErrorResponse("El token ha expirado"));
    }
    return res.status(401).json(formatErrorResponse("TOKEN_INVALIDO"));
  }
};
