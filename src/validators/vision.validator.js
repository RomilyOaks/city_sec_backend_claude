import { body } from "express-validator";

export const validateAnalizarComprobante = [
  body("imageBase64")
    .notEmpty().withMessage("La imagen es requerida")
    .isString().withMessage("La imagen debe ser un string base64")
    .isLength({ min: 100 }).withMessage("La imagen no parece ser un base64 válido"),

  body("mediaType")
    .notEmpty().withMessage("El tipo de media es requerido")
    .isIn(["image/jpeg", "image/png", "image/webp", "image/gif"])
    .withMessage("Tipo de media no válido. Use: image/jpeg, image/png, image/webp o image/gif"),
];
