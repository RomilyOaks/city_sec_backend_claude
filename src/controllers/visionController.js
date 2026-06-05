import logger from "../utils/logger.js";
import { formatResponse, formatErrorResponse } from "../utils/responseFormatter.js";

const CLAUDE_URL   = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// Prompt copiado exactamente de city_sec_patrol/src/services/visionService.js
// para garantizar que el contrato de respuesta al formulario no cambia.
const SYSTEM_PROMPT = `Eres un asistente que extrae datos de comprobantes de combustible peruanos.
Devuelve ÚNICAMENTE un JSON con estos campos (usa null si el dato no es visible):
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "proveedor": "nombre del grifo o estación",
  "tipo_combustible": "gasohol_90|gasohol_95|diesel|glp|otro",
  "galones": número_decimal,
  "precio_por_galon": número_decimal,
  "monto_total": número_decimal,
  "numero_comprobante": "serie-número (ej: E001-000123)",
  "placa_vehiculo": "placa si aparece en el comprobante"
}
No incluyas explicaciones, markdown ni texto extra. Solo el JSON.`;

export const analizarComprobante = async (req, res) => {
  const { imageBase64, mediaType } = req.body;

  try {
    const anthropicResponse = await fetch(CLAUDE_URL, {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
              {
                type: "text",
                text: "Extrae los datos de este comprobante de combustible.",
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text().catch(() => "");
      logger.warn("Anthropic API error", { status: anthropicResponse.status, body: errText });
      throw new Error(`ANTHROPIC_${anthropicResponse.status}`);
    }

    const result  = await anthropicResponse.json();
    const text    = result.content?.[0]?.text ?? "";
    const match   = text.match(/\{[\s\S]*\}/);

    if (!match) {
      logger.warn("Vision OCR: Anthropic no devolvió JSON válido", { text });
      throw new Error("PARSE_ERROR_NO_JSON");
    }

    const data = JSON.parse(match[0]);
    return res.json(formatResponse(true, "Comprobante analizado correctamente", data));

  } catch (err) {
    logger.warn("Vision OCR error", { error: err.message });
    return res.status(502).json(formatErrorResponse("Error al analizar el comprobante"));
  }
};
