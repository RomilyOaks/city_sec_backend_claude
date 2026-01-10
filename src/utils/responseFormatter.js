/**
 * Formatea una respuesta estándar para la API.
 *
 * @param {boolean} success - Indica si la operación fue exitosa.
 * @param {string} message - Mensaje descriptivo de la respuesta.
 * @param {object} data - Datos a incluir en la respuesta (opcional).
 * @param {object} meta - Metadatos adicionales (opcional).
 * @returns {object} Objeto de respuesta formateado.
 */
export const formatResponse = (success, message, data = {}, meta = {}) => {
  return {
    success,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
};

/**
 * Formatea una respuesta de error estándar para la API.
 *
 * @param {string} message - Mensaje de error descriptivo.
 * @param {object} errors - Objeto de errores a incluir (opcional).
 * @param {object} meta - Metadatos adicionales (opcional).
 * @returns {object} Objeto de respuesta de error formateado.
 */
export const formatErrorResponse = (message, errors = {}, meta = {}) => {
  return {
    success: false,
    message,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
};
