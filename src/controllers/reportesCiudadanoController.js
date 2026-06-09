import getSupabaseClient from "../config/supabaseClient.js";
import { formatResponse, formatErrorResponse } from "../utils/responseFormatter.js";
import logger from "../utils/logger.js";
import { uploadFoto, uploadAudio } from "../services/supabaseStorageService.js";
import { transcribeAudio } from "../services/voiceGatewayBridgeService.js";

export const crearReporte = async (req, res) => {
  try {
    const { userId } = req.ciudadano;
    const {
      tipo_reporte,
      descripcion,
      latitud,
      longitud,
      telefono,
      audio_duracion_seg,
    } = req.body;

    const foto1File = req.files?.foto_1?.[0];
    const foto2File = req.files?.foto_2?.[0];
    const audioFile = req.files?.audio?.[0];

    let foto1Url = null;
    let foto2Url = null;
    let audioUrl = null;

    if (foto1File) foto1Url = await uploadFoto(userId, foto1File.buffer, foto1File.mimetype);
    if (foto2File) foto2Url = await uploadFoto(userId, foto2File.buffer, foto2File.mimetype);
    if (audioFile) audioUrl = await uploadAudio(userId, audioFile.buffer, audioFile.mimetype);

    const supabase = getSupabaseClient();

    const { data: reporte, error: dbError } = await supabase
      .schema("citysecure")
      .from("reportes_ciudadano")
      .insert({
        tipo_reporte,
        descripcion:         descripcion ?? null,
        latitud:             parseFloat(latitud),
        longitud:            parseFloat(longitud),
        telefono:            telefono ?? null,
        foto_1_url:          foto1Url,
        foto_2_url:          foto2Url,
        audio_url:           audioUrl,
        created_by:          userId,
        novedad_sync_status: "pending",
      })
      .select("id, tipo_reporte, descripcion, latitud, longitud, novedad_sync_status, created_at")
      .single();

    if (dbError) {
      logger.error("[ReportesCiudadano] Error al insertar reporte", { error: dbError, userId });
      return res.status(500).json(formatErrorResponse("Error al guardar el reporte"));
    }

    // Disparo async al Voice Gateway — no bloquea la respuesta al cliente
    if (audioFile && audioUrl) {
      setImmediate(async () => {
        try {
          const result = await transcribeAudio({
            audioBuffer:      audioFile.buffer,
            audioMimeType:    audioFile.mimetype,
            audioFilename:    audioFile.originalname,
            audioUrl,
            userId,
            incidentType:     tipo_reporte,
            location:         { lat: parseFloat(latitud), lng: parseFloat(longitud), address: "" },
            telefono:         telefono ?? undefined,
            description:      descripcion ?? undefined,
            fotoUrl1:         foto1Url ?? undefined,
            fotoUrl2:         foto2Url ?? undefined,
            audioDuracionSeg: audio_duracion_seg
              ? parseInt(audio_duracion_seg, 10)
              : undefined,
          });

          if (result.success) {
            await supabase
              .schema("citysecure")
              .from("reportes_ciudadano")
              .update({
                voice_log_id:        result.voiceLogId ?? null,
                novedad_id:          result.novedadId  ?? null,
                novedad_sync_status: result.novedadId ? "linked" : "pending",
              })
              .eq("id", reporte.id);
          }
        } catch (asyncErr) {
          logger.error("[ReportesCiudadano] Error async Voice Gateway", {
            error:     asyncErr.message,
            reporteId: reporte.id,
          });
        }
      });
    }

    return res.status(201).json(formatResponse(true, "Reporte creado exitosamente", reporte));
  } catch (err) {
    logger.error("[ReportesCiudadano] Error inesperado en crearReporte", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al crear reporte"));
  }
};

export const misReportes = async (req, res) => {
  try {
    const { userId } = req.ciudadano;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .schema("citysecure")
      .from("reportes_ciudadano")
      .select(
        "id, tipo_reporte, descripcion, latitud, longitud, " +
        "foto_1_url, foto_2_url, novedad_sync_status, novedad_id, created_at"
      )
      .eq("created_by", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("[ReportesCiudadano] Error al obtener mis reportes", { error, userId });
      return res.status(500).json(formatErrorResponse("Error al obtener reportes"));
    }

    return res.json(formatResponse(true, null, data ?? []));
  } catch (err) {
    logger.error("[ReportesCiudadano] Error inesperado en misReportes", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al obtener reportes"));
  }
};

export const eliminarReporte = async (req, res) => {
  try {
    const { userId } = req.ciudadano;
    const { id }     = req.params;
    const supabase   = getSupabaseClient();

    const { data: reporte, error: fetchError } = await supabase
      .schema("citysecure")
      .from("reportes_ciudadano")
      .select("id, created_by")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !reporte) {
      return res.status(404).json(formatErrorResponse("Reporte no encontrado"));
    }

    if (reporte.created_by !== userId) {
      return res
        .status(403)
        .json(formatErrorResponse("No tienes permiso para eliminar este reporte"));
    }

    const { error: deleteError } = await supabase
      .schema("citysecure")
      .from("reportes_ciudadano")
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq("id", id);

    if (deleteError) {
      logger.error("[ReportesCiudadano] Error al eliminar reporte", { error: deleteError, id });
      return res.status(500).json(formatErrorResponse("Error al eliminar el reporte"));
    }

    return res.json(formatResponse(true, "Reporte eliminado exitosamente"));
  } catch (err) {
    logger.error("[ReportesCiudadano] Error inesperado en eliminarReporte", { error: err.message });
    return res.status(500).json(formatErrorResponse("Error interno al eliminar reporte"));
  }
};
