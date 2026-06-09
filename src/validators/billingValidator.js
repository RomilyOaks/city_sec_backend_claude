import { body, param, query } from "express-validator";

export const validarPeriodoParam = [
  param("periodo")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("El período debe tener formato YYYY-MM"),
];

export const validarGenerarFactura = [
  body("periodo")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("El período debe tener formato YYYY-MM"),
  body("tipo_cambio")
    .optional()
    .isFloat({ min: 0.0001 })
    .withMessage("tipo_cambio debe ser un número positivo"),
  body("notas")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("notas máximo 500 caracteres"),
];

export const validarRegistrarPago = [
  param("id").isInt({ min: 1 }).withMessage("ID de factura inválido"),
  body("fecha_pago")
    .optional()
    .isDate()
    .withMessage("fecha_pago debe ser una fecha válida (YYYY-MM-DD)"),
];

export const validarDatosFacturacion = [
  body("razon_social")
    .optional()
    .isString()
    .isLength({ min: 3, max: 200 })
    .withMessage("razon_social: 3–200 caracteres"),
  body("ruc")
    .optional()
    .matches(/^\d{11}$/)
    .withMessage("ruc debe tener 11 dígitos"),
  body("direccion_fiscal")
    .optional({ nullable: true })
    .isLength({ max: 300 })
    .withMessage("direccion_fiscal máximo 300 caracteres"),
  body("ubigeo")
    .optional({ nullable: true })
    .matches(/^\d{6}$/)
    .withMessage("ubigeo debe tener 6 dígitos"),
  body("email_facturacion")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("email_facturacion inválido"),
  body("representante_legal")
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage("representante_legal máximo 200 caracteres"),
  body("cargo_representante")
    .optional({ nullable: true })
    .isLength({ max: 100 })
    .withMessage("cargo_representante máximo 100 caracteres"),
];

export const validarCambiarPlan = [
  body("plan_id")
    .isInt({ min: 1 })
    .withMessage("plan_id debe ser un entero positivo"),
];

export const validarFiltrosFacturas = [
  query("estado")
    .optional()
    .isIn(["pendiente", "pagada", "vencida", "anulada"])
    .withMessage("estado inválido"),
  query("periodo")
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("periodo debe tener formato YYYY-MM"),
];
