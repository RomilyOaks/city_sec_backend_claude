import getSupabaseClient from "../config/supabaseClient.js";
import { formatResponse, formatErrorResponse } from "../utils/responseFormatter.js";
import logger from "../utils/logger.js";

export const getPlayas = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .schema("citysecure")
      .from("playas")
      .select("id, nombre, municipalidad, activo, orden")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) {
      logger.error("[Playas] Error al obtener playas", { error });
      return res.status(500).json(formatErrorResponse("Error al obtener el catálogo de playas"));
    }

    return res.json(formatResponse(true, null, data ?? []));
  } catch (err) {
    logger.error("[Playas] Error inesperado en getPlayas", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al obtener playas"));
  }
};
