import { body, param } from "express-validator";

export const validateCrearReporte = [
  body("tipo_reporte")
    .trim()
    .notEmpty().withMessage("El tipo de reporte es requerido"),
  body("latitud")
    .isFloat({ min: -90, max: 90 }).withMessage("Latitud inválida (-90 a 90)"),
  body("longitud")
    .isFloat({ min: -180, max: 180 }).withMessage("Longitud inválida (-180 a 180)"),
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("La descripción no puede superar 1000 caracteres"),
  body("telefono")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 }).withMessage("El teléfono no puede superar 20 caracteres"),
  body("audio_duracion_seg")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 3600 }).withMessage("Duración de audio inválida"),
];

export const validateEliminarReporte = [
  param("id")
    .isUUID().withMessage("El ID del reporte debe ser un UUID válido"),
];
