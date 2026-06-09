import getSupabaseClient from "../config/supabaseClient.js";
import { formatResponse, formatErrorResponse } from "../utils/responseFormatter.js";
import logger from "../utils/logger.js";

export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const supabase = getSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      email_confirm: true,
    });

    if (authError) {
      const isDuplicate =
        authError.message?.toLowerCase().includes("already") ||
        authError.code === "23505";
      if (isDuplicate) {
        return res.status(409).json(formatErrorResponse("El email ya está registrado"));
      }
      logger.error("[CiudadanosAuth] Error Supabase Auth en register", { error: authError });
      return res.status(400).json(formatErrorResponse(authError.message));
    }

    const userId = authData.user.id;

    const { error: dbError } = await supabase
      .schema("citysecure")
      .from("ciudadanos")
      .insert({ user_id: userId, username, email });

    if (dbError) {
      logger.error("[CiudadanosAuth] Error al crear perfil ciudadano", { error: dbError, userId });
    }

    return res.status(201).json(
      formatResponse(true, "Registro exitoso", {
        user: { id: userId, email, username },
      })
    );
  } catch (err) {
    logger.error("[CiudadanosAuth] Error inesperado en register", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al registrar usuario"));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json(formatErrorResponse("Credenciales inválidas"));
    }

    const { session, user } = data;

    return res.json(
      formatResponse(true, "Inicio de sesión exitoso", {
        access_token:  session.access_token,
        refresh_token: session.refresh_token,
        expires_in:    session.expires_in,
        token_type:    "Bearer",
        user: {
          id:       user.id,
          email:    user.email,
          username: user.user_metadata?.username,
        },
      })
    );
  } catch (err) {
    logger.error("[CiudadanosAuth] Error inesperado en login", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al iniciar sesión"));
  }
};

export const me = async (req, res) => {
  try {
    const { userId } = req.ciudadano;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .schema("citysecure")
      .from("ciudadanos")
      .select("id, user_id, username, email, telefono, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return res.status(404).json(formatErrorResponse("Perfil de ciudadano no encontrado"));
    }

    return res.json(formatResponse(true, null, data));
  } catch (err) {
    logger.error("[CiudadanosAuth] Error inesperado en me", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al obtener perfil"));
  }
};

export const forgotPassword = async (req, res) => {
  // Siempre responde success — evita email enumeration
  try {
    const { email } = req.body;
    const supabase  = getSupabaseClient();
    const redirectTo =
      process.env.CIUDADANOS_RESET_REDIRECT ?? "citysecure://reset-password";

    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  } catch {
    // silencioso
  }

  return res.json(
    formatResponse(
      true,
      "Si el email está registrado, recibirás un correo con instrucciones para restablecer tu contraseña"
    )
  );
};

export const resetPassword = async (req, res) => {
  try {
    const { access_token, password } = req.body;
    const supabase = getSupabaseClient();

    const { data: userData, error: userError } = await supabase.auth.getUser(access_token);

    if (userError || !userData?.user) {
      return res
        .status(401)
        .json(formatErrorResponse("El token de recuperación es inválido o ha expirado"));
    }

    const { error } = await supabase.auth.admin.updateUserById(userData.user.id, { password });

    if (error) {
      return res
        .status(400)
        .json(formatErrorResponse("No se pudo actualizar la contraseña. El enlace puede haber expirado."));
    }

    return res.json(formatResponse(true, "Contraseña actualizada exitosamente"));
  } catch (err) {
    logger.error("[CiudadanosAuth] Error inesperado en resetPassword", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al restablecer contraseña"));
  }
};
