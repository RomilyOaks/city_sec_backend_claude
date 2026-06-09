import { body } from "express-validator";

export const validateRegister = [
  body("email")
    .isEmail().withMessage("Email inválido")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
  body("username")
    .trim()
    .notEmpty().withMessage("El nombre de usuario es requerido")
    .isLength({ max: 100 }).withMessage("El nombre de usuario no puede superar 100 caracteres"),
];

export const validateLogin = [
  body("email")
    .isEmail().withMessage("Email inválido")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("La contraseña es requerida"),
];

export const validateForgotPassword = [
  body("email")
    .isEmail().withMessage("Email inválido")
    .normalizeEmail(),
];

export const validateResetPassword = [
  body("access_token")
    .notEmpty().withMessage("El token de recuperación es requerido"),
  body("password")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
];
